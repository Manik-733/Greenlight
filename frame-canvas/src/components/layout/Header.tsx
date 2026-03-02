import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const isLoggedIn = !!user && !loading;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="w-full px-6 lg:px-12">
        <div className="flex items-center justify-between h-24 lg:h-28">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="font-display text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
              Green<span className="text-primary">light</span>
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative font-body text-lg tracking-wide transition-colors duration-200 font-medium",
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {location.pathname === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions - Right */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <Search className="h-6 w-6" />
              </Button>
            </Link>
            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="gold" size="lg">
                    Join
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {profile?.username && (
                  <Link to={`/u/${profile.username}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Go to your profile"
                    >
                      <User className="h-6 w-6" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  title="Sign out"
                >
                  <LogOut className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border"
        >
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "font-body text-lg py-2 transition-colors duration-200",
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
              {!user ? (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gold" className="w-full">
                      Join Greenlight
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {profile?.username && (
                    <Link
                      to={`/u/${profile.username}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        My Profile
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      await signOut();
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
}
