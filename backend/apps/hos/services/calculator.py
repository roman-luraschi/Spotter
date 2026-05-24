from dataclasses import dataclass, field
from typing import Literal

DutyStatus = Literal['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving']
EventType = Literal[
    'driving',
    'pickup',
    'dropoff',
    'fuel',
    'rest_break',
    'sleeper_berth',
    'cycle_restart',
]

MINUTES_PER_HOUR = 60
DRIVING_LIMIT_MINUTES = 11 * MINUTES_PER_HOUR
DUTY_WINDOW_MINUTES = 14 * MINUTES_PER_HOUR
BREAK_TRIGGER_MINUTES = 8 * MINUTES_PER_HOUR
BREAK_MINUTES = 30
DAILY_RESET_MINUTES = 10 * MINUTES_PER_HOUR
CYCLE_LIMIT_MINUTES = 70 * MINUTES_PER_HOUR
CYCLE_RESTART_MINUTES = 34 * MINUTES_PER_HOUR
FUEL_INTERVAL_MILES = 1000
FUEL_DURATION_MINUTES = 30


@dataclass(frozen=True)
class TripWorkItem:
    type: EventType
    status: DutyStatus
    duration_minutes: int
    distance_miles: float = 0
    location: str = ''
    description: str = ''


@dataclass(frozen=True)
class TimelineEvent:
    type: EventType
    status: DutyStatus
    start_minute: int
    end_minute: int
    duration_minutes: int
    distance_miles: float = 0
    location: str = ''
    description: str = ''

    def as_dict(self) -> dict:
        return {
            'type': self.type,
            'status': self.status,
            'start_minute': self.start_minute,
            'end_minute': self.end_minute,
            'duration_minutes': self.duration_minutes,
            'duration_hours': round(self.duration_minutes / MINUTES_PER_HOUR, 2),
            'distance_miles': round(self.distance_miles, 2),
            'location': self.location,
            'description': self.description,
        }


@dataclass
class HOSState:
    current_minute: int = 0
    shift_start_minute: int | None = None
    driving_since_daily_reset: int = 0
    driving_since_break: int = 0
    cycle_used_minutes: int = 0
    events: list[TimelineEvent] = field(default_factory=list)
    violations: list[str] = field(default_factory=list)


class HOSCalculator:
    def build_timeline(self, work_items: list[TripWorkItem], current_cycle_used_hours: float) -> dict:
        state = HOSState(cycle_used_minutes=int(round(current_cycle_used_hours * MINUTES_PER_HOUR)))

        for item in work_items:
            if item.status == 'driving':
                self._schedule_driving(state, item)
            else:
                self._schedule_non_driving_work(state, item)

        return {
            'events': state.events,
            'hos_summary': {
                'cycle_rule': '70/8',
                'current_cycle_used_hours': round(current_cycle_used_hours, 2),
                'remaining_cycle_hours_start': round((CYCLE_LIMIT_MINUTES - int(round(current_cycle_used_hours * MINUTES_PER_HOUR))) / MINUTES_PER_HOUR, 2),
                'remaining_cycle_hours_end': round(max(CYCLE_LIMIT_MINUTES - state.cycle_used_minutes, 0) / MINUTES_PER_HOUR, 2),
                'violations': state.violations,
            },
        }

    def _schedule_driving(self, state: HOSState, item: TripWorkItem) -> None:
        remaining_minutes = item.duration_minutes
        remaining_miles = item.distance_miles
        miles_per_minute = remaining_miles / remaining_minutes if remaining_minutes else 0

        while remaining_minutes > 0:
            self._ensure_can_start_driving(state)

            available = min(
                remaining_minutes,
                DRIVING_LIMIT_MINUTES - state.driving_since_daily_reset,
                BREAK_TRIGGER_MINUTES - state.driving_since_break,
                self._remaining_duty_window(state),
                CYCLE_LIMIT_MINUTES - state.cycle_used_minutes,
            )

            if available <= 0:
                self._insert_required_rest(state)
                continue

            segment_miles = available * miles_per_minute
            self._append_event(
                state,
                TripWorkItem(
                    type='driving',
                    status='driving',
                    duration_minutes=available,
                    distance_miles=segment_miles,
                    location=item.location,
                    description=item.description,
                ),
            )
            state.driving_since_daily_reset += available
            state.driving_since_break += available
            state.cycle_used_minutes += available
            remaining_minutes -= available
            remaining_miles = max(remaining_miles - segment_miles, 0)

            if remaining_minutes > 0:
                self._insert_required_rest(state)

    def _schedule_non_driving_work(self, state: HOSState, item: TripWorkItem) -> None:
        if item.status in {'on_duty_not_driving', 'driving'}:
            self._ensure_cycle_available(state, item.duration_minutes)
            self._ensure_shift_started(state)

        self._append_event(state, item)

        if item.status == 'on_duty_not_driving':
            state.cycle_used_minutes += item.duration_minutes
            if item.duration_minutes >= BREAK_MINUTES:
                state.driving_since_break = 0
        elif item.status in {'off_duty', 'sleeper_berth'}:
            self._apply_rest_effects(state, item.duration_minutes)

    def _ensure_can_start_driving(self, state: HOSState) -> None:
        self._ensure_cycle_available(state, 1)
        self._ensure_shift_started(state)

    def _ensure_cycle_available(self, state: HOSState, required_minutes: int) -> None:
        if state.cycle_used_minutes + required_minutes <= CYCLE_LIMIT_MINUTES:
            return
        self._append_event(
            state,
            TripWorkItem(
                type='cycle_restart',
                status='off_duty',
                duration_minutes=CYCLE_RESTART_MINUTES,
                description='34-hour restart to reset the 70-hour/8-day cycle.',
            ),
        )
        state.cycle_used_minutes = 0
        state.shift_start_minute = None
        state.driving_since_daily_reset = 0
        state.driving_since_break = 0

    def _insert_required_rest(self, state: HOSState) -> None:
        if state.cycle_used_minutes >= CYCLE_LIMIT_MINUTES:
            self._ensure_cycle_available(state, 1)
            return

        if state.driving_since_break >= BREAK_TRIGGER_MINUTES and self._remaining_duty_window(state) >= BREAK_MINUTES:
            self._append_event(
                state,
                TripWorkItem(
                    type='rest_break',
                    status='off_duty',
                    duration_minutes=BREAK_MINUTES,
                    description='30-minute break after 8 cumulative driving hours.',
                ),
            )
            state.driving_since_break = 0
            return

        self._append_event(
            state,
            TripWorkItem(
                type='sleeper_berth',
                status='sleeper_berth',
                duration_minutes=DAILY_RESET_MINUTES,
                description='10-hour sleeper berth reset for daily driving and duty clocks.',
            ),
        )
        self._apply_rest_effects(state, DAILY_RESET_MINUTES)

    def _remaining_duty_window(self, state: HOSState) -> int:
        if state.shift_start_minute is None:
            return DUTY_WINDOW_MINUTES
        elapsed = state.current_minute - state.shift_start_minute
        return max(DUTY_WINDOW_MINUTES - elapsed, 0)

    def _ensure_shift_started(self, state: HOSState) -> None:
        if state.shift_start_minute is None:
            state.shift_start_minute = state.current_minute

    def _apply_rest_effects(self, state: HOSState, duration_minutes: int) -> None:
        if duration_minutes >= DAILY_RESET_MINUTES:
            state.shift_start_minute = None
            state.driving_since_daily_reset = 0
            state.driving_since_break = 0
        elif duration_minutes >= BREAK_MINUTES:
            state.driving_since_break = 0

    def _append_event(self, state: HOSState, item: TripWorkItem) -> None:
        if item.duration_minutes <= 0:
            return
        start = state.current_minute
        end = start + item.duration_minutes
        state.events.append(
            TimelineEvent(
                type=item.type,
                status=item.status,
                start_minute=start,
                end_minute=end,
                duration_minutes=item.duration_minutes,
                distance_miles=item.distance_miles,
                location=item.location,
                description=item.description,
            )
        )
        state.current_minute = end
