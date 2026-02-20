import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { artifactsService, progressService } from "@/lib/services";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Layers,
  BarChart2,
  Target,
  FileText,
  CalendarCheck,
  StickyNote,
  AlertCircle,
} from "lucide-react";

type ViewType = "overview" | "milestones";

interface MilestoneForm {
  milestone: string;
  evidence: string;
  completed: boolean;
}

const toolDefinitions = [
  { toolType: "bmc", label: "Business Model Canvas", icon: Layers, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/portal/tools/bmc" },
  { toolType: "swot_pestle", label: "SWOT & PESTLE", icon: BarChart2, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", href: "/portal/tools/analysis" },
  { toolType: "value_proposition", label: "Value Proposition", icon: Target, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", href: "/portal/tools/value-prop" },
  { toolType: "pitch_builder", label: "Pitch Builder", icon: FileText, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/portal/tools/pitch" },
];

function toolStatus(artifacts: any[] | undefined, toolType: string) {
  if (!artifacts) return { status: "not_started", latestTitle: null, updatedAt: null };
  const matches = artifacts.filter(a => a.tool_type === toolType).sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );
  if (matches.length === 0) return { status: "not_started", latestTitle: null, updatedAt: null };
  const latest = matches[0];
  return { status: latest.status, latestTitle: latest.title, updatedAt: latest.updated_at || latest.created_at };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Complete</Badge>;
  if (status === "in_progress") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs gap-1"><Clock className="h-3 w-3" />In Progress</Badge>;
  return <Badge variant="secondary" className="text-xs gap-1"><Circle className="h-3 w-3" />Not Started</Badge>;
}

export default function ProgressTrackerTool() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewType>("overview");
  const [form, setForm] = useState<MilestoneForm>({ milestone: "", evidence: "", completed: false });

  const { data: artifacts } = useQuery({
    queryKey: queryKeys.artifacts.all,
    queryFn: () => artifactsService.getArtifacts(),
    enabled: !!user,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: queryKeys.progress.all,
    queryFn: () => progressService.getProgressEntries(),
    enabled: !!user,
  });

  // Compute overall score
  const toolStatuses = toolDefinitions.map(t => toolStatus(artifacts, t.toolType));
  const completedTools = toolStatuses.filter(s => s.status === "complete").length;
  const inProgressTools = toolStatuses.filter(s => s.status === "in_progress").length;
  const overallPercent = Math.round(
    toolStatuses.reduce((sum, s) => sum + (s.status === "complete" ? 100 : s.status === "in_progress" ? 40 : 0), 0) / toolDefinitions.length
  );

  const completedMilestones = entries?.filter(e => e.completed_at).length || 0;
  const totalMilestones = entries?.length || 0;

  const addMutation = useMutation({
    mutationFn: async () => {
      return progressService.createProgressEntry({
        milestone: form.milestone,
        evidence: form.evidence || null,
        completedAt: form.completed ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
      setForm({ milestone: "", evidence: "", completed: false });
      toast({ title: "Milestone logged" });
    },
    onError: (e: any) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => progressService.deleteProgressEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      progressService.toggleComplete(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-pink-600" />
              <span className="font-medium text-sm">Progress Tracker</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {completedTools}/{toolDefinitions.length} tools complete · {completedMilestones}/{totalMilestones} milestones
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overall progress bar */}
        <Card className="mb-6">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Overall Programme Progress</h2>
                <p className="text-sm text-muted-foreground">{completedTools} tools finalized · {inProgressTools} in progress</p>
              </div>
              <span className="text-2xl font-bold text-primary">{overallPercent}%</span>
            </div>
            <Progress value={overallPercent} className="h-2.5" />
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button variant={view === "overview" ? "default" : "outline"} size="sm" onClick={() => setView("overview")}>Tool Overview</Button>
          <Button variant={view === "milestones" ? "default" : "outline"} size="sm" onClick={() => setView("milestones")}>My Milestones</Button>
        </div>

        {/* Tool Overview */}
        {view === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {toolDefinitions.map((tool, i) => {
                const s = toolStatuses[i];
                const Icon = tool.icon;
                return (
                  <Card key={tool.toolType} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`rounded-lg p-2 shrink-0 ${tool.bg}`}>
                            <Icon className={`h-5 w-5 ${tool.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{tool.label}</p>
                            {s.latestTitle && <p className="text-xs text-muted-foreground truncate">{s.latestTitle}</p>}
                            {s.updatedAt && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Updated {new Date(s.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <StatusBadge status={s.status} />
                          <Link href={tool.href}>
                            <Button variant="outline" size="sm" className="text-xs h-7">
                              {s.status === "not_started" ? "Start" : s.status === "complete" ? "View" : "Continue"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Learning path guidance */}
            <Card className="border-dashed bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Recommended Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/portal/tools/bmc"><span className="text-blue-600 font-medium cursor-pointer hover:underline">1. BMC</span></Link>
                  <span>→</span>
                  <Link href="/portal/tools/value-prop"><span className="text-green-600 font-medium cursor-pointer hover:underline">2. Value Proposition</span></Link>
                  <span>→</span>
                  <Link href="/portal/tools/analysis"><span className="text-purple-600 font-medium cursor-pointer hover:underline">3. SWOT & PESTLE</span></Link>
                  <span>→</span>
                  <Link href="/portal/tools/pitch"><span className="text-orange-600 font-medium cursor-pointer hover:underline">4. Pitch Builder</span></Link>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Each tool builds on the last — your BMC foundations inform your Value Proposition, which strengthens your SWOT, which all feeds into your Pitch.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestones View */}
        {view === "milestones" && (
          <div className="space-y-6">
            {/* Add milestone form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-pink-600" />
                  Log a Milestone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={form.milestone}
                  onChange={e => setForm(p => ({ ...p, milestone: e.target.value }))}
                  placeholder="What milestone did you reach? (e.g. Completed customer interviews, Validated revenue model…)"
                />
                <Textarea
                  value={form.evidence}
                  onChange={e => setForm(p => ({ ...p, evidence: e.target.value }))}
                  placeholder="Evidence or notes (optional) — describe what you did or learned…"
                  className="min-h-20 text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.completed}
                      onChange={e => setForm(p => ({ ...p, completed: e.target.checked }))}
                      className="rounded"
                    />
                    Mark as completed
                  </label>
                  <Button size="sm" className="gap-2" onClick={() => addMutation.mutate()} disabled={!form.milestone.trim() || addMutation.isPending}>
                    <Plus className="h-4 w-4" />Log Milestone
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Milestone list */}
            <div className="space-y-3">
              {entriesLoading && <p className="text-sm text-muted-foreground">Loading milestones…</p>}
              {!entriesLoading && (!entries || entries.length === 0) && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No milestones logged yet. Start tracking your progress above.</p>
                  </CardContent>
                </Card>
              )}
              {entries?.map((entry: any) => (
                <Card key={entry.id} className={`group ${entry.completed_at ? "opacity-80" : ""}`}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: entry.id, completed: !entry.completed_at })}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-600 transition-colors"
                      >
                        {entry.completed_at
                          ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                          : <Circle className="h-5 w-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${entry.completed_at ? "line-through text-muted-foreground" : ""}`}>
                          {entry.milestone}
                        </p>
                        {entry.evidence && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.evidence}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.completed_at
                            ? `Completed ${new Date(entry.completed_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
                            : `Logged ${new Date(entry.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
