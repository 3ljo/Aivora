import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  user: icon('ic-user'),
  order: icon('ic-order'),
  product: icon('ic-product'),
  ecommerce: icon('ic-ecommerce'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData = [
  {
    subheader: 'Overview',
    items: [
      { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.ecommerce },
    ],
  },
  {
    subheader: 'Management',
    items: [
      {
        title: 'Products',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        children: [
          { title: 'List', path: paths.dashboard.product.root },
          { title: 'Create', path: paths.dashboard.product.new },
        ],
      },
      {
        title: 'Orders',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        children: [
          { title: 'List', path: paths.dashboard.order.root },
        ],
      },
      {
        title: 'Customers',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'List', path: paths.dashboard.user.list },
          { title: 'Account', path: paths.dashboard.user.account, deepMatch: true },
        ],
      },
    ],
  },
];
