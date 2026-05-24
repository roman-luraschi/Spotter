from apps.hos.services.calculator import (
    FUEL_DURATION_MINUTES,
    FUEL_INTERVAL_MILES,
    MINUTES_PER_HOUR,
    HOSCalculator,
    TimelineEvent,
    TripWorkItem,
)
from apps.hos.services.log_sheet_builder import DailyLogBuilder
from apps.routing.services.geocoding import NominatimGeocoder
from apps.routing.services.osrm import OSRMRouter


class TripPlanner:
    def __init__(self, geocoder: NominatimGeocoder | None = None, router: OSRMRouter | None = None):
        self.geocoder = geocoder or NominatimGeocoder()
        self.router = router or OSRMRouter()
        self.hos_calculator = HOSCalculator()
        self.log_builder = DailyLogBuilder()

    def plan(self, current_location: str, pickup_location: str, dropoff_location: str, current_cycle_used_hours: float) -> dict:
        coordinates = [
            self.geocoder.geocode(current_location),
            self.geocoder.geocode(pickup_location),
            self.geocoder.geocode(dropoff_location),
        ]
        route = self.router.route(coordinates)
        work_items = self._build_work_items(route)
        hos_result = self.hos_calculator.build_timeline(work_items, current_cycle_used_hours)
        events: list[TimelineEvent] = hos_result['events']

        return {
            'route': route,
            'stops': [event.as_dict() for event in events if event.status != 'driving'],
            'hos_summary': hos_result['hos_summary'],
            'daily_logs': self.log_builder.build(events),
            'timeline': [event.as_dict() for event in events],
        }

    def _build_work_items(self, route: dict) -> list[TripWorkItem]:
        work_items: list[TripWorkItem] = []
        miles_since_fuel = 0.0

        for index, leg in enumerate(route['legs']):
            leg_items, miles_since_fuel = self._build_driving_items_for_leg(leg, miles_since_fuel)
            work_items.extend(leg_items)

            if index == 0:
                work_items.append(
                    TripWorkItem(
                        type='pickup',
                        status='on_duty_not_driving',
                        duration_minutes=MINUTES_PER_HOUR,
                        location=leg['end_label'],
                        description='Pickup loading time.',
                    )
                )
            elif index == 1:
                work_items.append(
                    TripWorkItem(
                        type='dropoff',
                        status='on_duty_not_driving',
                        duration_minutes=MINUTES_PER_HOUR,
                        location=leg['end_label'],
                        description='Drop-off unloading time.',
                    )
                )

        return work_items

    def _build_driving_items_for_leg(self, leg: dict, miles_since_fuel: float) -> tuple[list[TripWorkItem], float]:
        remaining_miles = leg['distance_miles']
        remaining_minutes = int(round(leg['duration_hours'] * MINUTES_PER_HOUR))
        items: list[TripWorkItem] = []

        while remaining_miles > 0 and remaining_minutes > 0:
            miles_until_fuel = FUEL_INTERVAL_MILES - miles_since_fuel
            segment_miles = min(remaining_miles, miles_until_fuel)
            segment_minutes = max(1, int(round(remaining_minutes * (segment_miles / remaining_miles))))
            items.append(
                TripWorkItem(
                    type='driving',
                    status='driving',
                    duration_minutes=segment_minutes,
                    distance_miles=segment_miles,
                    location=leg['end_label'],
                    description=f"Drive toward {leg['end_label']}.",
                )
            )

            remaining_miles = round(remaining_miles - segment_miles, 6)
            remaining_minutes -= segment_minutes
            miles_since_fuel += segment_miles

            if miles_since_fuel >= FUEL_INTERVAL_MILES and remaining_miles > 0:
                items.append(
                    TripWorkItem(
                        type='fuel',
                        status='on_duty_not_driving',
                        duration_minutes=FUEL_DURATION_MINUTES,
                        location=leg['end_label'],
                        description='Fuel stop required every 1,000 miles.',
                    )
                )
                miles_since_fuel = 0.0

        return items, miles_since_fuel
