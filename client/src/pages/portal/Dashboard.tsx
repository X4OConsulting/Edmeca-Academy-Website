import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { useQuery } from "@tanstack/react-query";
import { artifactsService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Layers,
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  LogOut,
  LifeBuoy,
  CheckCircle2,
  Circle,
  Activity,
  BookOpen,
} from "lucide-react";
import type { Artifact } from "@shared/schema";
import logoImage from "@assets/logo.png";
import { PageError, PageLoader } from "@/components/portal/PageStates";
import { ThemeToggle } from "@/components/ThemeToggle";

const tools = [
  {
    icon: Layers,
    title: "Business Model Canvas",
    description: "Build your 9-block business model with AI assistance",
    href: "/portal/tools/bmc",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: BarChart3,
    title: "SWOT & PESTLE",
    description: "Comprehensive strategic analysis tools",
    href: "/portal/tools/analysis",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Target,
    title: "Value Proposition",
    description: "Define your customer personas and value fit",
    href: "/portal/tools/value-prop",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: FileText,
    title: "Pitch Builder",
    description: "Create investor-ready pitch decks",
    href: "/portal/tools/pitch",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracker",
    description: "Track milestones and capture evidence",
    href: "/portal/tools/progress",
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    icon: BarChart3,
    title: "Financial Analysis",
    description: "AI-powered financial health report from bank statements",
    href: "/portal/tools/financials",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [newToolOpen, setNewToolOpen] = useState(false);

  // Keep all portal queries in sync via Supabase Realtime
  useRealtimeSync();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const { data: artifacts, isLoading: artifactsLoading, isFetching: artifactsFetching, isError: artifactsError, refetch } = useQuery<Artifact[]>({
    queryKey: ["artifacts"],
    queryFn: () => artifactsService.getArtifacts(),
    enabled: !!user,
    networkMode: "always",
  });

  // Deduplicate: keep only the most recently updated artifact per tool type
  // Note: Supabase returns snake_case (tool_type) not camelCase (toolType)
  const KEY_TOOL_TYPES = ["bmc", "swot_pestle", "value_proposition", "pitch_builder"] as const;

  const latestByType = artifacts?.reduce((acc, a) => {
    const key = (a as any).tool_type ?? a.toolType;
    const existing = acc[key];
    const aDate = new Date((a as any).updated_at ?? a.updatedAt ?? 0);
    const eDate = new Date((existing as any)?.updated_at ?? existing?.updatedAt ?? 0);
    if (!existing || aDate > eDate) acc[key] = a;
    return acc;
  }, {} as Record<string, Artifact>);

  const uniqueArtifacts = Object.values(latestByType ?? {}).sort((a, b) => {
    const ad = new Date((a as any).updated_at ?? a.updatedAt ?? 0).getTime();
    const bd = new Date((b as any).updated_at ?? b.updatedAt ?? 0).getTime();
    return bd - ad;
  });

  const recentArtifacts = uniqueArtifacts.slice(0, 3);
  const completedCount = KEY_TOOL_TYPES.filter(t => latestByType?.[t]?.status === "complete").length;
  const totalTools = KEY_TOOL_TYPES.length;
  const progressPercent = (completedCount / totalTools) * 100;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getToolTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bmc: "Business Model Canvas",
      swot_pestle: "SWOT/PESTLE",
      value_proposition: "Value Proposition",
      pitch_builder: "Pitch Builder",
    };
    return labels[type] || type;
  };

  const getToolHref = (type: string) => {
    const hrefs: Record<string, string> = {
      bmc: "/portal/tools/bmc",
      swot_pestle: "/portal/tools/analysis",
      value_proposition: "/portal/tools/value-prop",
      pitch_builder: "/portal/tools/pitch",
    };
    return hrefs[type] || "/portal/tools/bmc";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      complete: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return styles[status] || styles.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      in_progress: "In Progress",
      complete: "Complete",
    };
    return labels[status] || "Draft";
  };

  if (artifactsLoading || artifactsFetching) return <PageLoader message="Loading your dashboard..." />;
  if (artifactsError) return <PageError message="Could not load your work. Please check your connection." onRetry={refetch} />;

  const LEARNING_PATH = [
    { type: "bmc",               label: "Business Model Canvas",  href: "/portal/tools/bmc",        description: "Map your business model across 9 building blocks." },
    { type: "swot_pestle",       label: "SWOT & PESTLE Analysis", href: "/portal/tools/analysis",   description: "Identify strengths, threats and market forces." },
    { type: "value_proposition", label: "Value Proposition",      href: "/portal/tools/value-prop", description: "Define your customer fit and unique offering." },
    { type: "pitch_builder",     label: "Pitch Builder",          href: "/portal/tools/pitch",      description: "Build an investor-ready pitch deck." },
  ];

  const nextStepIndex = LEARNING_PATH.findIndex(step => latestByType?.[step.type]?.status !== "complete");
  const nextStep = nextStepIndex >= 0 ? LEARNING_PATH[nextStepIndex] : null;

  const allActivities = [...(artifacts ?? [])]
    .sort((a, b) => {
      const ad = new Date((a as any).updated_at ?? a.updatedAt ?? 0).getTime();
      const bd = new Date((b as any).updated_at ?? b.updatedAt ?? 0).getTime();
      return bd - ad;
    })
    .slice(0, 8);

  const getRelativeTime = (dateStr: string | undefined) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-3" data-testid="link-portal-home">
              <img 
                src={logoImage} 
                alt="EdMeCa" 
                className="h-10 w-auto dark:brightness-0 dark:invert"
              />
              <div className="hidden sm:block h-6 w-px bg-border" />
              <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Portal
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/contact">
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                  <LifeBuoy className="h-4 w-4" />
                  Support
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Support">
                  <LifeBuoy className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/portal/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-9 w-9" data-testid="avatar-user">
                  <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(user?.user_metadata?.full_name || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium" data-testid="text-user-name">
                    {user?.user_metadata?.full_name || "Welcome"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </Link>
              <ThemeToggle />
              <Button variant="ghost" size="icon" data-testid="button-logout" aria-label="Log out" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue building your business with AI-powered frameworks.
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold">Your Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {totalTools} key tools completed
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Keep going!</span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" aria-label="Programme completion progress" />
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Tools</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="hover-elevate overflow-visible h-full cursor-pointer group">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${tool.bgColor}`}>
                      <tool.icon className={`h-5 w-5 ${tool.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">Learning Path</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LEARNING_PATH.map((step, i) => {
              const done = latestByType?.[step.type]?.status === "complete";
              const isNext = nextStepIndex === i;
              return (
                <Link key={step.type} href={step.href}>
                  <Card className={`h-full cursor-pointer group transition-all border-2 ${
                    done ? "border-green-200 dark:border-green-900" :
                    isNext ? "border-primary shadow-md" :
                    "border-transparent"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ${
                          done ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                          isNext ? "bg-primary text-primary-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>{i + 1}</span>
                        {done
                          ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />
                          : isNext
                            ? <span className="ml-auto text-xs font-medium text-primary">Up next</span>
                            : <Circle className="h-4 w-4 text-muted-foreground ml-auto" />
                        }
                      </div>
                      <p className={`text-sm font-semibold group-hover:text-primary transition-colors ${
                        done ? "text-muted-foreground line-through" : ""
                      }`}>{step.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          {nextStep && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Recommended next: </span>
                <Link href={nextStep.href} className="text-primary underline underline-offset-2 hover:no-underline">
                  {nextStep.label}
                </Link>
              </p>
            </div>
          )}
          {!nextStep && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">All core tools completed — you're pitch-ready!</p>
            </div>
          )}
        </div>

        {/* Recent Artifacts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Recent Work</h2>
            <Button variant="outline" size="sm" data-testid="button-new-artifact" onClick={() => setNewToolOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {/* Tool picker dialog */}
          <Dialog open={newToolOpen} onOpenChange={setNewToolOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Start a new tool</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tools.map((tool) => (
                  <button
                    key={tool.href}
                    className="text-left w-full"
                    onClick={() => { setNewToolOpen(false); navigate(tool.href); }}
                  >
                    <Card className="hover-elevate cursor-pointer group h-full">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${tool.bgColor} shrink-0`}>
                          <tool.icon className={`h-4 w-4 ${tool.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {tool.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {artifactsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentArtifacts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentArtifacts.map((artifact) => {
                const toolType = (artifact as any).tool_type ?? artifact.toolType;
                const title = (artifact.title ?? "").startsWith("Untitled")
                  ? getToolTypeLabel(toolType)
                  : artifact.title;
                const updatedAt = (artifact as any).updated_at ?? artifact.updatedAt;
                return (
                <Link key={artifact.id} href={getToolHref(toolType)}>
                  <Card className="hover-elevate overflow-visible cursor-pointer group h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusBadge(artifact.status || "draft")}`}>
                          {getStatusLabel(artifact.status || "draft")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {getToolTypeLabel(toolType)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No artifacts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by creating your first Business Model Canvas
                </p>
                <Link href="/portal/tools/bmc" asChild>
                  <Button data-testid="button-create-first">
                    Create Your First Canvas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        {allActivities.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Activity</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {allActivities.map((artifact, idx) => {
                    const toolType = (artifact as any).tool_type ?? artifact.toolType;
                    const updatedAt = (artifact as any).updated_at ?? artifact.updatedAt;
                    const createdAt = (artifact as any).created_at ?? artifact.createdAt;
                    const isNew = updatedAt === createdAt;
                    const title = (artifact.title ?? "").startsWith("Untitled")
                      ? getToolTypeLabel(toolType)
                      : artifact.title;
                    return (
                      <li key={artifact.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{isNew ? "Created" : "Updated"}</span>
                            {" "}<span className="text-muted-foreground">{getToolTypeLabel(toolType)}</span>
                            {title && !title.startsWith(getToolTypeLabel(toolType)) && (
                              <span className="text-muted-foreground"> — {title}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(updatedAt)}
                        </div>
                        <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusBadge(artifact.status || "draft")}`}>
                          {getStatusLabel(artifact.status || "draft")}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
