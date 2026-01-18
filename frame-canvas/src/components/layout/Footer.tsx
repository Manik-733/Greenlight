import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-display text-2xl font-semibold text-foreground tracking-tight">
                BM<span className="text-primary">DB</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              The definitive database for student and independent filmmakers. Build your filmography. Get discovered.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Explore</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Discover Projects
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/discover?sort=top_rated" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link to="/discover?sort=trending" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          {/* For Filmmakers */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">For Filmmakers</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Submit a Project
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BMDB. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made for filmmakers, by filmmakers.
          </p>
        </div>
      </div>
    </footer>
  );
}
