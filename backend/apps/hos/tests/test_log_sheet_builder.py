from django.test import SimpleTestCase

from apps.hos.services.calculator import TimelineEvent
from apps.hos.services.log_sheet_builder import DailyLogBuilder


class DailyLogBuilderTests(SimpleTestCase):
    def test_builds_24_hour_totals_with_off_duty_gaps(self):
        logs = DailyLogBuilder().build(
            [
                TimelineEvent(
                    type='driving',
                    status='driving',
                    start_minute=6 * 60,
                    end_minute=8 * 60,
                    duration_minutes=2 * 60,
                ),
                TimelineEvent(
                    type='pickup',
                    status='on_duty_not_driving',
                    start_minute=8 * 60,
                    end_minute=9 * 60,
                    duration_minutes=60,
                ),
            ]
        )

        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0]['totals']['driving'], 2)
        self.assertEqual(logs[0]['totals']['on_duty_not_driving'], 1)
        self.assertEqual(logs[0]['totals']['off_duty'], 21)
