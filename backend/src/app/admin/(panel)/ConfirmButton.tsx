'use client';

/** A submit button that asks for confirmation before its form is sent. */
export default function ConfirmButton({
  message,
  className,
  label,
  title,
  children,
}: {
  message: string;
  className?: string;
  /** Accessible name, for icon-only buttons. */
  label?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={className}
      aria-label={label}
      title={title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
