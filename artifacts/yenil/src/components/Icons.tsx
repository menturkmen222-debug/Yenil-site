import React from "react";

type P = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
};

function svg(size: number, sw: number) {
  return {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: sw,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
}

/* ── Content icons (replace emojis) ── */

export function WalletIcon({ size = 20, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="2" y="7" width="20" height="14" rx="3" />
      <path d="M16 14a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function SunIcon({ size = 18, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon({ size = 18, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ShoppingBagIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function LightbulbIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.4 4.7-3.5 5.8L14 17H10l-.5-2.2C7.4 13.7 6 11.5 6 9a6 6 0 0 1 6-6z" />
      <line x1="9.5" y1="17" x2="14.5" y2="17" />
    </svg>
  );
}

export function TrainIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="4" y="3" width="16" height="13" rx="3" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="12" y1="3" x2="12" y2="10" />
      <path d="M7 19l-2 3M17 19l2 3M6 19h12" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function TrophyIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M6 5h12v7a6 6 0 0 1-12 0z" />
      <path d="M12 18v4M8 22h8" />
    </svg>
  );
}

export function AlertIcon({ size = 18, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function SmartphoneIcon({ size = 22, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

export function StarIcon({ size = 14, strokeWidth = 1.6, filled = false, className, style }: P & { filled?: boolean }) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style} fill={filled ? "currentColor" : "none"}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 18, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 15, strokeWidth = 2, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ── Nav icons ── */

export function HomeIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function NavTrainIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="4" y="3" width="16" height="12" rx="3" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="12" y1="3" x2="12" y2="10" />
      <circle cx="8.5" cy="17" r="1.5" />
      <circle cx="15.5" cy="17" r="1.5" />
      <path d="M6 20h12" />
    </svg>
  );
}

export function SimCardIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 3h4l4 4" />
      <rect x="7.5" y="10" width="9" height="7" rx="1.5" />
    </svg>
  );
}

export function GridIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function StoreIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M2 7h20l-1.5-4H3.5z" />
      <path d="M2 7v13a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7" />
      <path d="M2 7a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

export function InfoIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function HeadphonesIcon({ size = 16, strokeWidth = 1.8, className, style }: P) {
  return (
    <svg {...svg(size, strokeWidth)} className={className} style={style}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
