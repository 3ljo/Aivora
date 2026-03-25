import { CONFIG } from 'src/global-config';

import { WishlistView } from 'src/sections/wishlist/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Wishlist - ${CONFIG.appName}` };

export default function Page() {
  return <WishlistView />;
}
