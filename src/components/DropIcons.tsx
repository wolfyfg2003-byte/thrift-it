export function BellIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M6.2 9.4a5.8 5.8 0 0 1 11.6 0c0 3.4.9 4.8 1.5 5.6.3.4 0 1-.5 1H5.2c-.5 0-.8-.6-.5-1 .6-.8 1.5-2.2 1.5-5.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M10 18.4a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoltIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.2 3.2 6.4 13.1c-.28.4 0 .9.48.9h4.22l-.7 6.4c-.08.7.8 1.1 1.24.55l6.9-9.9c.27-.4 0-.9-.48-.9h-4.3l.78-6.4c.08-.68-.8-1.08-1.24-.55Z" />
    </svg>
  );
}
