import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { Artifact } from "@shared/schema";

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
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  const { data: artifacts, isLoading: artifactsLoading } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const recentArtifacts = artifacts?.slice(0, 3) || [];
  const completedCount = artifacts?.filter(a => a.status === "complete").length || 0;
  const totalCount = artifacts?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      complete: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-3" data-testid="link-portal-home">
              <span className="font-serif text-2xl font-bold tracking-tight">
                <span className="text-primary">Ed</span>
                <span className="text-accent">Me</span>
                <span className="text-primary">Ca</span>
              </span>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Portal
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(user?.firstName || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium" data-testid="text-user-name">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Welcome"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <a href="/api/logout">
                <Button variant="ghost" size="icon" data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
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
                  {completedCount} of {totalCount || "5"} key artifacts completed
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Keep going!</span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
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

        {/* Recent Artifacts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Recent Work</h2>
            <Link href="/portal/tools/bmc" asChild>
              <Button variant="outline" size="sm" data-testid="button-new-artifact">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </Link>
          </div>

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
              {recentArtifacts.map((artifact) => (
                <Card key={artifact.id} className="hover-elevate overflow-visible">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {artifact.title}
                      </h3>
                      <Badge variant="secondary" className={`text-xs ${getStatusBadge(artifact.status || "draft")}`}>
                        {artifact.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {getToolTypeLabel(artifact.toolType)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {artifact.updatedAt 
                          ? new Date(artifact.updatedAt).toLocaleDateString()
                          : "Recently"
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      </main>
    </div>
  );
}
