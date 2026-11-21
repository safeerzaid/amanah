/**
 * Every admin page's guide, in one place. A step without `target` is a centred
 * card; a step whose target isn't on the page (an empty list, say) also falls
 * back to a centred card, so a guide never breaks.
 *
 * Targets are CSS selectors, mostly `[data-tour="…"]` attributes on the pages.
 */
export type TourStep = {
  target?: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
};

const t = (name: string) => `[data-tour="${name}"]`;

export const TOURS: Record<string, TourStep[]> = {
  dashboard: [
    { title: 'Welcome to your Amanah admin', body: 'This short guide shows you around. Each page has its own guide, and the ? button at the top replays it any time.' },
    { target: t('sidebar'), title: 'Your menu', body: 'Every part of the shop is one click away: orders, products, coupons, shipping and more.', placement: 'right' },
    { target: t('dash-tiles'), title: 'Today at a glance', body: 'Orders waiting to ship, payments still pending, your product count and new enquiries.' },
    { target: t('dash-sales'), title: 'Sales, last 14 days', body: 'Each bar is one day of paid orders. Hover a bar to see that day’s total.' },
    { target: t('dash-stock'), title: 'Stock alerts', body: 'Sold-out pieces are listed here. Mark one back in stock with a single click.' },
    { target: t('add-product'), title: 'Add a product', body: 'Create a new piece for the shop. You can add photos straight after.' },
    { target: t('topbar'), title: 'Shop, alerts and help', body: 'Open your live shop, check notifications, change settings, or press ? to replay this page’s guide.', placement: 'bottom' },
  ],
  orders: [
    { title: 'Orders', body: 'Every order placed on the shop, newest first.' },
    { target: t('filters'), title: 'Filter by status', body: 'Show only paid, shipped, pending or cancelled orders.' },
    { target: t('orders-table'), title: 'Open an order', body: 'Click an order to see its items, the customer’s address and payment details, and to change its status.' },
  ],
  order: [
    { target: t('order-status'), title: 'Order status', body: 'Change the status as the order moves along, for example to Shipped once it has left.' },
    { target: t('order-items'), title: 'What was ordered', body: 'Items, quantities, any coupon discount, the shipping charge and the total paid.' },
    { target: t('order-customer'), title: 'Customer and address', body: 'Who ordered and where to send it. Click the email to write to them.' },
  ],
  payments: [
    { title: 'Payments', body: 'Card payments taken through Razorpay at checkout.' },
    { target: t('payments-tiles'), title: 'Totals', body: 'How much has been received, and how much has been refunded.' },
    { target: t('payments-table'), title: 'Every payment', body: 'Each paid order with its Razorpay payment reference, for matching against your bank.' },
  ],
  returns: [
    { title: 'Returns and cancellations', body: 'Orders you have cancelled or refunded are listed here.' },
    { target: t('returns-table'), title: 'Recording a return', body: 'Open the order and set its status to Refunded. Issue the refund itself in your Razorpay dashboard.' },
  ],
  products: [
    { title: 'Products', body: 'Every piece in your shop. Changes appear on the shop straight away.' },
    { target: t('add-product'), title: 'Add a product', body: 'Create a new piece. Name and price are all you need to start.' },
    { target: t('filters'), title: 'Filter by category', body: 'Show one category at a time, or the pieces with no category.' },
    { target: t('product-actions'), title: 'Edit or delete', body: 'The pencil opens a product to change it; the bin removes it from the shop.', placement: 'left' },
  ],
  productNew: [
    { target: t('product-form'), title: 'Product details', body: 'Give it a name, category and price. A sale price shows a discount on the shop.' },
    { target: t('product-switches'), title: 'Show it how you like', body: 'In stock, Featured on the home page, and the “New” tag.' },
    { target: t('save'), title: 'Create it', body: 'Press the button to add the product. You can then upload its photos.', placement: 'top' },
  ],
  productEdit: [
    { target: t('product-photos'), title: 'Photos', body: 'The first photo is the main one. Use the star to make another photo the main one.', placement: 'right' },
    { target: t('photo-upload'), title: 'Add photos', body: 'Drop photos here or click to choose. JPEG, PNG, WebP or AVIF, up to 8 MB.', placement: 'right' },
    { target: t('product-form'), title: 'Details', body: 'Change the name, price, description or category.', placement: 'left' },
    { target: t('save'), title: 'Save changes', body: 'Nothing changes on the shop until you save.', placement: 'top' },
    { target: t('product-delete'), title: 'Delete', body: 'Removes the product and its photos for good.', placement: 'bottom' },
  ],
  categories: [
    { title: 'Categories', body: 'Group your pieces, such as Necklaces or Rings. Shoppers filter the shop by them.' },
    { target: t('category-add'), title: 'Add a category', body: 'Type a name and press Add. Its web address is made from the name.' },
    { target: t('category-actions'), title: 'Edit or delete', body: 'The pencil renames it and lists its products; the bin deletes it and moves its products to another category.', placement: 'left' },
  ],
  contents: [
    { title: 'Your shop’s words and photos', body: 'Edit the text and pictures on each page of the shop. Products and categories have their own pages.' },
    { target: t('filters'), title: 'Pick a page', body: 'Each tab is a part of the shop: site-wide details, Home, About and the other pages.' },
    { target: t('content-group'), title: 'Sections', body: 'Click a section to open it. The count shows what’s inside and how much you have edited.' },
    { target: '.content-group[open] .photo-tile', title: 'Photos', body: 'Upload a new photo, choose one already on your site, or remove it.' },
    { target: t('preview'), title: 'Preview first', body: 'See exactly how the shop will look, on a computer or a phone, before anything goes live.', placement: 'top' },
    { target: t('save'), title: 'Then save', body: 'Saving puts your changes on the shop.', placement: 'top' },
  ],
  inventory: [
    { title: 'Inventory', body: 'Which pieces are in stock and which are sold out.' },
    { target: t('stock-toggle'), title: 'Sold out or back in stock', body: 'One click marks a piece sold out on the shop, or available again.', placement: 'left' },
  ],
  shipping: [
    { title: 'Shipping', body: 'Set what delivery costs, and send out paid orders.' },
    { target: t('zone-form'), title: 'Delivery zones', body: 'A zone covers PIN codes or whole states, with its own rate, free-delivery amount and delivery time.' },
    { target: t('zone-list'), title: 'Your zones', body: 'The checkout picks the zone that matches the shopper’s address. Pause or delete a zone here.' },
    { target: t('to-ship'), title: 'Orders to send', body: 'Paid orders waiting to go out. Press Mark shipped once each has left.' },
  ],
  customers: [
    { title: 'Customers', body: 'Everyone who has paid for an order, sorted by how much they have spent.' },
    { target: t('customers-table'), title: 'Customer list', body: 'Click an email to write to a customer.' },
  ],
  coupons: [
    { title: 'Coupons', body: 'Discount codes shoppers enter at checkout.' },
    { target: t('coupon-form'), title: 'Create a code', body: 'Choose a percentage or a fixed amount off, with an optional minimum order, end date and usage limit.' },
    { target: t('coupon-list'), title: 'Your codes', body: 'See how often each code has been used. Pause, resume or delete it here.' },
  ],
  reviews: [{ title: 'Reviews', body: 'Customer reviews will appear here once reviews are switched on for the shop.' }],
  reports: [
    { title: 'Reports', body: 'How the shop is doing over time.' },
    { target: t('report-tiles'), title: 'Totals', body: 'Sales, paid orders and the average order value.' },
    { target: t('report-months'), title: 'Month by month', body: 'Sales for each of the last 12 months.' },
    { target: t('report-best'), title: 'Best sellers', body: 'Your most popular pieces.' },
  ],
  messages: [
    { title: 'Enquiries', body: 'Messages sent through the shop’s contact form, newest first.' },
    { target: t('enquiry'), title: 'Reply by email', body: 'Click the sender’s email to answer them from your own inbox.' },
    { target: t('subscribers'), title: 'Newsletter', body: 'Everyone who signed up for the newsletter on the shop.' },
  ],
  settings: [
    { target: t('settings-store'), title: 'Store', body: 'Your shop’s name, set on the server.' },
    { target: t('settings-contact'), title: 'Contact details', body: 'The email and phone shown on the shop. Press Save after changing them.' },
  ],
};

/** The guide that belongs to an admin URL, e.g. /admin/orders/abc → "order". */
export function pageKeyFor(pathname: string): string | null {
  const parts = pathname.replace(/\/+$/, '').split('/').slice(2); // drop "", "admin"
  if (parts.length === 0) return 'dashboard';
  const [section, sub] = parts;
  if (section === 'orders' && sub) return 'order';
  if (section === 'products' && sub === 'new') return 'productNew';
  if (section === 'products' && sub) return 'productEdit';
  return sub ? null : section;
}
