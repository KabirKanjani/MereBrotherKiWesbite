import Link from "next/link";

/**
 * A short set of buttons shown above the sidebar links, pointing at the four
 * things staff do most often. The default Payload navigation lists every
 * collection, which is more than a daily user wants — this puts the everyday
 * actions one tap away and lets the link list stay out of the way.
 */
const actions = [
  {
    label: "Add a style",
    hint: "A new kurti or co-ord set",
    href: "/admin/collections/products/create",
  },
  {
    label: "Add a photo",
    hint: "Upload to the photo library",
    href: "/admin/collections/media/create",
  },
  {
    label: "View enquiries",
    hint: "Who asked about what",
    href: "/admin/collections/enquiries",
  },
];

export default function QuickActions() {
  const liveUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "https://kiviadesigns.onrender.com";

  const buttonStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.1rem",
    padding: "0.6rem 0.75rem",
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: "4px",
    background: "var(--theme-elevation-50)",
    textDecoration: "none",
    color: "inherit",
  };

  return (
    <div style={{ padding: "1rem 0.75rem 0.5rem" }}>
      <p
        style={{
          margin: "0 0 0.5rem",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: 0.7,
          paddingLeft: "0.25rem",
        }}
      >
        What do you want to do?
      </p>
      <div style={{ display: "grid", gap: "0.4rem" }}>
        {actions.map((a) => (
          <Link key={a.href} href={a.href} style={buttonStyle}>
            <strong style={{ fontSize: "0.85rem", fontWeight: 600 }}>{a.label}</strong>
            <span style={{ fontSize: "0.72rem", opacity: 0.65 }}>{a.hint}</span>
          </Link>
        ))}
        <Link href={liveUrl} target="_blank" rel="noreferrer" style={buttonStyle}>
          <strong style={{ fontSize: "0.85rem", fontWeight: 600 }}>Open the website</strong>
          <span style={{ fontSize: "0.72rem", opacity: 0.65 }}>See what customers see</span>
        </Link>
      </div>
    </div>
  );
}