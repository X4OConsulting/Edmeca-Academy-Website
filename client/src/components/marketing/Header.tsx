import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/UserAvatar";
import logoImage from "@assets/logo.png";

const isLoginEnabled = import.meta.env.VITE_ENABLE_LOGIN === "true";
const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";

// Impact is an anchor to the home page evidence section, not a route, so it renders as a plain <a>.
const navLinks = [
  { href: "/about", label: "About", testId: "about" },
  { href: "/solutions", label: "What we do", testId: "solutions" },
  { href: "/#impact", label: "Impact", testId: "impact", anchor: true },
  { href: "/engagement", label: "Engagement", testId: "engagement" },
  { href: "/diagnostic", label: "Diagnostic", testId: "diagnostic" },
  { href: "/contact", label: "Contact", testId: "contact" },
];

const desktopLinkClass = "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate";
const mobileLinkClass = "px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors";

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="EdMeCa"
              width="125"
              height="32"
              className="h-8 w-auto dark:brightness-0 dark:invert"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) =>
              link.anchor ? (
                <a key={link.href} href={link.href} className={desktopLinkClass} data-testid={`link-${link.testId}`}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={desktopLinkClass} data-testid={`link-${link.testId}`}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <Link href="/portal" className="flex items-center gap-3">
                <Button data-testid="button-portal">AI Business Studio</Button>
                <UserAvatar
                  src={user.user_metadata?.avatar_url}
                  name={user.user_metadata?.full_name || user.email}
                  size="sm"
                  className="hidden sm:flex"
                  testId="avatar-header"
                />
              </Link>
            ) : (
              <>
                {bypassAuth ? (
                  <Link href="/portal">
                    <Button variant="ghost" className="hidden xl:inline-flex text-primary" data-testid="button-login">
                      AI Business Studio
                    </Button>
                  </Link>
                ) : isLoginEnabled ? (
                  <a href="/login">
                    <Button variant="ghost" className="hidden xl:inline-flex text-primary" data-testid="button-login">
                      AI Business Studio
                    </Button>
                  </a>
                ) : (
                  <Button variant="ghost" className="hidden xl:inline-flex opacity-50 cursor-not-allowed" data-testid="button-login" disabled>
                    AI Business Studio
                  </Button>
                )}
                <Link href="/contact" className="hidden sm:inline-flex">
                  <Button variant="cta" data-testid="button-discovery-call">Book a discovery call</Button>
                </Link>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden" data-testid="button-menu" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <nav className="flex flex-col gap-2 mt-8">
                  {navLinks.map((link) =>
                    link.anchor ? (
                      <a key={link.href} href={link.href} className={mobileLinkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.href} href={link.href} className={mobileLinkClass}>
                        {link.label}
                      </Link>
                    ),
                  )}
                  <div className="border-t my-4" />
                  {user ? (
                    <Link href="/portal">
                      <Button className="w-full" data-testid="button-portal-mobile">AI Business Studio</Button>
                    </Link>
                  ) : (
                    <>
                      {bypassAuth ? (
                        <Link href="/portal">
                          <Button variant="outline-brand" className="w-full" data-testid="button-login-mobile">
                            AI Business Studio
                          </Button>
                        </Link>
                      ) : isLoginEnabled ? (
                        <a href="/login">
                          <Button variant="outline-brand" className="w-full" data-testid="button-login-mobile">
                            AI Business Studio
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline-brand" className="w-full opacity-50 cursor-not-allowed" data-testid="button-login-mobile" disabled>
                          AI Business Studio
                        </Button>
                      )}
                      <Link href="/contact">
                        <Button variant="cta" className="w-full mt-2" data-testid="button-discovery-call-mobile">
                          Book a discovery call
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
