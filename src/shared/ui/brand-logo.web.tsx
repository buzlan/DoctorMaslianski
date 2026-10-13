import { createElement, useId, type ReactNode } from "react";

const PATHS = [
  "M20.1 13.2C20.1 9.5 23.1 6.7 27.2 6.7C32.2 6.7 36 10.6 36 15.6V22.5",
  "M43.1 21.3C47 21.9 49.6 25.1 49.6 29C49.6 33.8 45.9 37.2 41.1 37.2H30.2",
  "M19.5 35.4V42.8C19.5 47.9 23.1 51.5 28 51.5C31.8 51.5 34.7 49.3 35.7 45.9",
  "M12.7417 38.1769C8.83988 37.5886 6.23032 34.3963 6.21864 30.4964C6.20427 25.6964 9.89408 22.2853 14.6941 22.271L25.594 22.2383",
] as const;

const GRADIENTS: {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  stops: { offset?: string; color: string }[];
}[] = [
  {
    x1: "19.5",
    y1: "11",
    x2: "37",
    y2: "19",
    stops: [
      { color: "#8CD8ED" },
      { offset: "0.2", color: "#259FD7" },
      { offset: "1", color: "#1687CC" },
    ],
  },
  {
    x1: "30",
    y1: "37",
    x2: "48",
    y2: "22",
    stops: [
      { color: "#65C4E7" },
      { offset: "0.192308", color: "#239DD8" },
      { offset: "1", color: "#1181C9" },
    ],
  },
  {
    x1: "18.9",
    y1: "35",
    x2: "34",
    y2: "52",
    stops: [
      { color: "#1687CC" },
      { offset: "0.8", color: "#259FD7" },
      { offset: "1", color: "#8CD8ED" },
    ],
  },
  {
    x1: "25.7946",
    y1: "22.4377",
    x2: "7.83958",
    y2: "37.4915",
    stops: [
      { color: "#176AC4" },
      { offset: "0.75", color: "#1B75CA" },
      { offset: "1", color: "#369DD8" },
    ],
  },
];

export function BrandLogo() {
  const prefix = useId().replace(/:/g, "");
  const gradientId = (index: number) => `${prefix}-g${index}`;

  const paths: ReactNode[] = PATHS.map((d, index) =>
    createElement("path", {
      key: gradientId(index),
      d,
      stroke: `url(#${gradientId(index)})`,
      strokeWidth: 4.5,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );

  const defs = createElement(
    "defs",
    null,
    GRADIENTS.map((gradient, index) =>
      createElement(
        "linearGradient",
        {
          key: gradientId(index),
          id: gradientId(index),
          x1: gradient.x1,
          y1: gradient.y1,
          x2: gradient.x2,
          y2: gradient.y2,
          gradientUnits: "userSpaceOnUse",
        },
        gradient.stops.map((stop) =>
          createElement("stop", {
            key: `${gradientId(index)}-${stop.offset ?? "0"}`,
            offset: stop.offset,
            stopColor: stop.color,
          }),
        ),
      ),
    ),
  );

  return createElement(
    "svg",
    {
      width: 44,
      height: 44,
      viewBox: "0 0 56 56",
      fill: "none",
      "aria-hidden": true,
      style: { display: "block", width: 44, height: 44, flexShrink: 0 },
    },
    ...paths,
    defs,
  );
}
