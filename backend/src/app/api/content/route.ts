import { savedContent } from '@/lib/content';
import { handle, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

// GET /api/content: the storefront text and photos edited on the Contents page.
// Only edited values are returned; everything else keeps the storefront's own copy.
export const GET = handle(async () => json({ content: await savedContent() }));
