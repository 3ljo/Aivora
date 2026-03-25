import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export function PaymentCardCreateForm({ sx, ...other }) {
  return (
    <Box
      sx={[
        { gap: 2.5, display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <TextField fullWidth label="Card number" placeholder="XXXX XXXX XXXX XXXX" />
      <TextField fullWidth label="Card holder" placeholder="John Doe" />
      <Box sx={{ gap: 2, display: 'flex' }}>
        <TextField fullWidth label="Expiry date" placeholder="MM/YY" />
        <TextField fullWidth label="CVV" placeholder="***" />
      </Box>
    </Box>
  );
}
