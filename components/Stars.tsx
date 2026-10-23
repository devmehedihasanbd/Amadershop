interface StarsProps {
  rating: number;
  className?: string;
}

export default function Stars({ rating, className = "h-4 w-4" }: StarsProps) {
  const full = Math.round(rating);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`${className} ${
            i <= full ? "text-amber-400" : "text-stone-300"
          }`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9L10 14.9l-5.3 2.8 1-5.9L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
