from django.urls import include, path

urlpatterns = [
    path('api/', include('apps.core.urls')),
    path('api/routing/', include('apps.routing.urls')),
    path('api/trips/', include('apps.trips.urls')),
]
