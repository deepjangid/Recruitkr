import OptimizedLogo from "@/components/OptimizedLogo";
import { Menu, X } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/why-us" },
  { label: "Our Team", path: "/our-team" },
  { label: "Services", path: "/services" },
  { label: "Sectors", path: "/sectors" },
  { label: "Process", path: "/process" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
];

const navLinkClass = (isActive: boolean) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? "text-primary" : "text-muted-foreground"
  }`;

const Navbar = memo(function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 shadow-sm md:bg-background/80 md:shadow-none md:backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center" aria-label="RecruitKr home">
          <span className="flex h-12 max-w-[220px] shrink-0 items-center sm:h-14 md:h-16">
            <OptimizedLogo
              loading="eager"
              fetchPriority="high"
              className="block h-full w-auto"
              imgClassName="h-full w-auto origin-left scale-[2] object-contain"
              sizes="(max-width: 768px) 120px, 220px"
            />
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.path} className={({ isActive }) => navLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}

          <Link
            to="/login"
            className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-105"
          >
            Login
          </Link>
        </div>

        <button
          className="text-foreground lg:hidden"
          onClick={toggleMenu}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 shadow-lg lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `block py-3 text-sm ${navLinkClass(isActive)}`}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/login" className="btn-gradient mt-2 block rounded-lg px-5 py-2.5 text-center text-sm font-semibold" onClick={closeMenu}>
            Login
          </Link>
        </div>
      )}
    </nav>
  );
});

export default Navbar;
