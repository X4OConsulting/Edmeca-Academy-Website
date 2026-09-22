import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Landing } from "@/components/aimap/Landing";
import { MapAndGuide } from "@/components/aimap/MapAndGuide";
import { EnablementMap, type TrailPoint } from "@/components/aimap/EnablementMap";
import { DimensionList } from "@/components/aimap/DimensionList";
import { GuidePanel } from "@/components/aimap/GuidePanel";
import { ModeCard } from "@/components/aimap/ModeCard";
import { ProfileCard, type Profile } from "@/components/aimap/ProfileCard";
import { ContextCard } from "@/components/aimap/ContextCard";
import { ReportPanel } from "@/components/aimap/ReportPanel";
import type { UnlockFormValues, UnlockState } from "@/components/aimap/UnlockForm";
import { type Answer, type Answers, type ItemId, type RespondentMode, type Wave, cohortNames } from "@/data/aiMap";
import { type AIMapResult, type Movement, type PriorPosition, allAnswered, isAnswer, itemsForWave, movementBetween, nextUnanswered, runningPosition, scoreAIMap } from "@/lib/aiMap";

type View = "landing" | "map";
type Phase = "who" | "answering" | "profile" | "context" | "resolving" | "resolved";
type Prior = (PriorPosition & { respondentId?: string; timestamp?: string; mode?: string; profile?: Partial<Profile> }) | null;

type Persisted = {
  respondentId: string;
  view: View;
  phase: Phase;
  mode?: RespondentMode;
  answers: Answers;
  order: ItemId[];
  activeItem: ItemId;
  profile: Profile;
  context: string;
  cohort: string;
  retestOf: string;
  wave: Wave;
  prior: Prior;
  result: AIMapResult | null;
  movement: Movement | null;
  unlockState: UnlockState;
};

const STORAGE_KEY = "ai-map-state";
const RESOLVE_MS = 1500;
const emptyProfile: Profile = { sizeOrRole: "", sector: "", programmeStatus: "" };

function readParams() {
  if (typeof window === "undefined") return { cohort: "", retestOf: "", wave: "baseline" as Wave, forced: undefined as RespondentMode | undefined };
  const params = new URLSearchParams(window.location.search);
  const cohort = (params.get("cohort") || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const retestOf = (params.get("rt") || "").trim();
  const waveParam = params.get("wave");
  const wave: Wave = waveParam === "mid" ? "mid" : waveParam === "post" || retestOf ? "post" : "baseline";
  const forParam = params.get("for");
  const forced: RespondentMode | undefined = forParam === "individual" || forParam === "business" ? forParam : undefined;
  return { cohort, retestOf, wave, forced };
}

function loadPersisted(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    return parsed && parsed.respondentId ? parsed : null;
  } catch {
    return null;
  }
}

function newRespondentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;
}

async function post<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const response = await fetch("/api/ai-map", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export default function AIMap() {
  const params = useMemo(readParams, []);
  const saved = useMemo(loadPersisted, []);
  const [respondentId, setRespondentId] = useState(saved?.respondentId ?? newRespondentId());
  const [view, setView] = useState<View>(saved?.view ?? "landing");
  const [phase, setPhase] = useState<Phase>(saved?.phase ?? "who");
  const [mode, setMode] = useState<RespondentMode | undefined>(saved?.mode ?? params.forced);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [order, setOrder] = useState<ItemId[]>(saved?.order ?? []);
  const [activeItem, setActiveItem] = useState<ItemId>(saved?.activeItem ?? itemsForWave(params.wave)[0]);
  const [profile, setProfile] = useState<Profile>(saved?.profile ?? emptyProfile);
  const [context, setContext] = useState(saved?.context ?? "");
  const [cohort] = useState(saved?.cohort || params.cohort);
  const [retestOf] = useState(saved?.retestOf || params.retestOf);
  const [wave] = useState<Wave>(saved?.wave ?? params.wave);
  const [prior, setPrior] = useState<Prior>(saved?.prior ?? null);
  const [result, setResult] = useState<AIMapResult | null>(saved?.result ?? null);
  const [movement, setMovement] = useState<Movement | null>(saved?.movement ?? null);
  const [unlockState, setUnlockState] = useState<UnlockState>(saved?.unlockState === "done" ? "done" : "idle");
  const [unlockError, setUnlockError] = useState("");
  const resolveTimer = useRef<number>();

  const items = useMemo(() => itemsForWave(wave), [wave]);

  useEffect(() => {
    document.title = "AI Enablement Map | Edmeca";
    document.documentElement.classList.add("diagnostic-mode");
    return () => document.documentElement.classList.remove("diagnostic-mode");
  }, []);

  // Re-test link: fetch the baseline so mode and profile are pre-selected and movement can be shown.
  useEffect(() => {
    if (!retestOf || prior) return;
    post<{ previous?: Prior }>({ action: "retest", retestOf }).then((answer) => {
      const previous = answer?.previous ?? null;
      if (!previous) return;
      setPrior(previous);
      if (!mode && (previous.mode === "business" || previous.mode === "individual")) setMode(previous.mode);
      setProfile((current) => ({ sizeOrRole: current.sizeOrRole || previous.profile?.sizeOrRole || "", sector: current.sector || previous.profile?.sector || "", programmeStatus: current.programmeStatus || previous.profile?.programmeStatus || "" }));
    });
  }, [retestOf, prior, mode]);

  // Persist under the respondentId so a refresh does not lose the map.
  useEffect(() => {
    const state: Persisted = { respondentId, view, phase: phase === "resolving" ? "context" : phase, mode, answers, order, activeItem, profile, context, cohort, retestOf, wave, prior, result, movement, unlockState };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable: the page still works */ }
  }, [respondentId, view, phase, mode, answers, order, activeItem, profile, context, cohort, retestOf, wave, prior, result, movement, unlockState]);

  const trail = useMemo<TrailPoint[]>(() => {
    const replay: Answers = {};
    return order.filter((id) => isAnswer(answers[id])).map((id) => { replay[id] = answers[id]; const position = runningPosition(replay); return { itemId: id, ...position }; });
  }, [order, answers]);

  const live = phase === "resolved" && result ? { capability: result.capability, readiness: result.readiness } : runningPosition(answers);

  const goTo = useCallback((id: ItemId) => { setActiveItem(id); setPhase("answering"); }, []);

  const answer = useCallback((value: Answer) => {
    const next: Answers = { ...answers, [activeItem]: value };
    setAnswers(next);
    setOrder((current) => (current.includes(activeItem) ? current : [...current, activeItem]));
    const following = nextUnanswered(next, activeItem, wave);
    if (following !== undefined) {
      setActiveItem(following);
    } else if (allAnswered(next, wave)) {
      // Revisiting an answered statement after the results were shown keeps the respondent in the flow.
      setPhase(result ? "context" : "profile");
    }
  }, [answers, activeItem, wave, result]);

  const step = useCallback((direction: 1 | -1) => {
    const index = items.indexOf(activeItem);
    const target = items[index + direction];
    if (target !== undefined) setActiveItem(target);
  }, [items, activeItem]);

  // Keyboard: 1 to 5 answer, arrows move between statements.
  useEffect(() => {
    if (view !== "map" || phase !== "answering") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (/^[1-5]$/.test(event.key)) { event.preventDefault(); answer((Number(event.key) - 1) as Answer); }
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); step(1); }
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, phase, answer, step]);

  useEffect(() => () => window.clearTimeout(resolveTimer.current), []);

  const start = () => {
    setView("map");
    setPhase(mode ? "answering" : "who");
    if (!activeItem || !items.includes(activeItem)) setActiveItem(items[0]);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const chooseMode = (value: RespondentMode) => { setMode(value); setPhase("answering"); };

  const resolve = () => {
    if (!mode) return;
    setPhase("resolving");
    const local = scoreAIMap(answers, prior);
    const localMovement = prior ? movementBetween(prior, local) : null;
    const request = post<{ ok: boolean; result?: AIMapResult; movement?: Movement | null }>({
      action: "baseline", respondentId, wave, retestOf: retestOf || undefined, cohort: cohort || undefined, mode, answers, profile, context,
      userAgent: navigator.userAgent, referrer: document.referrer,
    });
    const delay = new Promise((done) => { resolveTimer.current = window.setTimeout(done, RESOLVE_MS); });
    Promise.all([request, delay]).then(([answerFromServer]) => {
      setResult(answerFromServer?.result ?? local);
      setMovement(answerFromServer?.movement ?? localMovement);
      setPhase("resolved");
    });
  };

  const unlock = async (values: UnlockFormValues) => {
    if (!mode || !result) return;
    setUnlockState("submitting");
    setUnlockError("");
    const answerFromServer = await post<{ ok: boolean; movement?: Movement | null }>({
      action: "unlock", respondentId, wave, retestOf: retestOf || undefined, cohort: cohort || undefined, mode, answers, profile, context,
      name: values.name, email: values.email, organisation: values.organisation, wantsCall: values.wantsCall, website: values.website,
      userAgent: navigator.userAgent, referrer: document.referrer,
    });
    if (!answerFromServer?.ok) {
      setUnlockState("error");
      setUnlockError("We could not send your report just now. Your position is still on this screen. Please try again in a moment.");
      return;
    }
    if (answerFromServer.movement && !movement) setMovement(answerFromServer.movement);
    setUnlockState("done");
  };

  const reset = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setRespondentId(newRespondentId());
    setView("landing");
    setPhase(params.forced ? "answering" : "who");
    setMode(params.forced);
    setAnswers({});
    setOrder([]);
    setActiveItem(items[0]);
    setProfile(emptyProfile);
    setContext("");
    setResult(null);
    setMovement(null);
    setUnlockState("idle");
    setUnlockError("");
  };

  const cohortLabel = cohort ? cohortNames[cohort] ?? cohort : undefined;

  if (view === "landing") {
    return <MarketingLayout><Landing onStart={start} cohortLabel={cohortLabel} returning={Boolean(prior)} /></MarketingLayout>;
  }

  const resolved = phase === "resolved" && Boolean(result);
  const previousDot = prior ? { capability: prior.capability, readiness: prior.readiness } : null;
  const mapProps = { capability: live.capability, readiness: live.readiness, mode: mode ?? "business", trail, activeItem: phase === "answering" ? activeItem : undefined, result, resolved, previous: previousDot } as const;
  const map = <EnablementMap {...mapProps} onTrailPoint={phase === "resolving" ? undefined : goTo} className="h-auto w-full" />;
  const compactMap = <EnablementMap {...mapProps} compact className="h-40 w-40" />;
  const dimensionList = phase === "who" ? undefined : <DimensionList answers={answers} activeItem={phase === "answering" ? activeItem : undefined} wave={wave} onSelect={goTo} disabled={phase === "resolving"} />;

  const guide = phase === "who"
    ? <ModeCard mode={mode} onSelect={chooseMode} />
    : phase === "answering" && mode
      ? <GuidePanel itemId={activeItem} mode={mode} value={answers[activeItem]} index={items.indexOf(activeItem) + 1} total={items.length} onAnswer={answer} onPrev={items.indexOf(activeItem) > 0 ? () => step(-1) : undefined} onNext={items.indexOf(activeItem) < items.length - 1 ? () => step(1) : allAnswered(answers, wave) ? () => setPhase(result ? "context" : "profile") : undefined} />
      : phase === "profile" && mode
        ? <ProfileCard mode={mode} profile={profile} onChange={setProfile} onContinue={() => setPhase("context")} />
        : phase === "context"
          ? <ContextCard value={context} onChange={setContext} onContinue={resolve} onSkip={() => { setContext(""); resolve(); }} />
          : phase === "resolving"
            ? <div className="flex min-h-96 items-center justify-center text-center"><div><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-edmeca-green-soft border-t-edmeca-purple" /><p className="mt-5 font-bold text-edmeca-purple">Placing your dot…</p></div></div>
            : result && mode
              ? <ReportPanel result={result} mode={mode} profile={profile} movement={movement} previous={previousDot} cohort={cohort || undefined} unlockState={unlockState} unlockError={unlockError} onUnlock={unlock} onReset={reset} onRevisit={goTo} />
              : null;

  const waveLabel = wave === "mid" ? "Mid-point pulse" : wave === "post" ? "Follow-up assessment" : "AI Enablement Baseline";

  return (
    <MarketingLayout>
      <MapAndGuide
        eyebrow={waveLabel}
        hint={phase === "resolved" ? "Your position, your profile and what moves your dot." : "Answer each statement as it is today, not as you would like it to be. Partly is a real answer."}
        badge={cohortLabel ? `Answering as part of ${cohortLabel}` : undefined}
        map={map}
        compactMap={compactMap}
        dimensionList={dimensionList}
        guide={guide}
        onExit={() => setView("landing")}
      />
    </MarketingLayout>
  );
}
