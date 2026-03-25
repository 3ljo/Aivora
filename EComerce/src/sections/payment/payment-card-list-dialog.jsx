import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemButton from '@mui/material/ListItemButton';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function PaymentCardListDialog({ list, open, onClose, selected, onSelect, action, title = 'Select card' }) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>

      <Box sx={{ px: 1 }}>
        {list.map((card) => (
          <ListItemButton
            key={card.id}
            selected={selected(card.id)}
            onClick={() => {
              onSelect(card);
              onClose();
            }}
            sx={{ borderRadius: 1, gap: 1.5 }}
          >
            <Iconify
              icon={card.cardType === 'visa' ? 'logos:visa' : 'logos:mastercard'}
              width={36}
            />
            <Box sx={{ flexGrow: 1, typography: 'subtitle2' }}>
              **** **** **** {card.cardNumber}
            </Box>
          </ListItemButton>
        ))}
      </Box>

      <DialogActions>
        {action}
        <Button color="inherit" variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
