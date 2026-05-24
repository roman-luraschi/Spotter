from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from apps.routing.exceptions import RoutingError
from apps.routing.services.geocoding import LocationSuggestion
from apps.routing.views import LocationSearchView


class LocationSearchAPITests(SimpleTestCase):
    def test_returns_empty_list_for_short_query(self):
        request = APIRequestFactory().get('/api/routing/locations/search/', {'q': 'C'})
        response = LocationSearchView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    @patch('apps.routing.views.NominatimGeocoder')
    def test_returns_location_suggestions(self, geocoder_cls):
        geocoder_cls.return_value.search.return_value = [
            LocationSuggestion(
                label='Chicago, Illinois',
                display_name='Chicago, Cook County, Illinois, United States',
                latitude=41.8781,
                longitude=-87.6298,
            )
        ]
        request = APIRequestFactory().get('/api/routing/locations/search/', {'q': 'Chicago'})
        response = LocationSearchView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['label'], 'Chicago, Illinois')
        geocoder_cls.return_value.search.assert_called_once_with('Chicago')

    @patch('apps.routing.views.NominatimGeocoder')
    def test_returns_structured_location_search_error(self, geocoder_cls):
        geocoder_cls.return_value.search.side_effect = RoutingError(
            'Location search failed for "Chicago"',
            code='LOCATION_SEARCH_FAILED',
            details={'query': 'Chicago'},
        )
        request = APIRequestFactory().get('/api/routing/locations/search/', {'q': 'Chicago'})

        response = LocationSearchView.as_view()(request)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data['error']['code'], 'LOCATION_SEARCH_FAILED')
        self.assertEqual(response.data['error']['message'], 'Location search failed for "Chicago"')
        self.assertEqual(response.data['error']['details'], {'query': 'Chicago'})
