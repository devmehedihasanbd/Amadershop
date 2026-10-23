import type { ReactNode } from "react";

/**
 * Intentional CSS/SVG product placeholder — no external images.
 * Gradient background per category + large line icon + product initial.
 */

interface CategoryStyle {
  from: string;
  to: string;
  icon: ReactNode;
}

function iconWrap(path: ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-16 w-16"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  honey: {
    from: "from-amber-300",
    to: "to-orange-500",
    icon: iconWrap(
      <>
        <path d="M8 8h8v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8z" />
        <path d="M8 8c0-1.5 1.8-1.5 1.8-3h4.4c0 1.5 1.8 1.5 1.8 3" />
        <path d="M9.5 5h5" />
        <path d="M10.5 12.5h3" />
      </>
    ),
  },
  dates: {
    from: "from-yellow-600",
    to: "to-amber-900",
    icon: iconWrap(
      <>
        <ellipse cx="12" cy="13" rx="5" ry="7" />
        <path d="M12 6c0-2 1-3.5 3-4.5" />
        <path d="M9.5 12.5c.8-1.2 2-2 3.5-2.2" />
      </>
    ),
  },
  spices: {
    from: "from-red-400",
    to: "to-orange-600",
    icon: iconWrap(
      <>
        <path d="M4 13h16c0 4-3.5 7-8 7s-8-3-8-7z" />
        <path d="M14 4l5 6" />
        <path d="M8 16.5h8" />
      </>
    ),
  },
  "oils-ghee": {
    from: "from-yellow-300",
    to: "to-amber-500",
    icon: iconWrap(
      <>
        <path d="M12 3c3.5 4.5 6 8 6 11.5a6 6 0 0 1-12 0C6 11 8.5 7.5 12 3z" />
        <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
      </>
    ),
  },
  "rice-dal": {
    from: "from-emerald-300",
    to: "to-green-600",
    icon: iconWrap(
      <>
        <path d="M4 12h16a8 8 0 0 1-16 0z" />
        <path d="M9 12c0-3 1.5-5 3-6 1.5 1 3 3 3 6" />
        <path d="M12 6V4" />
      </>
    ),
  },
  nuts: {
    from: "from-orange-300",
    to: "to-amber-600",
    icon: iconWrap(
      <>
        <circle cx="9" cy="13" r="4" />
        <circle cx="15.5" cy="10.5" r="3.2" />
        <path d="M7 9.5c1-2 3-3 5-3" />
      </>
    ),
  },
  organic: {
    from: "from-lime-300",
    to: "to-green-600",
    icon: iconWrap(
      <>
        <path d="M5 19C5 9 12 5 20 5c0 8-4 14-13 14" />
        <path d="M5 19c3-5 7-9 11-11" />
      </>
    ),
  },
};

const FALLBACK = CATEGORY_STYLE["organic"];

interface ProductImageProps {
  category: string;
  name: string;
  className?: string;
}

export default function ProductImage({
  category,
  name,
  className = "",
}: ProductImageProps) {
  const style = CATEGORY_STYLE[category] ?? FALLBACK;
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${style.from} ${style.to} ${className}`}
      role="img"
      aria-label={name}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none text-[6rem] font-black leading-none text-white/25"
      >
        {initial}
      </span>
      <span className="relative text-white drop-shadow-md">{style.icon}</span>
    </div>
  );
}
