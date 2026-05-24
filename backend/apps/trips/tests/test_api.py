from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from apps.routing.exceptions import RoutingError
from apps.trips.views import TripPlanView


class TripPlanAPITests(SimpleTestCase):
    def test_rejects_invalid_cycle_hours(self):
        request = APIRequestFactory().post(
            '/api/trips/plan/',
            {
                'current_location': 'Chicago, IL',
                'pickup_location': 'St. Louis, MO',
                'dropoff_location': 'Dallas, TX',
                'current_cycle_used_hours': 71,
            },
            format='json',
        )

        response = TripPlanView.as_view()(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error']['code'], 'VALIDATION_ERROR')
        self.assertEqual(response.data['error']['message'], 'Invalid request data.')
        self.assertIn('current_cycle_used_hours', response.data['error']['details'])

    @patch('apps.trips.views.TripPlanner')
    def test_returns_structured_routing_error(self, planner_cls):
        planner_cls.return_value.plan.side_effect = RoutingError(
            'Routing provider failed',
            code='ROUTING_PROVIDER_FAILED',
        )
        request = APIRequestFactory().post(
            '/api/trips/plan/',
            {
                'current_location': 'Chicago, IL',
                'pickup_location': 'St. Louis, MO',
                'dropoff_location': 'Dallas, TX',
                'current_cycle_used_hours': 10,
            },
            format='json',
        )

        response = TripPlanView.as_view()(request)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data['error']['code'], 'ROUTING_PROVIDER_FAILED')
        self.assertEqual(response.data['error']['message'], 'Routing provider failed')

    @patch('apps.trips.views.TripPlanner')
    def test_returns_trip_plan(self, planner_cls):
        planner_cls.return_value.plan.return_value = {
            'route': {},
            'stops': [],
            'hos_summary': {},
            'daily_logs': [],
            'timeline': [],
        }
        request = APIRequestFactory().post(
            '/api/trips/plan/',
            {
                'current_location': 'Chicago, IL',
                'pickup_location': 'St. Louis, MO',
                'dropoff_location': 'Dallas, TX',
                'current_cycle_used_hours': 10,
            },
            format='json',
        )

        response = TripPlanView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        planner_cls.return_value.plan.assert_called_once()
