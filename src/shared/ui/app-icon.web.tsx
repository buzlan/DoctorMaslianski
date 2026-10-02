import { createElement } from "react";
import type { ColorValue } from "react-native";

import { theme } from "@/shared/theme";

import { APP_ICON_NAMES, type AppIconName } from "./app-icon-names";
import { resolveWebIcon, warnUnknownWebIcon } from "./app-icon-web-map";

export { APP_ICON_NAMES };
export type { AppIconName };

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
};

function paintColor(color: ColorValue): string {
  return typeof color === "string" ? color : theme.colors.light.textPrimary;
}

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  const resolved = resolveWebIcon(name);
  if (!resolved.known) {
    warnUnknownWebIcon(name);
  }

  const ink = paintColor(color);
  const filled = resolved.glyph.paint === "fill";

  return createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: filled ? ink : "none",
      stroke: filled ? "none" : ink,
      strokeWidth: filled ? 0 : 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      focusable: "false",
      style: { display: "block" },
    },
    ...resolved.glyph.paths.map((d, index) =>
      createElement("path", { key: `${name}-${index}`, d }),
    ),
  );
}
