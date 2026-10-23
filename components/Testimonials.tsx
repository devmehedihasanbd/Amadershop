import Stars from "./Stars";

const TESTIMONIALS = [
  {
    quote:
      "The Sundarban honey tastes nothing like the supermarket stuff — thick, dark and so fragrant. My morning tea finally feels complete.",
    name: "Rahima Khatun",
    area: "Dhanmondi, Dhaka",
    initial: "R",
  },
  {
    quote:
      "Ordered Medjool dates and ghee for my parents. Delivery reached Uttara the next morning, packing was excellent. Genuinely impressed.",
    name: "Tanvir Ahmed",
    area: "Uttara, Dhaka",
    initial: "T",
  },
  {
    quote:
      "I was skeptical about buying spices online, but the cardamom and turmeric here are fresher than my local bazaar. BazarGhor is now my monthly stop.",
    name: "Nasrin Sultana",
    area: "Mirpur, Dhaka",
    initial: "N",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14" aria-labelledby="testimonials-heading">
      <h2
        id="testimonials-heading"
        className="text-center text-2xl font-extrabold text-stone-800 md:text-3xl"
      >
        Loved by Homes Across Dhaka
      </h2>
      <p className="mt-2 text-center text-stone-500">
        Real words from real customers (names shared with permission).
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <Stars rating={5} />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                {t.initial}
              </span>
              <span>
                <span className="block text-sm font-semibold text-stone-800">
                  {t.name}
                </span>
                <span className="block text-xs text-stone-500">{t.area}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
