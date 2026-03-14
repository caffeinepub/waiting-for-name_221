import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateSubject,
  useDeleteSubject,
  useLogStudySession,
  useSaveUserProfile,
  useStudySessions,
  useSubjects,
  useTotalStudyTime,
  useUserProfile,
} from "./hooks/useQueries";

function formatDuration(minutes: bigint): string {
  const m = Number(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Login Screen ────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();
  const loading = isLoggingIn || isInitializing;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.13 75) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.13 75) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.13 75), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-md w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "oklch(0.78 0.13 75 / 0.15)",
            border: "1px solid oklch(0.78 0.13 75 / 0.3)",
          }}
        >
          <GraduationCap className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="font-display text-5xl font-bold text-foreground tracking-tight">
            Study Tracker
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Track your learning journey. Log sessions, manage subjects, and
            watch your knowledge grow.
          </p>
        </div>

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full"
        >
          <Button
            data-ocid="auth.primary_button"
            size="lg"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            onClick={login}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="mr-2 h-4 w-4" />
            )}
            {loading ? "Connecting..." : "Login with Internet Identity"}
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground">
          Secure, decentralized identity — no passwords needed.
        </p>
      </motion.div>

      <footer className="absolute bottom-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline underline-offset-2 hover:text-foreground transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: sessions = [], isLoading: sessionsLoading } =
    useStudySessions();
  const { data: totalTimes = [], isLoading: timesLoading } =
    useTotalStudyTime();
  const { data: subjects = [] } = useSubjects();

  const loading = sessionsLoading || timesLoading;

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  const sortedSessions = [...sessions].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );
  const recentSessions = sortedSessions.slice(0, 10);

  const totalMinutes = sessions.reduce(
    (acc, s) => acc + Number(s.durationMinutes),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
              Total Time
            </p>
            <p className="font-display text-3xl font-bold text-primary">
              {formatDuration(BigInt(totalMinutes))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
              Sessions
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {sessions.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border col-span-2 md:col-span-1">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
              Subjects
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {subjects.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-subject totals */}
      {totalTimes.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Time by Subject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalTimes.map(([subjectId, minutes]) => {
              const max = Math.max(...totalTimes.map(([, m]) => Number(m)));
              const pct = max > 0 ? (Number(minutes) / max) * 100 : 0;
              return (
                <div key={subjectId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">
                      {subjectMap[subjectId] ?? subjectId}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              data-ocid="dashboard.loading_state"
              className="flex items-center gap-2 text-muted-foreground py-4"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading sessions...</span>
            </div>
          ) : recentSessions.length === 0 ? (
            <div data-ocid="dashboard.empty_state" className="text-center py-8">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm">
                No sessions yet. Log your first study session!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  data-ocid={`dashboard.item.${i + 1}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {subjectMap[session.subjectId] ?? session.subjectId}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/30 text-primary"
                      >
                        {formatDuration(session.durationMinutes)}
                      </Badge>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {session.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(session.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────

function SubjectsTab() {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    try {
      await createSubject.mutateAsync({
        id,
        name: name.trim(),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      toast.success("Subject created!");
    } catch {
      toast.error("Failed to create subject.");
    }
  };

  const handleDelete = async (id: string, subjectName: string) => {
    try {
      await deleteSubject.mutateAsync(id);
      toast.success(`"${subjectName}" deleted.`);
    } catch {
      toast.error("Failed to delete subject.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add subject form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">
            Add New Subject
          </CardTitle>
          <CardDescription>
            Create a subject to track your study sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-name" className="text-sm font-medium">
              Subject Name
            </Label>
            <Input
              id="subject-name"
              data-ocid="subject.input"
              placeholder="e.g. Mathematics, History, Machine Learning…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-desc" className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="subject-desc"
              data-ocid="subject.textarea"
              placeholder="What will you study? Goals, resources…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            data-ocid="subject.submit_button"
            onClick={handleCreate}
            disabled={!name.trim() || createSubject.isPending}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            {createSubject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Subject
          </Button>
        </CardContent>
      </Card>

      {/* Subject list */}
      <div className="space-y-2">
        {isLoading ? (
          <div
            data-ocid="subjects.loading_state"
            className="flex items-center gap-2 text-muted-foreground py-4"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <Card
            data-ocid="subjects.empty_state"
            className="bg-card border-border"
          >
            <CardContent className="text-center py-10">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-muted-foreground text-sm">
                No subjects yet. Add your first one above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {subjects.map((subject, i) => (
              <motion.div
                key={subject.id}
                data-ocid={`subjects.item.${i + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </div>
                    <Button
                      data-ocid={`subjects.delete_button.${i + 1}`}
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(subject.id, subject.name)}
                      disabled={deleteSubject.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Log Session Tab ──────────────────────────────────────────────────────────

function LogSessionTab() {
  const { data: subjects = [] } = useSubjects();
  const logSession = useLogStudySession();
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (
      !subjectId ||
      !duration ||
      Number.isNaN(Number(duration)) ||
      Number(duration) <= 0
    )
      return;
    try {
      await logSession.mutateAsync({
        subjectId,
        durationMinutes: Number(duration),
        notes,
      });
      setSubjectId("");
      setDuration("");
      setNotes("");
      setSuccess(true);
      toast.success("Study session logged!");
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      toast.error("Failed to log session.");
    }
  };

  return (
    <div className="max-w-lg">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">
            Log a Study Session
          </CardTitle>
          <CardDescription>
            Record what you studied and for how long.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger data-ocid="session.select" className="w-full">
                <SelectValue placeholder="Choose a subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No subjects — create one first
                  </SelectItem>
                ) : (
                  subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              data-ocid="session.input"
              type="number"
              min="1"
              placeholder="e.g. 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="session-notes"
              data-ocid="session.textarea"
              placeholder="What did you cover? Any breakthroughs or challenges…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                data-ocid="session.success_state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm font-medium p-3 rounded-lg"
                style={{
                  background: "oklch(0.68 0.1 195 / 0.1)",
                  color: "oklch(0.68 0.1 195)",
                }}
              >
                <Check className="w-4 h-4" /> Session logged successfully!
              </motion.div>
            ) : (
              <motion.div
                key="button"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  data-ocid="session.submit_button"
                  onClick={handleSubmit}
                  disabled={
                    !subjectId ||
                    !duration ||
                    Number(duration) <= 0 ||
                    logSession.isPending
                  }
                  className="w-full bg-primary text-primary-foreground hover:opacity-90"
                >
                  {logSession.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  Log Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile Popover ──────────────────────────────────────────────────────────

function ProfileEditor() {
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveUserProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  if (!editing) {
    return (
      <Button
        data-ocid="profile.edit_button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground gap-1.5"
        onClick={() => {
          setName(profile?.name ?? "");
          setEditing(true);
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
        {profile?.name ?? "Set name"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        data-ocid="profile.input"
        className="h-8 text-sm w-36"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        autoFocus
        placeholder="Your name"
      />
      <Button
        data-ocid="profile.save_button"
        size="sm"
        className="h-8 bg-primary text-primary-foreground hover:opacity-90"
        onClick={handleSave}
        disabled={saveProfile.isPending}
      >
        {saveProfile.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const { clear } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              Study Tracker
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ProfileEditor />
            <Separator orientation="vertical" className="h-5" />
            <Button
              data-ocid="nav.button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5"
              onClick={clear}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            data-ocid="nav.tab"
            className="mb-6 bg-muted/40 border border-border"
          >
            <TabsTrigger
              data-ocid="dashboard.tab"
              value="dashboard"
              className="data-[state=active]:bg-card data-[state=active]:text-primary"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger
              data-ocid="subjects.tab"
              value="subjects"
              className="data-[state=active]:bg-card data-[state=active]:text-primary"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Subjects
            </TabsTrigger>
            <TabsTrigger
              data-ocid="session.tab"
              value="log"
              className="data-[state=active]:bg-card data-[state=active]:text-primary"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Log Session
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <TabsContent
                value="dashboard"
                forceMount
                className={activeTab !== "dashboard" ? "hidden" : ""}
              >
                <DashboardTab />
              </TabsContent>
              <TabsContent
                value="subjects"
                forceMount
                className={activeTab !== "subjects" ? "hidden" : ""}
              >
                <SubjectsTab />
              </TabsContent>
              <TabsContent
                value="log"
                forceMount
                className={activeTab !== "log" ? "hidden" : ""}
              >
                <LogSessionTab />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline underline-offset-2 hover:text-foreground transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>

      <Toaster />
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <GraduationCap className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">Initializing…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {identity ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
