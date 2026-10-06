import type { IconProps } from "./icon-props";

export function ClipboardOutlineIcon({ size, color }: IconProps) {
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
      <path d="M336 64h32a48 48 0 0 1 48 48v320a48 48 0 0 1-48 48H144a48 48 0 0 1-48-48V112a48 48 0 0 1 48-48h32" />
      <rect width="160" height="64" x="176" y="32" rx="26.13" ry="26.13" />
    </svg>
  );
}
