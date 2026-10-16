import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

export function initialsOf(nameOrEmail?: string | null): string {
  const source = (nameOrEmail ?? "").trim();
  if (!source) return "?";
  const words = source.includes("@") ? [source.split("@")[0]] : source.split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The signed-in user's photo, or their initials on the brand gradient when
 * there is none (or it fails to load).
 */
export function UserAvatar({ src, name, size = "md", className, testId }: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  testId?: string;
}) {
  return (
    <Avatar className={cn(SIZES[size], "shadow-md", className)} data-testid={testId}>
      {src ? <AvatarImage src={src} alt={name ? `${name}'s profile photo` : "Profile photo"} className="object-cover" /> : null}
      <AvatarFallback className="bg-gradient-to-br from-primary to-accent font-semibold text-white" delayMs={src ? 600 : undefined}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
