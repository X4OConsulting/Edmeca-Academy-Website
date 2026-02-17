import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@assets/EdMeCa_LOGO.png";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/solutions", label: "Solutions" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/engagement", label: "Engagement" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="EdMeCa" 
              className="h-10 w-auto dark:brightness-0 dark:invert"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate"
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <Link href="/portal">
                <Button data-testid="button-portal">Portal</Button>
              </Link>
            ) : (
              <>
                <a href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex" data-testid="button-login" disabled>
                    Log In
                  </Button>
                </a>
                <Link href="/contact">
                  <Button data-testid="button-get-started">Get Started</Button>
                </Link>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <nav className="flex flex-col gap-2 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t my-4" />
                  {user ? (
                    <Link href="/portal">
                      <Button className="w-full" data-testid="button-portal-mobile">Portal</Button>
                    </Link>
                  ) : (
                    <>
                      <a href="/login">
                        <Button variant="outline" className="w-full" data-testid="button-login-mobile" disabled>
                          Log In
                        </Button>
                      </a>
                      <Link href="/contact">
                        <Button className="w-full mt-2" data-testid="button-get-started-mobile">
                          Get Started
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
