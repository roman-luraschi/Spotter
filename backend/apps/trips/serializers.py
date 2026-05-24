from rest_framework import serializers


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255, trim_whitespace=True)
    pickup_location = serializers.CharField(max_length=255, trim_whitespace=True)
    dropoff_location = serializers.CharField(max_length=255, trim_whitespace=True)
    current_cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)

    def validate(self, attrs):
        locations = [
            attrs['current_location'],
            attrs['pickup_location'],
            attrs['dropoff_location'],
        ]
        if any(not location.strip() for location in locations):
            raise serializers.ValidationError('All locations are required.')
        return attrs
