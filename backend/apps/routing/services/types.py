from dataclasses import dataclass


@dataclass(frozen=True)
class Coordinate:
    label: str
    latitude: float
    longitude: float

    def as_osrm_pair(self) -> str:
        return f'{self.longitude},{self.latitude}'

    def as_dict(self) -> dict:
        return {
            'label': self.label,
            'latitude': self.latitude,
            'longitude': self.longitude,
        }


@dataclass(frozen=True)
class RouteLeg:
    start_label: str
    end_label: str
    distance_miles: float
    duration_hours: float

    def as_dict(self) -> dict:
        return {
            'start_label': self.start_label,
            'end_label': self.end_label,
            'distance_miles': round(self.distance_miles, 2),
            'duration_hours': round(self.duration_hours, 2),
        }
