'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetProducts } from 'src/actions/product';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { ProductItem } from '../../product/product-item';

// ----------------------------------------------------------------------

function getWishlistIds() {
  try {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------

export function WishlistView() {
  const { products } = useGetProducts();
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    setWishlistIds(getWishlistIds());
  }, []);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleClearAll = useCallback(() => {
    localStorage.setItem('wishlist', '[]');
    setWishlistIds([]);
  }, []);

  return (
    <Container sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Box>
          <Typography variant="h3">My Wishlist</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {wishlistProducts.length > 0 && (
            <Button variant="soft" color="error" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
          <Button
            component={RouterLink}
            href={paths.product.root}
            variant="contained"
            startIcon={<Iconify icon="solar:bag-bold" />}
          >
            Continue Shopping
          </Button>
        </Stack>
      </Box>

      {wishlistProducts.length === 0 ? (
        <EmptyContent
          filled
          title="Your wishlist is empty"
          description="Browse our products and add items you love!"
          sx={{ py: 10 }}
          action={
            <Button
              component={RouterLink}
              href={paths.product.root}
              variant="contained"
              startIcon={<Iconify icon="solar:bag-bold" />}
              sx={{ mt: 2 }}
            >
              Start Shopping
            </Button>
          }
        />
      ) : (
        <Grid container spacing={3}>
          {wishlistProducts.map((product) => (
            <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <ProductItem product={product} detailsHref={paths.product.details(product.id)} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
