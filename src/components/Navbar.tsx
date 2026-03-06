import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";

const navItems = [
  { label: "Services", path: "/services" },
  { label: "Sectors", path: "/sectors" },
  { label: "Process", path: "/process" },
  { label: "Why Us", path: "/why-us" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center">
          <span className="block h-10 w-[170px] overflow-hidden sm:h-11 sm:w-[190px] md:w-[210px] lg:w-[230px]">
            <img
              src={Logo}
              alt="RecruitKr"
              className="h-full w-full scale-[1.55] object-contain"
            />
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
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
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
          >
            Login
          </Link>

          <Link
            to="/contact"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #264a7f 0%, #69a44f 100%)" }}
          >
            Get Started
          </Link>
        </div>

        <button className="text-foreground md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
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
          <Link to="/login" className="mt-2 block rounded-lg border border-border px-5 py-2.5 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link to="/contact" className="mt-2 block rounded-lg px-5 py-2.5 text-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #264a7f 0%, #69a44f 100%)" }} onClick={() => setOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
