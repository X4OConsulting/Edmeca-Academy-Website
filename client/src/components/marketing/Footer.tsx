import { Link } from "wouter";

const footerLinks = {
  solutions: [
    { href: "/solutions/entrepreneurs", label: "For Entrepreneurs" },
    { href: "/solutions/programmes", label: "For Programmes" },
    { href: "/frameworks", label: "Frameworks" },
    { href: "/engagement", label: "Engagement Options" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2" data-testid="link-footer-home">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight">EDMECA</span>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-md text-sm leading-relaxed">
              From Framework to Execution to Evidence. MBA-level business frameworks 
              made accessible through hands-on delivery and AI-enabled tooling.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Turn frameworks into action, prototypes into products, ideas into investor-ready pitches.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EDMECA. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
