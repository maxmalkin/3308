import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line pb-10 pt-14 text-muted text-sm">
      <div className="mx-auto grid max-w-[1520px] gap-10 px-6 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-12">
        <div>
          <h4 className="font-display text-lg text-ink">
            pillar<em className="text-[var(--accent)]">boxd</em>
          </h4>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            © {new Date().getFullYear()} · PillarBoxd · CSCI 3308
          </p>
        </div>
        <FooterCol
          title="Browse"
          links={[
            { href: "/", label: "Home" },
            { href: "/recommendations", label: "Recommendations" },
            { href: "/queue", label: "Queue" },
            { href: "/log", label: "Log" },
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            { href: "/login", label: "Sign in" },
            { href: "/register", label: "Get started" },
          ]}
        />
        <FooterCol
          title="About"
          links={[
            {
              href: "https://github.com/maxmalkin/3308",
              label: "GitHub",
            },
          ]}
        />
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-display text-lg text-ink">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
