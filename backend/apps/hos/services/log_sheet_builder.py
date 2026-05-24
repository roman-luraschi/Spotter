from collections import defaultdict

from apps.hos.services.calculator import MINUTES_PER_HOUR, TimelineEvent

MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR
STATUSES = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving']


class DailyLogBuilder:
    def build(self, events: list[TimelineEvent]) -> list[dict]:
        if not events:
            return []

        last_minute = max(event.end_minute for event in events)
        day_count = max(1, (last_minute + MINUTES_PER_DAY - 1) // MINUTES_PER_DAY)
        logs = []

        for day_index in range(day_count):
            day_start = day_index * MINUTES_PER_DAY
            day_end = day_start + MINUTES_PER_DAY
            grid_segments = []
            totals = defaultdict(int)
            remarks = []

            for event in events:
                overlap_start = max(event.start_minute, day_start)
                overlap_end = min(event.end_minute, day_end)
                if overlap_start >= overlap_end:
                    continue

                duration = overlap_end - overlap_start
                totals[event.status] += duration
                grid_segments.append(
                    {
                        'status': event.status,
                        'start_hour': round((overlap_start - day_start) / MINUTES_PER_HOUR, 2),
                        'end_hour': round((overlap_end - day_start) / MINUTES_PER_HOUR, 2),
                        'duration_hours': round(duration / MINUTES_PER_HOUR, 2),
                        'event_type': event.type,
                        'location': event.location,
                        'description': event.description,
                    }
                )

                if event.location or event.description:
                    remarks.append(
                        {
                            'time_hour': round((overlap_start - day_start) / MINUTES_PER_HOUR, 2),
                            'event_type': event.type,
                            'location': event.location,
                            'description': event.description,
                        }
                    )

            off_duty_gaps = self._build_off_duty_gaps(grid_segments)
            for gap in off_duty_gaps:
                totals['off_duty'] += int((gap['end_hour'] - gap['start_hour']) * MINUTES_PER_HOUR)
            grid_segments.extend(off_duty_gaps)
            grid_segments.sort(key=lambda segment: (segment['start_hour'], segment['status']))

            logs.append(
                {
                    'date_index': day_index + 1,
                    'grid_segments': grid_segments,
                    'totals': {
                        status: round(totals[status] / MINUTES_PER_HOUR, 2)
                        for status in STATUSES
                    },
                    'remarks': remarks,
                }
            )

        return logs

    def _build_off_duty_gaps(self, grid_segments: list[dict]) -> list[dict]:
        busy = sorted(
            (segment['start_hour'], segment['end_hour'])
            for segment in grid_segments
        )
        gaps = []
        cursor = 0.0
        for start, end in busy:
            if start > cursor:
                gaps.append(self._off_duty_gap(cursor, start))
            cursor = max(cursor, end)
        if cursor < 24:
            gaps.append(self._off_duty_gap(cursor, 24))
        return gaps

    def _off_duty_gap(self, start_hour: float, end_hour: float) -> dict:
        return {
            'status': 'off_duty',
            'start_hour': round(start_hour, 2),
            'end_hour': round(end_hour, 2),
            'duration_hours': round(end_hour - start_hour, 2),
            'event_type': 'off_duty',
            'location': '',
            'description': 'Off duty gap.',
        }
