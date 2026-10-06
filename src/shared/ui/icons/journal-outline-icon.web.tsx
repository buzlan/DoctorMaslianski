import type { IconProps } from "./icon-props";

export function JournalOutlineIcon({ size, color }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke={color}
      strokeLinejoin="round"
      strokeWidth={32}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <rect width="320" height="416" x="96" y="48" rx="48" ry="48" />
      <path d="M320 48v416" strokeWidth={60} />
    </svg>
  );
}
