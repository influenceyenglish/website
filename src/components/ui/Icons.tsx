export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="currentColor"
        stroke="#f2efea"
        strokeWidth="3"
      />
      <path
        d="m12 18 4 4 8-8"
        stroke="#f2efea"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeatureIcon({ name }: { name: string }) {
  return (
    <img
      src={`/icons/${name}.svg`}
      width={40}
      height={40}
      alt=""
      aria-hidden="true"
    />
  );
}
