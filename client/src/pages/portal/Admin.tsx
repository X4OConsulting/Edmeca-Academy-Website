import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type AccessMember } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Inbox, Loader2, Mail, Send, ShieldAlert, UserPlus, Users, X } from "lucide-react";
import logoImage from "@assets/logo.png";

const date = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "");

/** Invite-only access: applications to review, invite by email, and everyone with access. */
export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const { data, isLoading, error } = useQuery({ queryKey: ["admin"], queryFn: adminService.overview, retry: false });

  const run = useMutation({
    mutationFn: async (job: { action: () => Promise<unknown>; done: string }) => {
      await job.action();
      return job.done;
    },
    onSuccess: (done) => {
      toast({ title: done });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: Error) => toast({ title: "Not done", description: err.message, variant: "destructive" }),
  });
  const busy = run.isPending;

  const inviteNow = (e: React.FormEvent) => {
    e.preventDefault();
    run.mutate(
      { action: () => adminService.invite(email.trim(), name.trim()), done: `Invite sent to ${email.trim()}` },
      { onSuccess: () => { setEmail(""); setName(""); } },
    );
  };

  const header = (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-16">
        <Link href="/portal" className="flex items-center gap-3">
          <img src={logoImage} alt="EdMeCa" className="h-10 w-auto" />
          <div className="hidden sm:block h-6 w-px bg-border" />
          <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-widest">Admin</span>
        </Link>
        <Link href="/portal">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
        </Link>
      </div>
    </header>
  );

  if (isLoading) {
    return <div className="min-h-screen bg-background">{header}<div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div></div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">{header}
        <main className="max-w-md mx-auto px-4 py-24 text-center space-y-3" data-testid="admin-denied">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-semibold">{(error as Error)?.message || "Could not load access management."}</p>
        </main>
      </div>
    );
  }

  const pending = data.members.filter((m) => m.pending);
  const active = data.members.filter((m) => !m.pending);

  return (
    <div className="min-h-screen bg-background">
      {header}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">Access</h1>
          <p className="text-sm text-muted-foreground">EDMECA Academy is invite-only. Only people invited here can sign in.</p>
        </div>

        {/* Invite */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" />Invite someone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={inviteNow} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.co.za" data-testid="input-invite-email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Name</Label>
                <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" data-testid="input-invite-name" />
              </div>
              <Button type="submit" disabled={busy || !email.trim()} data-testid="button-invite">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Send invite
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-4 w-4" />Applications
              {data.applications.length > 0 && <Badge>{data.applications.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications waiting.</p>
            ) : (
              <div className="divide-y">
                {data.applications.map((a) => (
                  <div key={a.id} className="py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" data-testid={`application-${a.id}`}>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{a.name} <span className="font-normal text-muted-foreground">· {a.email}</span></p>
                      <p className="text-xs text-muted-foreground capitalize">{a.interest_type}{a.organisation ? ` · ${a.organisation}` : ""} · {date(a.created_at)}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{a.motivation}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" disabled={busy} onClick={() => run.mutate({ action: () => adminService.approve(a.id), done: `${a.name} approved and invited` })} data-testid={`button-approve-${a.id}`}>
                        <Check className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => run.mutate({ action: () => adminService.decline(a.id), done: `${a.name}'s application declined` })} data-testid={`button-decline-${a.id}`}>
                        <X className="h-4 w-4 mr-1" />Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invited, not joined yet */}
        {pending.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" />Invited, not signed in yet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {pending.map((m) => (
                  <MemberRow key={m.id} member={m} note={`Invited ${date(m.invited_at)}`}>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => run.mutate({ action: () => adminService.resend(m.id), done: `Invite resent to ${m.email}` })}>Resend</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => run.mutate({ action: () => adminService.revoke(m.id), done: `Invite to ${m.email} cancelled` })}>Cancel invite</Button>
                  </MemberRow>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Members <Badge variant="secondary">{active.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {active.map((m) => (
                <MemberRow key={m.id} member={m} note={`Joined ${date(m.accepted_at ?? m.created_at)}`}>
                  {m.role !== "entrepreneur" && <Badge variant="secondary" className="capitalize">{m.role.replace("_", " ")}</Badge>}
                </MemberRow>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MemberRow({ member, note, children }: { member: AccessMember; note: string; children?: React.ReactNode }) {
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar name={member.name || member.email} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member.name || member.email}</p>
          <p className="text-xs text-muted-foreground truncate">{member.email} · {note}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}
