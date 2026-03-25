'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { _orders } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const STATUS_MAP = {
  pending: { color: 'warning', label: 'Pending' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'error', label: 'Cancelled' },
  refunded: { color: 'default', label: 'Refunded' },
};

// ----------------------------------------------------------------------

export function AccountOrdersView() {
  const orders = _orders.slice(0, 10);

  return (
    <Container sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Box>
          <Typography variant="h3">My Orders</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Track and manage your orders
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          href={paths.product.root}
          variant="contained"
          startIcon={<Iconify icon="solar:bag-bold" />}
        >
          Continue Shopping
        </Button>
      </Box>

      {orders.length === 0 ? (
        <EmptyContent
          filled
          title="No orders yet"
          description="Start shopping to see your orders here!"
          sx={{ py: 10 }}
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          #{order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{fDate(order.createdAt)}</TableCell>
                      <TableCell>{order.totalQuantity} item{order.totalQuantity > 1 ? 's' : ''}</TableCell>
                      <TableCell>{fCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="soft"
                          label={statusInfo.label}
                          color={statusInfo.color}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.order.details(order.id)}
                          size="small"
                          variant="soft"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Container>
  );
}
