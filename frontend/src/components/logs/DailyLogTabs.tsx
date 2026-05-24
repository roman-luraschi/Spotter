import { useState } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'

import type { DailyLog } from '@/types/trip'
import { DailyLogSheet } from './DailyLogSheet'

interface DailyLogTabsProps {
  logs: DailyLog[]
}

export function DailyLogTabs({ logs }: DailyLogTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeLog = logs[activeIndex]

  if (logs.length === 0) {
    return (
      <Box border="1px dashed" borderColor="divider" borderRadius={2} color="text.secondary" p={2.5}>
        No daily logs were returned for this trip.
      </Box>
    )
  }

  return (
    <Box minWidth={0}>
      <Tabs
        allowScrollButtonsMobile
        onChange={(_, nextIndex: number) => setActiveIndex(nextIndex)}
        sx={{ mb: 2.5, maxWidth: '100%' }}
        value={activeIndex}
        variant="scrollable"
      >
        {logs.map((log) => (
          <Tab key={log.date_index} label={`Day ${log.date_index}`} />
        ))}
      </Tabs>

      {activeLog ? <DailyLogSheet key={activeIndex} log={activeLog} /> : null}
      {!activeLog ? (
        <Typography color="text.secondary" variant="body2">
          Select a day to view its ELD duty status grid.
        </Typography>
      ) : null}
    </Box>
  )
}
