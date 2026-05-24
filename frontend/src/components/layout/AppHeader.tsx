import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { AppBar, Box, Toolbar, Typography } from '@mui/material'

export function AppHeader() {
  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          minHeight: { xs: 72, md: 80 },
          px: { xs: 3, md: 4 },
        }}
      >
        <Box alignItems="center" display="flex" gap={1.5}>
          <Box
            alignItems="center"
            bgcolor="rgba(230, 138, 36, 0.1)"
            borderRadius={2}
            color="primary.main"
            display="flex"
            height={40}
            justifyContent="center"
            width={40}
          >
            <LocalShippingOutlinedIcon aria-hidden="true" fontSize="medium" />
          </Box>
          <Typography color="text.primary" fontWeight={700} variant="h5">
            Spotter
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
