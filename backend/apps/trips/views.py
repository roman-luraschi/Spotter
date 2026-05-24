from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.trips.serializers import TripPlanRequestSerializer
from apps.trips.services.trip_planner import TripPlanner


class TripPlanView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = TripPlanner().plan(**serializer.validated_data)
        return Response(plan, status=status.HTTP_200_OK)
