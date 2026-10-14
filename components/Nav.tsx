"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Register" },
  { href: "/orders", label: "Orders" },
  { href: "/serving", label: "Serving" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="brand">BEEF BOYS</span>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "nav-link active" : "nav-link"}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
