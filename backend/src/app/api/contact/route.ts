import { z } from 'zod';
import { db } from '@/lib/db';
import { sendEmail, shopInbox } from '@/lib/email';
import { handle, json, rateLimit, readJson } from '@/lib/http';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  topic: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(5000),
});

// POST /api/contact: saves the message and forwards it to the shop's inbox.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'contact', 5, 10 * 60_000);
  const msg = await readJson(request, contactSchema);
  await db.contactMessage.create({ data: { ...msg, email: msg.email.toLowerCase() } });

  const inbox = shopInbox();
  if (inbox) {
    await sendEmail({
      to: inbox,
      replyTo: msg.email,
      subject: `Website message${msg.topic ? ` (${msg.topic})` : ''} from ${msg.name}`,
      text: `${msg.name} <${msg.email}>\n\n${msg.message}`,
    }).catch((err) => console.error('[contact] Email failed:', err));
  }
  return json({ ok: true });
});
