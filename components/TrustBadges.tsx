const BADGES = [
  {
    title: "100% Authentic",
    text: "Source-checked, no mixing",
    icon: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM9 12l2 2 4-4",
  },
  {
    title: "Fast Delivery",
    text: "Same-day in Dhaka",
    icon: "M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a1.8 1.8 0 100-3.6A1.8 1.8 0 007 20zm11 0a1.8 1.8 0 100-3.6A1.8 1.8 0 0018 20z",
  },
  {
    title: "Secure Payment",
    text: "COD · bKash · Nagad",
    icon: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM10 9.5h4M10 13h4",
  },
  {
    title: "Fresh Every Week",
    text: "New stock, honestly dated",
    icon: "M12 21c-5 0-8-3.5-8-9 0-4 2.5-7 8-9 5.5 2 8 5 8 9 0 5.5-3 9-8 9zm0-16v16M8 8c1 2 2 3 4 3s3-1 4-3",
  },
];

/** Trust badges strip, in the style of organic grocery storefronts. */
export default function TrustBadges() {
  return (
    <section className="border-y border-green-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
        {BADGES.map((b) => (
          <div key={b.title} className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-green-700"
                aria-hidden="true"
              >
                <path d={b.icon} />
              </svg>
            </span>
            <div>
              <p className="font-bold text-stone-900">{b.title}</p>
              <p className="text-sm text-stone-500">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
