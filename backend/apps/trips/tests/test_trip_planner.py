from django.test import SimpleTestCase

from apps.routing.services.types import Coordinate
from apps.trips.services.trip_planner import TripPlanner


class FakeGeocoder:
    def geocode(self, query):
        return Coordinate(label=query, latitude=0, longitude=0)


class FakeRouter:
    def route(self, coordinates):
        return {
            'total_miles': 650,
            'estimated_drive_hours': 10,
            'geometry': {'type': 'LineString', 'coordinates': []},
            'waypoints': [coordinate.as_dict() for coordinate in coordinates],
            'legs': [
                {
                    'start_label': coordinates[0].label,
                    'end_label': coordinates[1].label,
                    'distance_miles': 250,
                    'duration_hours': 4,
                },
                {
                    'start_label': coordinates[1].label,
                    'end_label': coordinates[2].label,
                    'distance_miles': 400,
                    'duration_hours': 6,
                },
            ],
        }


class TripPlannerTests(SimpleTestCase):
    def test_plan_returns_route_stops_logs_and_timeline(self):
        plan = TripPlanner(geocoder=FakeGeocoder(), router=FakeRouter()).plan(
            current_location='Chicago, IL',
            pickup_location='St. Louis, MO',
            dropoff_location='Dallas, TX',
            current_cycle_used_hours=12,
        )

        self.assertIn('route', plan)
        self.assertIn('daily_logs', plan)
        self.assertIn('timeline', plan)
        self.assertEqual(plan['stops'][0]['type'], 'pickup')
        self.assertTrue(any(stop['type'] == 'dropoff' for stop in plan['stops']))
        self.assertEqual(plan['hos_summary']['cycle_rule'], '70/8')
