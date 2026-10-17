/**
 * The Matata mark: a map pin (the location) holding a house (the building
 * footprint), with an amber dot (the resident's report attached to it).
 * Inline SVG so it needs no network request and stays crisp at any size.
 * Size it with height classes; the width follows the 5:6 viewBox.
 */
export function MatataIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      style={{ aspectRatio: '5 / 6' }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M50 116 C42 100 10 80 10 46 A40 40 0 1 1 90 46 C90 80 58 100 50 116 Z" fill="#006EB5" />
      <path d="M50 21 L77 45 L70 45 L70 69 L30 69 L30 45 L23 45 Z" fill="#FFFFFF" />
      <rect x="45" y="55" width="10" height="14" rx="1" fill="#006EB5" />
      <circle cx="71" cy="27" r="9" fill="#FBC412" stroke="#006EB5" strokeWidth="4" />
    </svg>
  );
}
