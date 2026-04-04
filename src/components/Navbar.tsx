import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/why-us" },
  { label: "Services", path: "/services" },
  { label: "Sectors", path: "/sectors" },
  { label: "Process", path: "/process" },
  { label: "Blog", path: "/blog" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center">
          <span className="flex h-12 max-w-[220px] shrink-0 items-center sm:h-14 md:h-16">
            <img
              src={Logo}
              alt="RecruitKr"
              className="h-full w-auto origin-left scale-[2] object-contain"
            />
          </span>
        </Link>

        <div className="hidden items-center gap-8  lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}

          {/* Register Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setRegisterOpen(!registerOpen)}
              onBlur={() => setTimeout(() => setRegisterOpen(false), 150)}
            >
              Register <ChevronDown size={14} />
            </button>
            {registerOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
                <Link
                  to="/register/candidate"
                  className="block px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  onClick={() => setRegisterOpen(false)}
                >
                  🎓 Candidate / Job Seeker
                </Link>
                <Link
                  to="/register/client"
                  className="block px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  onClick={() => setRegisterOpen(false)}
                >
                  🏢 Recruiter / Employer
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/login"
            className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-105"
          >
            Login
          </Link>

          <Link
            to="/contact"
            className="btn-gradient rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>

       {/* Menu button */}
       
        <button
          className="text-foreground lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="block py-3 text-sm text-muted-foreground hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/register/candidate" className="block py-3 text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>
            🎓 Register as Candidate
          </Link>
          <Link to="/register/client" className="block py-3 text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>
            🏢 Register as Employer
          </Link>
          <Link to="/login" className="btn-gradient mt-2 block rounded-lg px-5 py-2.5 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link to="/contact" className="btn-gradient mt-2 block rounded-lg px-5 py-2.5 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
