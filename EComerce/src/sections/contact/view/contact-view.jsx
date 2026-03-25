'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { Map, MapMarker, MapControls } from 'src/components/map';

// ----------------------------------------------------------------------

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
});

// ----------------------------------------------------------------------

export function ContactView() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Message sent successfully!');
    reset();
  };

  return (
    <Container sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h3" sx={{ mb: 1, textAlign: 'center' }}>
        Contact Us
      </Typography>
      <Typography variant="body1" sx={{ mb: 5, textAlign: 'center', color: 'text.secondary' }}>
        Have a question or need help? We&apos;d love to hear from you.
      </Typography>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {[
              {
                icon: 'solar:map-point-bold-duotone',
                title: 'Visit Us',
                desc: '123 Commerce Street, New York, NY 10001',
              },
              {
                icon: 'solar:phone-bold-duotone',
                title: 'Call Us',
                desc: '+1 (555) 123-4567',
              },
              {
                icon: 'solar:letter-bold-duotone',
                title: 'Email Us',
                desc: 'support@ecommerce.com',
              },
              {
                icon: 'solar:clock-circle-bold-duotone',
                title: 'Working Hours',
                desc: 'Mon - Fri: 9AM - 6PM EST',
              },
            ].map((item) => (
              <Card key={item.title} sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Iconify icon={item.icon} width={40} sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle1">{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      {...register('name')}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      {...register('email')}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Subject"
                  {...register('subject')}
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                />

                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  {...register('message')}
                  error={!!errors.message}
                  helperText={errors.message?.message}
                />

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={isSubmitting}
                  startIcon={<Iconify icon="solar:plain-bold" />}
                >
                  Send Message
                </LoadingButton>
              </Stack>
            </form>
          </Card>
        </Grid>
      </Grid>

      {/* Map Section */}
      <Card sx={{ mt: 5, borderRadius: 2, overflow: 'hidden' }}>
        <Map
          initialViewState={{
            latitude: 40.7128,
            longitude: -74.006,
            zoom: 14,
          }}
          sx={{ height: 400 }}
        >
          <MapControls />
          <MapMarker latitude={40.7128} longitude={-74.006} />
        </Map>
      </Card>
    </Container>
  );
}
