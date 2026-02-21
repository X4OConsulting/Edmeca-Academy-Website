import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService, artifactsService } from "@/lib/services";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Building2,
  Shield,
  BarChart3,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import logoImage from "@assets/EdMeCa_LOGO.png";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Account form state
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );

  // Business profile form state
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => profileService.getUserProfile(),
    enabled: !!user,
  });

  // Populate business form fields once profile loads
  useEffect(() => {
    if (profile && !profileLoaded) {
      setBusinessName((profile as any).business_name || "");
      setBusinessDescription((profile as any).business_description || "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Fetch artifacts for activity summary
  const { data: artifacts } = useQuery({
    queryKey: ["artifacts"],
    queryFn: () => artifactsService.getArtifacts(),
    enabled: !!user,
  });

  const completedCount = artifacts?.filter((a: any) => a.status === "complete").length || 0;
  const totalCount = artifacts?.length || 0;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toolTypeLabel: Record<string, string> = {
    bmc: "Business Model Canvas",
    swot_pestle: "SWOT / PESTLE",
    value_proposition: "Value Proposition",
    pitch_builder: "Pitch Builder",
  };

  // Update display name mutation
  const updateNameMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Name updated", description: "Your display name has been saved." });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Upsert business profile mutation — also retitles any Untitled artifacts
  const updateBusinessMutation = useMutation({
    mutationFn: async () => {
      // profileService.upsertUserProfile handles user_id injection
      await profileService.upsertUserProfile({
        business_name: businessName,
        business_description: businessDescription,
      });

      // Re-title all artifacts to reflect the business name
      if (!businessName.trim()) return { updated: 0, total: 0 };

      const titleMap: Record<string, string> = {
        bmc: "Business Model Canvas",
        swot_pestle: "SWOT & PESTLE Analysis",
        value_proposition: "Value Proposition",
        pitch_builder: "Pitch Deck",
      };

      const { data: allArtifacts, error: fetchError } = await supabase
        .from("artifacts")
        .select("id, tool_type, title");

      if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
      if (!allArtifacts || allArtifacts.length === 0) {
        return { updated: 0, total: 0 };
      }

      let updated = 0;
      for (const a of allArtifacts) {
        const newTitle = `${businessName.trim()} \u2014 ${titleMap[(a as any).tool_type] || "Document"}`;
        const { error: updateError } = await supabase
          .from("artifacts")
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq("id", (a as any).id);
        if (updateError) throw new Error(`Update error on ${(a as any).id}: ${updateError.message}`);
        updated++;
      }
      return { updated, total: allArtifacts.length };
    },
    onSuccess: (result) => {
      const { updated, total } = result ?? { updated: 0, total: 0 };
      console.log("[Profile] updateBusinessMutation onSuccess:", { updated, total });
      const msg = total === 0
        ? "Saved (0 artifacts found)"
        : `Saved — renamed ${updated}/${total} artifacts`;
      toast({ title: msg });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
    },
    onError: (err: Error) => {
      console.error("[Profile] updateBusinessMutation error:", err);
      toast({ title: `Save failed: ${err.message}`, variant: "destructive" });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/portal" className="flex items-center gap-3">
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
            <Link href="/portal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title + Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback className="text-xl">
              {getInitials(user?.user_metadata?.full_name || user?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {user?.user_metadata?.full_name || "Your Profile"}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 capitalize text-xs">
              {profile?.role || "entrepreneur"}
            </Badge>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Artifacts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Display name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <Button
              onClick={() => updateNameMutation.mutate()}
              disabled={updateNameMutation.isPending}
              size="sm"
            >
              {updateNameMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Name
            </Button>
          </CardContent>
        </Card>

        {/* Business Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading profile...
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business or venture name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessDescription">Business description</Label>
                  <Textarea
                    id="businessDescription"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Briefly describe what your business does..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => updateBusinessMutation.mutate()}
                  disabled={updateBusinessMutation.isPending}
                  size="sm"
                >
                  {updateBusinessMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Business Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {artifacts && artifacts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {artifacts.slice(0, 5).map((artifact: any) => (
                  <div key={artifact.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{artifact.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {toolTypeLabel[artifact.tool_type] || artifact.tool_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs capitalize ${
                          artifact.status === "complete"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {artifact.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {artifact.updated_at
                          ? new Date(artifact.updated_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Change your password. You must be signed in with email/password to use this feature.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <Button
              onClick={() => changePasswordMutation.mutate()}
              disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
              variant="outline"
              size="sm"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
