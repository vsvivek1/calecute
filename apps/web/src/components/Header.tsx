import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/courses", label: "Courses" },
  { href: "/rewards", label: "Rewards" },
  { href: "/locations", label: "Locations" },
  { href: "/history-clock", label: "History Clock" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="z-40 sm:sticky sm:top-0 border-b border-black/5 bg-background/75 backdrop-blur-xl dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Calecutech
        </Link>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
