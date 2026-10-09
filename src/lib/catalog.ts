/**
 * The showcase gallery.
 *
 * Every entry here is a real post from @kiviakurtis, pulled by tools/harvest.mjs.
 * Nothing is invented. Product names are deliberately absent until the shop
 * supplies them, so a photo is never labelled with a style name it does not
 * belong to. Fields that Instagram did not state, such as colours or exact
 * garment length, are left empty rather than guessed.
 *
 * Prices are absent throughout: Kivia supplies in bulk only, so rate cards are
 * sent on request rather than published.
 */

export type Category =
  | "Kurti"
  | "Kurti Pant Set"
  | "Kurti Dupatta Set"
  | "Co-ord Set"
  | "Kurti Skirt Set";

export type Fabric =
  | "Pure Cotton"
  | "Cotton Slub"
  | "Rayon"
  | "Georgette"
  | "Chanderi"
  | "Crepe"
  | "Cotton Cambric";

export type Occasion = "Daily Wear" | "Office" | "Festive" | "Wedding" | "Party";

export type Product = {
  /** Stable id taken from the Instagram post code, so a photo can be traced back. */
  slug: string;
  /** The shop's own product name, once known. Empty until then, never invented. */
  name: string;
  /** The Instagram post this photo came from. */
  instagramUrl: string;
  instagramCode: string;
  category: Category;
  /** Only set when the caption actually named the fabric. */
  fabric: Fabric | null;
  occasions: Occasion[];
  /** Bulk only. Kept for building rate cards; never rendered on the site. */
  price: number | null;
  mrp?: number;
  /** Size range exactly as the caption stated it, e.g. "L-3XL". */
  sizes: string[];
  /** Only what the caption said about the work or fabric, kept short. */
  shortNote: string;
  /** Left empty until the shop fills these in. */
  colors: { name: string; hex: string }[];
  length: string;
  work: string;
  details: string[];
  care: string[];
  /** Photo path, normally "/products/<instagramCode>.<ext>". Wired by npm run sync:images. */
  image: string | null;
  featured?: boolean;
  isNew?: boolean;
};

export const categories: Category[] = [
  "Kurti",
  "Kurti Pant Set",
  "Kurti Dupatta Set",
  "Co-ord Set",
  "Kurti Skirt Set",
];

export const fabrics: Fabric[] = [
  "Pure Cotton",
  "Cotton Slub",
  "Cotton Cambric",
  "Rayon",
  "Georgette",
  "Chanderi",
  "Crepe",
];

export const occasions: Occasion[] = [
  "Daily Wear",
  "Office",
  "Festive",
  "Wedding",
  "Party",
];

/**
 * One entry per harvested post. `shortNote` is a trimmed fragment of the real
 * caption, not marketing copy written for the site.
 */
export const products: Product[] = [
  {
    slug: "Dd8JKRdBWPy",
    name: "",
    instagramCode: "Dd8JKRdBWPy",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/Dd8JKRdBWPy/",
    category: "Kurti",
    fabric: null,
    occasions: ["Festive"],
    price: null,
    sizes: [],
    shortNote: "Classic festive look, photographed for Diwali.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/Dd8JKRdBWPy.jpg",
    featured: true,
  },
  {
    slug: "DceOCJGPz8E",
    name: "",
    instagramCode: "DceOCJGPz8E",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DceOCJGPz8E/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Office", "Daily Wear"],
    price: null,
    sizes: ["L", "3XL"],
    shortNote: "Embroidery co-ord set.",
    colors: [],
    length: "",
    work: "Embroidery",
    details: [],
    care: [],
    image: "/products/DceOCJGPz8E.jpg",
    featured: true,
  },
  {
    slug: "DceNsIpiwBp",
    name: "",
    instagramCode: "DceNsIpiwBp",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DceNsIpiwBp/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Office", "Daily Wear"],
    price: null,
    sizes: ["L", "3XL"],
    shortNote: "Embroidery co-ord set.",
    colors: [],
    length: "",
    work: "Embroidery",
    details: [],
    care: [],
    image: "/products/DceNsIpiwBp.jpg",
  },
  {
    slug: "DceNeW6hC9X",
    name: "",
    instagramCode: "DceNeW6hC9X",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DceNeW6hC9X/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Office", "Daily Wear"],
    price: null,
    sizes: ["L", "3XL"],
    shortNote: "Embroidery co-ord set.",
    colors: [],
    length: "",
    work: "Embroidery",
    details: [],
    care: [],
    image: "/products/DceNeW6hC9X.jpg",
  },
  {
    slug: "DaAP6CICUGH",
    name: "",
    instagramCode: "DaAP6CICUGH",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DaAP6CICUGH/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Daily Wear"],
    price: null,
    sizes: [],
    shortNote: "Comfort co-ord set.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DaAP6CICUGH.jpg",
    featured: true,
  },
  {
    slug: "DZcCxxHI2fh",
    name: "",
    instagramCode: "DZcCxxHI2fh",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DZcCxxHI2fh/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Daily Wear"],
    price: null,
    sizes: [],
    shortNote: "Regular wear co-ord set.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DZcCxxHI2fh.jpg",
  },
  {
    slug: "DZN1NL1DyVx",
    name: "",
    instagramCode: "DZN1NL1DyVx",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DZN1NL1DyVx/",
    category: "Kurti",
    fabric: "Rayon",
    occasions: ["Daily Wear"],
    price: null,
    sizes: ["M", "XXL"],
    shortNote: "Heavy rayon short top / tunic in a floral print.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DZN1NL1DyVx.jpg",
  },
  {
    slug: "DZN027HIB_s",
    name: "",
    instagramCode: "DZN027HIB_s",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DZN027HIB_s/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Daily Wear"],
    price: null,
    sizes: ["M", "5XL"],
    shortNote: "Printed co-ord in vibrant colours.",
    colors: [],
    length: "",
    work: "Printed",
    details: [],
    care: [],
    image: "/products/DZN027HIB_s.jpg",
  },
  {
    slug: "DZF8WrFiDo4",
    name: "",
    instagramCode: "DZF8WrFiDo4",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DZF8WrFiDo4/",
    category: "Co-ord Set",
    fabric: "Pure Cotton",
    occasions: ["Daily Wear"],
    price: null,
    sizes: ["L", "3XL"],
    shortNote: "Pastel cotton co-ord set.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DZF8WrFiDo4.jpg",
  },
  {
    slug: "DZDBcoXgSrc",
    name: "",
    instagramCode: "DZDBcoXgSrc",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DZDBcoXgSrc/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Daily Wear"],
    price: null,
    sizes: [],
    shortNote: "Comfort co-ord set.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DZDBcoXgSrc.jpg",
  },
  {
    slug: "DYwGPdThYXy",
    name: "",
    instagramCode: "DYwGPdThYXy",
    instagramUrl: "https://www.instagram.com/kiviakurtis/reel/DYwGPdThYXy/",
    category: "Co-ord Set",
    fabric: null,
    occasions: ["Daily Wear", "Festive"],
    price: null,
    sizes: ["L", "3XL"],
    shortNote: "Premium co-ord set, new arrival.",
    colors: [],
    length: "",
    work: "",
    details: [],
    care: [],
    image: "/products/DYwGPdThYXy.jpg",
    isNew: true,
    featured: true,
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const aScore = (a.category === product.category ? 2 : 0) + (a.fabric === product.fabric ? 1 : 0);
      const bScore = (b.category === product.category ? 2 : 0) + (b.fabric === product.fabric ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getAllFabrics() {
  return [...new Set(products.map((p) => p.fabric).filter((f): f is Fabric => f !== null))];
}

export function getAllCategories() {
  return [...new Set(products.map((p) => p.category))];
}

export function getAllOccasions() {
  return [...new Set(products.flatMap((p) => p.occasions))];
}

/**
 * Only for building rate cards in bulk messages. Nothing on the site renders a
 * price, so this is deliberately not used in any component.
 */
export function formatPrice(price: number | null) {
  if (price === null) return "Price on request";
  return `₹${price.toLocaleString("en-IN")}`;
}