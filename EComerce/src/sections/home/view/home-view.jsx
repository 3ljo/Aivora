'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { useGetProducts } from 'src/actions/product';

import { Iconify } from 'src/components/iconify';
import { BackToTopButton } from 'src/components/animate/back-to-top-button';
import { ScrollProgress, useScrollProgress } from 'src/components/animate/scroll-progress';

import { ProductItem } from '../../../sections/product/product-item';
import { useCheckoutContext } from '../../../sections/checkout/context';

// ----------------------------------------------------------------------

const CATEGORIES = [
  { label: 'Shoes', icon: 'solar:shoes-bold-duotone', color: 'primary' },
  { label: 'Apparel', icon: 'solar:shirt-bold-duotone', color: 'secondary' },
  { label: 'Accessories', icon: 'solar:watch-round-bold-duotone', color: 'info' },
  { label: 'Men', icon: 'solar:user-bold-duotone', color: 'success' },
  { label: 'Women', icon: 'solar:women-bold-duotone', color: 'warning' },
  { label: 'Kids', icon: 'solar:baby-bold-duotone', color: 'error' },
];

// ----------------------------------------------------------------------

export function HomeView() {
  const pageProgress = useScrollProgress();
  const { products } = useGetProducts();

  const featuredProducts = products.slice(0, 8);
  const newArrivals = products.slice(0, 4);

  return (
    <>
      <ScrollProgress
        variant="linear"
        progress={pageProgress.scrollYProgress}
        sx={[(theme) => ({ position: 'fixed', zIndex: theme.zIndex.appBar + 1 })]}
      />

      <BackToTopButton />

      {/* Hero Banner */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 'auto', md: '92vh' },
          display: 'flex',
          alignItems: 'center',
          background: `radial-gradient(ellipse at 20% 50%, ${theme.vars.palette.grey[900]} 0%, #0a0a0a 100%)`,
          color: 'common.white',
        })}
      >
        {/* Animated mesh gradient background */}
        <Box
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            background: `
              radial-gradient(600px circle at 15% 35%, ${theme.vars.palette.primary.main}30, transparent 60%),
              radial-gradient(500px circle at 85% 20%, ${theme.vars.palette.info.main}18, transparent 50%),
              radial-gradient(400px circle at 70% 80%, ${theme.vars.palette.warning.main}15, transparent 50%)
            `,
            pointerEvents: 'none',
          })}
        />
        {/* Grid pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 0 } }}>
          <Grid container spacing={6} alignItems="center">
            {/* Left — Copy */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
                <Box sx={{ width: 40, height: 2, bgcolor: 'primary.main', borderRadius: 1 }} />
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.light', fontWeight: 700, letterSpacing: 3 }}
                >
                  New Collection 2026
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 300,
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                Elevate Your
              </Typography>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 900,
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                  lineHeight: 1,
                  letterSpacing: -2,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.vars.palette.primary.light}, ${theme.vars.palette.info.light})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Style
              </Typography>
              <Typography
                sx={{
                  mb: 4,
                  fontWeight: 300,
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                With Every Order
              </Typography>

              <Typography
                variant="body1"
                sx={{ mb: 5, fontWeight: 400, opacity: 0.5, maxWidth: 420, lineHeight: 1.8, fontSize: '1.05rem' }}
              >
                Curated collections. Premium quality. Free shipping on orders over $50 and hassle-free 30-day returns.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6 }}>
                <Button
                  component={RouterLink}
                  href={paths.product.root}
                  size="large"
                  variant="contained"
                  color="primary"
                  endIcon={<Iconify icon="solar:arrow-right-linear" />}
                  sx={{
                    px: 4.5,
                    py: 1.75,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: 1.5,
                    boxShadow: (theme) => `0 12px 32px ${theme.vars.palette.primary.main}40`,
                  }}
                >
                  Explore Collection
                </Button>
                <Button
                  component={RouterLink}
                  href={paths.product.root}
                  size="large"
                  variant="text"
                  sx={{
                    px: 3,
                    py: 1.75,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'common.white',
                    opacity: 0.7,
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                  startIcon={<Iconify icon="solar:play-circle-bold" />}
                >
                  Watch Lookbook
                </Button>
              </Stack>

              {/* Trust stats with dividers */}
              <Stack
                direction="row"
                divider={<Box sx={{ width: 1, height: 40, bgcolor: 'rgba(255,255,255,0.1)' }} />}
                spacing={4}
              >
                {[
                  { value: '10K+', label: 'Products', icon: 'solar:box-bold-duotone' },
                  { value: '50K+', label: 'Happy Customers', icon: 'solar:users-group-rounded-bold-duotone' },
                  { value: '4.8/5', label: 'Avg Rating', icon: 'solar:star-bold-duotone' },
                ].map((stat) => (
                  <Stack key={stat.label} spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon={stat.icon} width={18} sx={{ color: 'primary.light', opacity: 0.7 }} />
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {stat.value}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.4, fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            {/* Right — Visual showcase */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative', height: 520 }}>
                {/* Main product card */}
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    top: 20,
                    left: '10%',
                    width: 280,
                    height: 360,
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: theme.vars.palette.grey[800],
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                  })}
                >
                  <Iconify icon="solar:hanger-2-bold-duotone" width={80} sx={{ opacity: 0.3, color: 'primary.light' }} />
                  <Typography variant="subtitle2" sx={{ opacity: 0.5 }}>Premium Apparel</Typography>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>NEW</Typography>
                  </Box>
                </Box>

                {/* Secondary card */}
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    top: 100,
                    right: 0,
                    width: 240,
                    height: 300,
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: theme.vars.palette.grey[800],
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                  })}
                >
                  <Iconify icon="solar:sneakers-bold-duotone" width={70} sx={{ opacity: 0.3, color: 'info.light' }} />
                  <Typography variant="subtitle2" sx={{ opacity: 0.5 }}>Trending Now</Typography>
                </Box>

                {/* Floating price tag */}
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    bottom: 80,
                    left: '5%',
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'common.white',
                    color: 'text.primary',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  })}
                >
                  <Box
                    sx={(theme) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: theme.vars.palette.success.lighter || '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Iconify icon="solar:delivery-bold" width={22} sx={{ color: 'success.dark' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Free Shipping</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Orders $50+</Typography>
                  </Box>
                </Box>

                {/* Star rating floating card */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 40,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'common.white',
                    color: 'text.primary',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={0.25}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Iconify key={star} icon="solar:star-bold" width={16} sx={{ color: 'warning.main' }} />
                    ))}
                  </Stack>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>4.8/5</Typography>
                </Box>

                {/* Discount badge */}
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    bottom: 20,
                    right: 30,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: theme.vars.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    boxShadow: `0 8px 24px ${theme.vars.palette.error.main}55`,
                  })}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', lineHeight: 1 }}>-30%</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem' }}>OFF</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Stack sx={{ position: 'relative', bgcolor: 'background.default' }}>
        {/* Categories */}
        <Container sx={{ py: { xs: 6, md: 10 } }}>
          <Typography variant="h3" sx={{ mb: 5, textAlign: 'center' }}>
            Shop by Category
          </Typography>

          <Box
            sx={{
              gap: 2,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.label}
                component={RouterLink}
                href={`${paths.product.root}?category=${cat.label}`}
                icon={<Iconify icon={cat.icon} />}
                label={cat.label}
                color={cat.color}
                variant="soft"
                clickable
                sx={{ px: 2, py: 3, fontSize: '1rem', fontWeight: 600 }}
              />
            ))}
          </Box>
        </Container>

        {/* Featured Products */}
        <Box sx={(theme) => ({ bgcolor: theme.vars.palette.background.neutral, py: { xs: 6, md: 10 } })}>
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
              <Typography variant="h3">Featured Products</Typography>
              <Button
                component={RouterLink}
                href={paths.product.root}
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              >
                View All
              </Button>
            </Box>

            <Grid container spacing={3}>
              {featuredProducts.map((product) => (
                <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <ProductItem product={product} detailsHref={paths.product.details(product.id)} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Promo Banner */}
        <Box
          sx={(theme) => ({
            py: { xs: 8, md: 10 },
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.vars.palette.error.darker || '#7a0c2e'} 0%, ${theme.vars.palette.error.dark} 50%, ${theme.vars.palette.warning.dark} 100%)`,
            color: 'common.white',
          })}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              left: '10%',
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              right: '15%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    mb: 3,
                    borderRadius: 5,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Iconify icon="solar:fire-bold" width={18} sx={{ color: 'warning.light' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Limited Time Offer
                  </Typography>
                </Box>

                <Typography
                  variant="h2"
                  sx={{
                    mb: 1,
                    fontWeight: 900,
                    fontSize: { xs: '2.25rem', md: '3.5rem' },
                    lineHeight: 1.1,
                  }}
                >
                  Summer Sale
                </Typography>

                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 800,
                    fontSize: { xs: '3rem', md: '5rem' },
                    lineHeight: 1,
                    background: 'linear-gradient(90deg, #FFD666, #FFAB00)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Up to 50% Off
                </Typography>

                <Typography variant="h6" sx={{ mb: 4, fontWeight: 400, opacity: 0.75, maxWidth: 440 }}>
                  Score incredible deals on thousands of styles. New markdowns added daily — don&apos;t wait, these won&apos;t last!
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button
                    component={RouterLink}
                    href={paths.product.root}
                    size="large"
                    variant="contained"
                    color="warning"
                    startIcon={<Iconify icon="solar:bag-bold" />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      color: 'grey.900',
                      boxShadow: '0 8px 24px rgba(255,171,0,0.35)',
                    }}
                  >
                    Shop the Sale
                  </Button>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.7 }}>
                    <Iconify icon="solar:clock-circle-bold" width={20} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Ends in 3 days
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 320,
                    height: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Pulsing ring */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.15)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 20,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Box
                    sx={{
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: '4.5rem', lineHeight: 1 }}>
                      50%
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, opacity: 0.9, mt: -0.5 }}>
                      OFF
                    </Typography>
                  </Box>

                  {/* Floating tag */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 0,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'warning.main',
                      color: 'grey.900',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>BEST DEALS</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* New Arrivals */}
        <Container sx={{ py: { xs: 6, md: 10 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Typography variant="h3">New Arrivals</Typography>
            <Button
              component={RouterLink}
              href={paths.product.root}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            >
              View All
            </Button>
          </Box>

          <Grid container spacing={3}>
            {newArrivals.map((product) => (
              <Grid key={product.id} size={{ xs: 6, sm: 6, md: 3 }}>
                <ProductItem product={product} detailsHref={paths.product.details(product.id)} />
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Trust Badges */}
        <Box sx={(theme) => ({ bgcolor: theme.vars.palette.background.neutral, py: { xs: 6, md: 8 } })}>
          <Container>
            <Grid container spacing={4}>
              {[
                { icon: 'solar:delivery-bold-duotone', title: 'Free Shipping', desc: 'On orders over $50' },
                { icon: 'solar:shield-check-bold-duotone', title: 'Secure Payment', desc: '100% secure checkout' },
                { icon: 'solar:refresh-circle-bold-duotone', title: 'Easy Returns', desc: '30-day return policy' },
                { icon: 'solar:chat-round-dots-bold-duotone', title: '24/7 Support', desc: 'Dedicated support team' },
              ].map((item) => (
                <Grid key={item.title} size={{ xs: 6, md: 3 }}>
                  <Stack alignItems="center" spacing={1.5} sx={{ textAlign: 'center' }}>
                    <Iconify icon={item.icon} width={48} sx={{ color: 'primary.main' }} />
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.desc}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Stack>
    </>
  );
}
