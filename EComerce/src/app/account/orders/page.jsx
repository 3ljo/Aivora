import { CONFIG } from 'src/global-config';

import { AccountOrdersView } from 'src/sections/account-orders/view';

// ----------------------------------------------------------------------

export const metadata = { title: `My Orders - ${CONFIG.appName}` };

export default function Page() {
  return <AccountOrdersView />;
}
