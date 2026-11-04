import { Link } from "wouter";
import logoImage from "@assets/logo.png";

// The offering groups from the plan's Phase 5; the anchors are created on /solutions in Phase 5.
// Impact is an anchor to the home page evidence section, so it renders as a plain <a>.
const footerLinks = {
  whatWeDo: [
    { href: "/solutions#programmes", label: "Programmes", anchor: true },
    { href: "/solutions#evidence", label: "Evidence services", anchor: true },
    { href: "/solutions#pathways", label: "Accredited pathways", anchor: true },
    { href: "/solutions#studio", label: "Digital tools", anchor: true },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/#impact", label: "Impact", anchor: true },
    { href: "/engagement", label: "Engagement" },
    { href: "/contact", label: "Contact" },
  ],
  studio: [{ href: "/login", label: "Sign in to the AI Business Studio", anchor: true }],
};

type FooterLink = { href: string; label: string; anchor?: boolean };

const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="eyebrow mb-4">{title}</h2>
      <ul className="space-y-3">
        {links.map((link) => {
          const testId = `link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`;
          return (
            <li key={link.href}>
              {link.anchor ? (
                <a href={link.href} className={linkClass} data-testid={testId}>
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={linkClass} data-testid={testId}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="sm:col-span-2">
            <Link href="/" className="inline-block py-5" data-testid="link-footer-home">
              <img
                src={logoImage}
                alt="EdMeCa"
                width="157"
                height="40"
                className="h-10 w-auto dark:brightness-0 dark:invert"
              />
            </Link>
            <p className="mt-2 text-muted-foreground max-w-md text-sm leading-relaxed">
              Research-backed AI capability that turns learning into earning.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:info@edmeca.co.za" className="hover:text-foreground transition-colors" data-testid="link-footer-email">
                  info@edmeca.co.za
                </a>
              </li>
              <li>@Edmeca Pty Ltd</li>
              <li>Level One B-BBEE contributor</li>
            </ul>
          </div>

          <FooterColumn title="What we do" links={footerLinks.whatWeDo} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Studio" links={footerLinks.studio} />
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-center lg:text-left">
            <p className="text-sm text-muted-foreground" data-testid="text-legal-line">
              &copy; {new Date().getFullYear()} Edmeca (Pty) Ltd, trading as EdMeCa. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="https://x4o.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                X4O
              </a>
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className={linkClass} data-testid="link-footer-privacy">
                Privacy
              </Link>
              <Link href="/terms" className={linkClass} data-testid="link-footer-terms">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
