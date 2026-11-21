import { useEffect, useState } from 'react';
import { Loader2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import SocialLinks from '../components/SocialLinks';
import SelectMenu from '../components/SelectMenu';
import { whatsappUrl } from '../components/ContactList';
import { Field, Notice, PageHeader } from '../components/ui';
import { site } from '../data/site';
import { text } from '../data/content';
import { sendContactMessage, NotConfiguredError } from '../utils/api';
import { isValidEmail } from '../utils/format';

const topics = ['General enquiry', 'A product', 'An order', 'Gifting', 'Something else'].map((t) => ({ id: t, label: t }));
const empty = { name: '', email: '', topic: topics[0].id, message: '' };

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email.';
  else if (!isValidEmail(v.email)) e.email = 'Please enter a valid email address.';
  if (v.message.trim().length < 10) e.message = 'Please write a message of at least 10 characters.';
  return e;
}

export default function Contact() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState({ state: 'idle' });
  const wa = whatsappUrl('Hello Amanah Jewellery, I have a question.');

  useEffect(() => {
    document.title = `Contact | ${site.name}`;
  }, []);

  const set = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`ct-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setStatus({ state: 'loading' });
    try {
      await sendContactMessage(values);
      setStatus({ state: 'sent' });
      setValues(empty);
      setSubmitted(false);
    } catch (err) {
      setStatus(err instanceof NotConfiguredError ? { state: 'blocked' } : { state: 'error', message: err.message });
    }
  };

  const err = (k) => errors[k];
  const aria = (k) => ({ 'aria-invalid': Boolean(err(k)), 'aria-describedby': err(k) ? `ct-${k}-error` : undefined });

  const { email, phone, address } = site.contact;
  const details = [
    { icon: Mail, label: 'Email', value: email, href: email && `mailto:${email}` },
    { icon: Phone, label: 'Phone', value: phone, href: phone && `tel:${phone.replace(/\s/g, '')}` },
    { icon: MessageCircle, label: 'WhatsApp', value: wa && 'Chat with us', href: wa },
    { icon: MapPin, label: 'Boutique', value: address },
  ];

  return (
    <>
      <PageHeader
        title={text('contact.title', 'Contact us')}
        intro={text('contact.intro', 'Questions about a piece, an order or a gift? Send us a message.')}
        crumbs={[{ label: 'Contact' }]}
      />
      <section className="container contact2 page-pad-b">
        <ul className="contact2__details">
          {details.map(({ icon: Icon, label, value, href }) => (
            <li key={label}>
              <span className="contact2__icon">
                <Icon size={17} strokeWidth={1.4} />
              </span>
              <span>
                <span className="contact2__label">{label}</span>
                {value ? (
                  href ? (
                    <a href={href} className="contact2__value" target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {value}
                    </a>
                  ) : (
                    <span className="contact2__value">{value}</span>
                  )
                ) : (
                  <span className="contact2__value is-soon">Coming soon</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <form className="contact2__card" onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            <Field label="Name" id="ct-name" error={err('name')}>
              <input id="ct-name" name="name" autoComplete="name" value={values.name} onChange={set} {...aria('name')} />
            </Field>
            <Field label="Email" id="ct-email" error={err('email')}>
              <input id="ct-email" name="email" type="email" autoComplete="email" value={values.email} onChange={set} {...aria('email')} />
            </Field>
            <div className="span-2 field">
              <SelectMenu
                className="contact2__topic"
                label="Topic"
                value={values.topic}
                options={topics}
                onChange={(v) => setValues((s) => ({ ...s, topic: v }))}
              />
            </div>
            <div className="span-2">
              <Field label="Message" id="ct-message" error={err('message')}>
                <textarea id="ct-message" name="message" rows={5} value={values.message} onChange={set} {...aria('message')} />
              </Field>
            </div>
          </div>

          {status.state === 'blocked' && (
            <Notice tone="warn" title="The contact form is not connected yet">
              <p>Your message has not been sent. Please use one of the contact options above once they are available.</p>
            </Notice>
          )}
          {status.state === 'error' && (
            <Notice tone="error" title="Your message could not be sent">
              <p>{status.message}</p>
            </Notice>
          )}
          {status.state === 'sent' && (
            <Notice tone="success" title="Message sent">
              <p>Thank you for writing to us. We will reply as soon as we can.</p>
            </Notice>
          )}

          <div className="contact2__foot">
            <SocialLinks variant="round-light" />
            <button type="submit" className="btn btn--primary" disabled={status.state === 'loading'}>
              {status.state === 'loading' ? (
                <>
                  <Loader2 size={17} className="spin" /> Sending…
                </>
              ) : (
                'Send message'
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
