export const site = {
  name: "Kivia Designs",
  tagline: "Kurti manufacture, Ahmedabad",
  description:
    "Kivia Designs is a kurti manufacturing house in Ahmedabad. Browse cotton, rayon, georgette and chanderi kurtis, kurti pant sets and co-ord sets, and order anywhere in India.",
  url: "https://kiviadesigns.in",
  locale: "en_IN",

  phone: "9727815381",
  whatsapp: "919727815381",
  email: "hello@kiviadesigns.in",
  instagram: "kiviakurtis",
  instagramUrl: "https://www.instagram.com/kiviakurtis/",

  city: "Ahmedabad",
  region: "Gujarat",
  country: "India",
  addressLines: ["Replace with your shop name and street", "Ahmedabad, Gujarat - 380001"],
  mapQuery: "Kivia Designs Ahmedabad",

  hours: [
    { days: "Monday to Saturday", time: "10:30 AM - 8:30 PM" },
    { days: "Sunday", time: "Closed" },
  ],
} as const;

export const navLinks = [
  { href: "/collection", label: "Collection" },
  { href: "/seasons", label: "Seasons" },
  { href: "/craft", label: "Our Craft" },
  { href: "/bulk", label: "Bulk Orders" },
  { href: "/size-guide", label: "Size Guide" },
  { href: "/visit", label: "Visit Store" },
] as const;