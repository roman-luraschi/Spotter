import { Box, Stack, Typography } from '@mui/material'

import { dutyStatusColors } from '@/lib/design/hos-colors'
import { dutyStatusLabels, formatHours } from '@/lib/format'
import type { DailyLogTotals, DutyStatus } from '@/types/trip'

interface LogTotalsProps {
  totals: DailyLogTotals
}

const statuses: DutyStatus[] = [
  'off_duty',
  'sleeper_berth',
  'driving',
  'on_duty_not_driving',
]

export function LogTotals({ totals }: LogTotalsProps) {
  return (
    <Box display="grid" gap={1.5} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}>
      {statuses.map((status) => (
        <Box
          border="1px solid"
          borderColor="divider"
          borderRadius={2}
          bgcolor="background.default"
          key={status}
          p={1.5}
        >
          <Stack alignItems="center" direction="row" gap={1}>
            <Box bgcolor={dutyStatusColors[status].hex} borderRadius="50%" height={10} width={10} />
            <Typography color="text.secondary" fontSize={12}>
              {dutyStatusLabels[status]}
            </Typography>
          </Stack>
          <Typography color="text.primary" fontWeight={700} mt={1} variant="body1">
            {formatHours(totals[status])}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
