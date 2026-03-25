import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function PaymentCardItem({ card, sx, ...other }) {
  return (
    <Paper
      variant="outlined"
      sx={[
        {
          p: 2.5,
          gap: 1,
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        icon={card.cardType === 'visa' ? 'logos:visa' : 'logos:mastercard'}
        width={36}
      />

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2">**** **** **** {card.cardNumber}</Typography>
      </Box>

      <IconButton size="small">
        <Iconify icon="solar:trash-bin-trash-bold" width={20} />
      </IconButton>
    </Paper>
  );
}
