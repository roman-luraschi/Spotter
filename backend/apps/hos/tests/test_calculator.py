from django.test import SimpleTestCase

from apps.hos.services.calculator import HOSCalculator, TripWorkItem


class HOSCalculatorTests(SimpleTestCase):
    def test_inserts_thirty_minute_break_after_eight_driving_hours(self):
        result = HOSCalculator().build_timeline(
            [
                TripWorkItem(
                    type='driving',
                    status='driving',
                    duration_minutes=9 * 60,
                    distance_miles=540,
                )
            ],
            current_cycle_used_hours=0,
        )

        events = result['events']

        self.assertEqual(events[0].status, 'driving')
        self.assertEqual(events[0].duration_minutes, 8 * 60)
        self.assertEqual(events[1].type, 'rest_break')
        self.assertEqual(events[1].duration_minutes, 30)
        self.assertEqual(events[2].status, 'driving')
        self.assertEqual(events[2].duration_minutes, 60)

    def test_inserts_ten_hour_reset_when_daily_drive_limit_is_reached(self):
        result = HOSCalculator().build_timeline(
            [
                TripWorkItem(
                    type='driving',
                    status='driving',
                    duration_minutes=12 * 60,
                    distance_miles=720,
                )
            ],
            current_cycle_used_hours=0,
        )

        self.assertTrue(any(event.type == 'sleeper_berth' for event in result['events']))

    def test_inserts_cycle_restart_when_seventy_hour_cycle_is_exhausted(self):
        result = HOSCalculator().build_timeline(
            [
                TripWorkItem(
                    type='driving',
                    status='driving',
                    duration_minutes=2 * 60,
                    distance_miles=120,
                )
            ],
            current_cycle_used_hours=69,
        )

        self.assertTrue(any(event.type == 'cycle_restart' for event in result['events']))
        self.assertEqual(result['hos_summary']['remaining_cycle_hours_end'], 69)
