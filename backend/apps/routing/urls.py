from django.urls import path

from apps.routing.views import LocationSearchView

urlpatterns = [
    path('locations/search/', LocationSearchView.as_view(), name='location-search'),
]
