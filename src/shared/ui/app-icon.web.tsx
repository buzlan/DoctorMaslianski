import { createElement } from "react";
import type { ColorValue } from "react-native";

import { theme } from "@/shared/theme";

import { APP_ICON_NAMES, type AppIconName } from "./app-icon-names";
import { resolveWebIcon, warnUnknownWebIcon } from "./app-icon-web-map";
import { HomeIcon } from "./icons/home-icon.web";
import { HomeOutlineIcon } from "./icons/home-outline-icon.web";
import { ClipboardOutlineIcon } from "./icons/clipboard-outline-icon.web";
import { JournalOutlineIcon } from "./icons/journal-outline-icon.web";
import { CameraOutlineIcon } from "./icons/camera-outline-icon.web";

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
  const ink = paintColor(color);
  switch (name) {
    case "camera-outline":
      return <CameraOutlineIcon size={size} color={ink} />;
    case "home":
      return <HomeIcon size={size} color={ink} />;
    case "home-outline":
      return <HomeOutlineIcon size={size} color={ink} />;
    case "clipboard":
    case "clipboard-outline":
      return <ClipboardOutlineIcon size={size} color={ink} />;
    case "book":
    case "book-outline":
      return <JournalOutlineIcon size={size} color={ink} />;
  }

  const resolved = resolveWebIcon(name);
  if (!resolved.known) {
    warnUnknownWebIcon(name);
  }

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
