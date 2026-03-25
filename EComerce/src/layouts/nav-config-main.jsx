import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData = [
  { title: 'Home', path: '/', icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" /> },
  {
    title: 'Shop',
    path: paths.product.root,
    icon: <Iconify width={22} icon="solar:bag-bold-duotone" />,
  },
  {
    title: 'Pages',
    path: '/pages',
    icon: <Iconify width={22} icon="solar:file-bold-duotone" />,
    children: [
      {
        subheader: 'E-Commerce',
        items: [
          { title: 'Shop', path: paths.product.root },
          { title: 'Checkout', path: paths.product.checkout },
          { title: 'Wishlist', path: paths.wishlist },
          { title: 'My Orders', path: paths.account.orders },
        ],
      },
      {
        subheader: 'Support',
        items: [
          { title: 'Contact Us', path: paths.contact },
        ],
      },
      {
        subheader: 'Dashboard',
        items: [{ title: 'Admin Dashboard', path: CONFIG.auth.redirectPath }],
      },
    ],
  },
  {
    title: 'Contact',
    path: paths.contact,
    icon: <Iconify width={22} icon="solar:chat-round-dots-bold-duotone" />,
  },
];
