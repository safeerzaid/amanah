import 'server-only';
import { db } from './db';

/** All categories in display order. */
export const listCategories = () => db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });

/** "Anklets & Toe Rings" → "anklets-toe-rings": the id used in URLs and Product.category. */
export const categorySlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Product.category value for a product taken out of every category ("Remove" on the Categories page). */
export const UNCATEGORISED = '';
