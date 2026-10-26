/* ------------------------------------------------------------------ */
/*  BazarGhor product catalog — all data is original and invented.       */
/*  Keep data access in this module so API routes can replace it later. */
/* ------------------------------------------------------------------ */

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  image?: string;
}

export const categories: Category[] = [
  { slug: "honey", name: "Honey", tagline: "Raw & unprocessed" },
  { slug: "dates", name: "Dates", tagline: "Premium & fresh" },
  { slug: "spices", name: "Spices", tagline: "Freshly ground" },
  { slug: "oils-ghee", name: "Oils & Ghee", tagline: "Pure & cold-pressed" },
  { slug: "rice-dal", name: "Rice & Lentils", tagline: "Everyday staples" },
  { slug: "nuts", name: "Nuts & Dry Fruits", tagline: "Crunchy & wholesome" },
  { slug: "organic", name: "Organic Specials", tagline: "Farm to home" },
];

export type Badge = "best-selling" | "new" | null;

export interface Product {
  slug: string;
  name: string;
  category: string; // category slug
  price: number; // BDT
  oldPrice?: number; // BDT, when discounted
  unit: string;
  rating: number; // 4.0 – 5.0
  reviews: number;
  badge: Badge;
  short: string; // 1–2 sentence description
  details: string[]; // 3–4 bullet points
  images?: string[]; // product photos (first = main); absent = placeholder art
}

export const products: Product[] = [
  /* ------------------------------- Honey ------------------------------ */
  {
    slug: "sundarban-wild-honey",
    name: "Sundarban Wild Forest Honey",
    category: "honey",
    price: 850,
    oldPrice: 950,
    unit: "1 kg",
    rating: 4.8,
    reviews: 214,
    badge: "best-selling",
    short:
      "Collected by traditional mawali honey hunters from the Sundarbans mangrove forest. Thick, dark and deeply aromatic.",
    details: [
      "100% raw and unheated — never blended with sugar syrup",
      "Harvested during the spring flowering season",
      "Naturally crystallises over time, a sign of purity",
      "Packed in a food-grade sealed glass jar",
    ],
  },
  {
    slug: "litchi-blossom-honey",
    name: "Litchi Blossom Honey",
    category: "honey",
    price: 480,
    unit: "500 g",
    rating: 4.6,
    reviews: 96,
    badge: null,
    short:
      "Light golden honey with a delicate floral sweetness, gathered from litchi orchards in the north.",
    details: [
      "Single-origin from Dinajpur litchi gardens",
      "Mild flavour — lovely in tea and on toast",
      "Strained, not over-filtered, to keep pollen",
      "Squeeze bottle for easy everyday use",
    ],
  },
  {
    slug: "mustard-flower-honey",
    name: "Mustard Flower Honey",
    category: "honey",
    price: 650,
    oldPrice: 750,
    unit: "1 kg",
    rating: 4.7,
    reviews: 158,
    badge: null,
    short:
      "Bold, peppery honey from winter mustard fields. A favourite for morning lemon water and herbal drinks.",
    details: [
      "Strong natural aroma of mustard blossom",
      "No added colour, flavour or preservatives",
      "Batch-tested for moisture content",
      "Resealable 1 kg family jar",
    ],
  },
  {
    slug: "black-seed-honey-blend",
    name: "Black Seed & Honey Blend",
    category: "honey",
    price: 720,
    unit: "400 g",
    rating: 4.5,
    reviews: 61,
    badge: "new",
    short:
      "Raw honey whipped with cold-pressed black seed oil for a rich, slightly spicy daily spoonful.",
    details: [
      "Blended with 5% pure kalojira oil",
      "Take one spoon each morning",
      "Glass jar with wooden dipper included",
      "Small-batch preparation every month",
    ],
  },

  /* ------------------------------- Dates ------------------------------ */
  {
    slug: "medjool-premium-dates",
    name: "Medjool Premium Dates",
    category: "dates",
    price: 1150,
    oldPrice: 1350,
    unit: "1 kg",
    rating: 4.9,
    reviews: 187,
    badge: "best-selling",
    short:
      "Jumbo, soft Medjool dates with a caramel-like flesh. The king of dates, hand-picked and boxed fresh.",
    details: [
      "Large grade — soft, moist and fibre-rich",
      "No added sugar or glazing",
      "Ideal for iftar, gifting and desserts",
      "Resealable box keeps them fresh for months",
    ],
  },
  {
    slug: "ajwa-dates",
    name: "Ajwa Dates",
    category: "dates",
    price: 950,
    unit: "500 g",
    rating: 4.8,
    reviews: 143,
    badge: null,
    short:
      "Dark, tender Ajwa dates with a mildly sweet, almost smoky flavour. A cherished variety for every home.",
    details: [
      "Soft texture, easy to chew",
      "Rich in natural minerals and fibre",
      "Hygienically packed 500 g box",
      "Perfect for daily breakfast",
    ],
  },
  {
    slug: "sukkari-golden-dates",
    name: "Sukkari Golden Dates",
    category: "dates",
    price: 780,
    oldPrice: 890,
    unit: "1 kg",
    rating: 4.6,
    reviews: 88,
    badge: null,
    short:
      "Golden, crisp-sweet Sukkari dates that melt in the mouth. A lighter, honeyed alternative to darker varieties.",
    details: [
      "Naturally sweet — no syrup added",
      "Crisp bite with a soft centre",
      "Great with nuts and evening tea",
      "1 kg value pack for families",
    ],
  },
  {
    slug: "mabroom-dates",
    name: "Mabroom Dates",
    category: "dates",
    price: 620,
    unit: "500 g",
    rating: 4.5,
    reviews: 54,
    badge: "new",
    short:
      "Long, slender Mabroom dates with a chewy bite and deep sweetness. New arrival in our dates shelf.",
    details: [
      "Less sweet than Medjool — balanced taste",
      "High fibre, satisfying snack",
      "Vacuum-sealed for freshness",
      "Try them stuffed with almonds",
    ],
  },

  /* ------------------------------ Spices ------------------------------ */
  {
    slug: "ceylon-cinnamon-sticks",
    name: "Ceylon Cinnamon Sticks",
    category: "spices",
    price: 340,
    unit: "200 g",
    rating: 4.7,
    reviews: 112,
    badge: null,
    short:
      "True Ceylon cinnamon quills — sweet, woody and paper-thin. Worlds apart from ordinary cassia bark.",
    details: [
      "Hand-rolled true cinnamon, not cassia",
      "Wonderful in payesh, tea and biryani",
      "Low coumarin content",
      "Airtight pouch locks in aroma",
    ],
  },
  {
    slug: "green-cardamom",
    name: "Green Cardamom",
    category: "spices",
    price: 520,
    oldPrice: 600,
    unit: "100 g",
    rating: 4.8,
    reviews: 176,
    badge: "best-selling",
    short:
      "Plump 8mm green cardamom pods bursting with fragrance. The soul of cha, biryani and mishti.",
    details: [
      "Bold 8mm size, high volatile-oil content",
      "Crack one pod into your morning cha",
      "Machine-cleaned and hand-sorted",
      "Stays fragrant for months when sealed",
    ],
  },
  {
    slug: "wild-turmeric-powder",
    name: "Wild Turmeric Powder",
    category: "spices",
    price: 180,
    unit: "500 g",
    rating: 4.6,
    reviews: 203,
    badge: null,
    short:
      "Stone-ground turmeric with a deep golden colour and earthy punch. High curcumin, zero added colour.",
    details: [
      "Ground fresh in small weekly batches",
      "No artificial colour or filler",
      "High curcumin for daily wellness",
      "Staple for curries, dal and haldi doodh",
    ],
  },
  {
    slug: "sun-dried-chili-powder",
    name: "Sun-Dried Chili Powder",
    category: "spices",
    price: 240,
    oldPrice: 280,
    unit: "500 g",
    rating: 4.5,
    reviews: 97,
    badge: null,
    short:
      "Fiery red chili powder from sun-dried deshi morich. Adds heat and a gorgeous colour to every curry.",
    details: [
      "Sun-dried, then ground — no oven roasting",
      "Medium-hot heat level",
      "Vibrant natural red colour",
      "Sealed pack keeps the kick intact",
    ],
  },

  /* ---------------------------- Oils & Ghee ---------------------------- */
  {
    slug: "pure-cow-ghee",
    name: "Pure Cow Ghee",
    category: "oils-ghee",
    price: 1250,
    unit: "1 kg",
    rating: 4.9,
    reviews: 231,
    badge: "best-selling",
    short:
      "Slow-simmered ghee from cow milk cream, with that unmistakable danadar grain and nutty aroma.",
    details: [
      "Traditional slow-boil method",
      "Granular texture, rich aroma",
      "Perfect for polao, khichuri and mishti",
      "No vanaspati, no added flavour",
    ],
  },
  {
    slug: "cold-pressed-mustard-oil",
    name: "Cold-Pressed Mustard Oil",
    category: "oils-ghee",
    price: 380,
    oldPrice: 420,
    unit: "1 L",
    rating: 4.7,
    reviews: 189,
    badge: null,
    short:
      "Pungent, golden mustard oil pressed from selected seeds. The authentic jhaj for bhorta and shutki.",
    details: [
      "Wood-pressed (ghani) in small batches",
      "Sharp natural pungency",
      "Essential for authentic bhorta",
      "1 L food-safe PET bottle",
    ],
  },
  {
    slug: "virgin-coconut-oil",
    name: "Virgin Coconut Oil",
    category: "oils-ghee",
    price: 540,
    unit: "500 ml",
    rating: 4.6,
    reviews: 74,
    badge: "new",
    short:
      "Cold-pressed virgin coconut oil with a fresh coconut scent. For cooking, hair and skin alike.",
    details: [
      "First-press, unrefined",
      "Light tropical aroma",
      "Multi-use: kitchen and beauty",
      "Glass bottle, 500 ml",
    ],
  },
  {
    slug: "black-seed-oil",
    name: "Black Seed Oil",
    category: "oils-ghee",
    price: 450,
    unit: "100 ml",
    rating: 4.5,
    reviews: 58,
    badge: null,
    short:
      "Potent kalojira oil, cold-pressed and unfiltered. A few drops a day in honey or warm water.",
    details: [
      "100% pure, cold-pressed",
      "Strong, peppery and fresh",
      "Dark glass bottle protects potency",
      "Use a few drops daily",
    ],
  },

  /* --------------------------- Rice & Lentils -------------------------- */
  {
    slug: "chinigora-aromatic-rice",
    name: "Chinigura Aromatic Rice",
    category: "rice-dal",
    price: 780,
    oldPrice: 850,
    unit: "5 kg",
    rating: 4.8,
    reviews: 245,
    badge: "best-selling",
    short:
      "Short-grain aromatic rice from Dinajpur with a sweet fragrance. Made for polao, biryani and payesh.",
    details: [
      "Genuine Dinajpur chinigura grain",
      "Naturally aromatic, no polishing agents",
      "Cooks soft with separate grains",
      "5 kg family pack",
    ],
  },
  {
    slug: "premium-miniket-rice",
    name: "Premium Miniket Rice",
    category: "rice-dal",
    price: 640,
    unit: "5 kg",
    rating: 4.5,
    reviews: 167,
    badge: null,
    short:
      "Everyday miniket rice — clean, long grains that cook fluffy. The reliable staple for daily bhat.",
    details: [
      "Sortex-cleaned, stone-free",
      "Non-sticky cooked texture",
      "Great value 5 kg pack",
      "Fresh seasonal stock",
    ],
  },
  {
    slug: "masoor-dal-red-lentils",
    name: "Masoor Dal (Red Lentils)",
    category: "rice-dal",
    price: 165,
    unit: "1 kg",
    rating: 4.6,
    reviews: 198,
    badge: null,
    short:
      "Quick-cooking red lentils that melt into a creamy dal. High protein for the everyday plate.",
    details: [
      "Cooks in 15–20 minutes",
      "No soaking needed",
      "Polished and dust-free",
      "1 kg everyday pack",
    ],
  },
  {
    slug: "golden-moong-dal",
    name: "Golden Moong Dal",
    category: "rice-dal",
    price: 190,
    oldPrice: 220,
    unit: "1 kg",
    rating: 4.7,
    reviews: 121,
    badge: null,
    short:
      "Premium yellow moong dal — light, easy to digest and perfect for khichuri and dal tadka.",
    details: [
      "Uniform golden grains",
      "Light on the stomach",
      "Makes silky khichuri",
      "Sealed 1 kg pack",
    ],
  },

  /* ------------------------- Nuts & Dry Fruits ------------------------- */
  {
    slug: "roasted-cashew-nuts",
    name: "Roasted Cashew Nuts",
    category: "nuts",
    price: 680,
    unit: "500 g",
    rating: 4.7,
    reviews: 134,
    badge: "best-selling",
    short:
      "Whole roasted cashews — buttery, crunchy and lightly salted. Dangerous to keep on the table.",
    details: [
      "Whole W240 grade kernels",
      "Dry-roasted, light salt",
      "No added oil",
      "Resealable freshness pouch",
    ],
  },
  {
    slug: "california-almonds",
    name: "California Almonds",
    category: "nuts",
    price: 590,
    oldPrice: 680,
    unit: "500 g",
    rating: 4.6,
    reviews: 109,
    badge: null,
    short:
      "Crunchy California almonds, uniform and sweet. Soak overnight for the classic morning routine.",
    details: [
      "Nonpareil variety, even size",
      "Rich in vitamin E",
      "Great for snacking and baking",
      "500 g value pack",
    ],
  },
  {
    slug: "salted-pistachios",
    name: "Salted Pistachios",
    category: "nuts",
    price: 720,
    unit: "250 g",
    rating: 4.8,
    reviews: 67,
    badge: "new",
    short:
      "In-shell salted pistachios, roasted to a perfect crunch. The premium mehmaan-nawazi snack.",
    details: [
      "Naturally split shells",
      "Roasted and lightly salted",
      "High protein snack",
      "250 g gift-friendly pack",
    ],
  },

  /* -------------------------- Organic Specials ------------------------- */
  {
    slug: "date-molasses-jhola-gur",
    name: "Date Molasses (Jhola Gur)",
    category: "organic",
    price: 320,
    unit: "1 kg",
    rating: 4.9,
    reviews: 176,
    badge: "best-selling",
    short:
      "Liquid date molasses tapped from winter khejur trees. Pour over pitha, payesh or chitoi for magic.",
    details: [
      "First-tap winter harvest",
      "No sugar mixed — pure sap reduced",
      "Smoky, complex sweetness",
      "1 kg earthen-style jar",
    ],
  },
];

/* ------------------------------ helpers ------------------------------ */

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function relatedProducts(product: Product, count = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  );
  const others = products.filter(
    (p) => p.category !== product.category && p.slug !== product.slug
  );
  return [...sameCategory, ...others].slice(0, count);
}

/** Whole-number discount derived from oldPrice, e.g. 15 for "Save 15%". */
export function discountPercent(p: Product): number | null {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

export function formatPrice(n: number): string {
  return "৳" + n.toLocaleString("en-US");
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter((p) => {
    const cat = getCategory(p.category)?.name.toLowerCase() ?? "";
    return (
      p.name.toLowerCase().includes(q) ||
      p.short.toLowerCase().includes(q) ||
      cat.includes(q) ||
      p.category.includes(q)
    );
  });
}

export function categoryProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}
