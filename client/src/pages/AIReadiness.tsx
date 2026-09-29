import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  baselineDimensions,
  baselineDistribution,
  questions,
  recommendationText,
  sectors,
  sizes,
  type ReadinessAnswers,
  type ReadinessDimension,
  type ReadinessProfile,
} from "@/data/aiReadiness";
import { dimensionOrder, scoreReadiness, type ReadinessResult } from "@/lib/readinessScoring";
import logoImage from "@assets/logo.png";

const dimensionNames: Record<ReadinessDimension, string> = {
  foundations: "Strategic intent",
  operations: "Opportunity focus",
  sales: "Execution systems",
  finance: "Capability and adoption",
  innovation: "Evidence and learning",
};

const stageLabels = ["Intent", "Focus", "Activation", "Measurement", "Evidence"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "landing" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "placing" | "results";
type UnlockState = "idle" | "submitting" | "done" | "error";

function getRespondentId(): string {
  const stored = sessionStorage.getItem("edmeca-readiness-id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  sessionStorage.setItem("edmeca-readiness-id", id);
  return id;
}

async function postAssessment(payload: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch("/api/assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The assessment service is unavailable.");
  return data;
}

function ProgressHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <header className="border-b border-white/10 bg-primary/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" aria-label="EdMeCa home"><img src={logoImage} alt="EdMeCa" width="100" height="56" className="h-10 w-auto brightness-0 invert" /></a>
        <div className="flex items-center gap-5 text-sm text-white/70">
          <span>{step} / 7</span>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-white transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
      <div className="h-1 bg-white/10"><div className="h-full bg-accent transition-all duration-500" style={{ width: `${(step / 7) * 100}%` }} /></div>
    </header>
  );
}

function StageStrip() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stageLabels.map((stage, index) => (
        <div key={stage} className="relative flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-3 text-left sm:justify-center">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">{index + 1}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/75">{stage}</span>
          {index < 4 && <ChevronRight className="absolute -right-3 z-10 hidden h-4 w-4 text-accent sm:block" />}
        </div>
      ))}
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8 lg:py-12">
        <div className="flex items-center justify-between"><a href="/" aria-label="EdMeCa home"><img src={logoImage} alt="EdMeCa" width="100" height="56" className="h-12 w-auto brightness-0 invert" /></a><span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">From Strategy to Evidence</span></div>
        <div className="flex flex-1 items-center py-16"><div className="w-full max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> From Strategy to Evidence Assessment</div>
          <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">How ready is your business to turn strategy into evidence?</h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70">Seven practical questions, three minutes. See how clearly your business moves from strategic intent to focused action, capable teams, measured progress and credible evidence.</p>
          <div className="mt-12"><StageStrip /></div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Button onClick={onStart} size="lg" className="h-12 bg-accent px-7 text-primary hover:bg-accent/90">Start the snapshot <ArrowRight className="ml-2 h-4 w-4" /></Button><span className="text-sm text-white/55">Free. No account needed. Report to your inbox.</span></div>
        </div></div>
        <p className="text-sm text-white/45">Built on Edmeca's Strategy to Evidence framework</p>
      </div>
    </main>
  );
}

function QuestionStep({ question, selected, onSelect }: { question: (typeof questions)[number]; selected?: number; onSelect: (value: number) => void }) {
  return <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{question.label}</p>
    <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">{question.question}</h1>
    <p className="mt-4 text-sm text-white/50">{question.session} of the Edmeca Strategy to Evidence pathway</p>
    <div className="mt-10 space-y-3" role="radiogroup" aria-label={question.question}>
      {question.options.map((option, index) => <button key={option} type="button" role="radio" aria-checked={selected === index + 1} onClick={() => onSelect(index + 1)} className={`flex min-h-[76px] w-full items-start gap-4 border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected === index + 1 ? "border-accent bg-accent/15" : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${selected === index + 1 ? "border-accent bg-accent text-primary" : "border-white/25 text-white/70"}`}>{index + 1}</span><span className="pt-1 text-sm leading-relaxed text-white/80">{option}</span>
      </button>)}
    </div>
  </div>;
}

function BenchmarkStep({ profile, setProfile, onNext }: { profile: ReadinessProfile; setProfile: (profile: ReadinessProfile) => void; onNext: () => void }) {
  return <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">ABOUT YOUR BUSINESS</p><h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">Two quick details for your benchmark</h1><p className="mt-4 text-white/65">We compare you with businesses like yours, and both details feed your report.</p>
    <fieldset className="mt-10"><legend className="text-sm font-bold uppercase tracking-wider text-white/75">Sector</legend><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{sectors.map((sector) => <button key={sector} type="button" onClick={() => setProfile({ ...profile, sector })} className={`min-h-14 border px-3 py-3 text-left text-sm transition ${profile.sector === sector ? "border-accent bg-accent/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"}`}>{sector}</button>)}</div></fieldset>
    <fieldset className="mt-10"><legend className="text-sm font-bold uppercase tracking-wider text-white/75">Business size (people)</legend><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{sizes.map((size) => <button key={size} type="button" onClick={() => setProfile({ ...profile, size })} className={`min-h-14 border px-3 py-3 text-center text-sm transition ${profile.size === size ? "border-accent bg-accent/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"}`}>{size}</button>)}</div></fieldset>
    <Button onClick={onNext} disabled={!profile.sector || !profile.size} className="mt-10 bg-accent text-primary hover:bg-accent/90">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
  </div>;
}

function ContextStep({ context, setContext, onResults }: { context: string; setContext: (value: string) => void; onResults: () => void }) {
  return <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">THE PART THAT MAKES YOUR REPORT SMART</p><h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">What is actually happening with AI in your business right now?</h1><p className="mt-4 leading-relaxed text-white/65">Tools you use, things you have tried, wins, false starts, what is getting in the way. The more real, the sharper your report. Written in confidence; never shared.</p><textarea value={context} onChange={(event) => setContext(event.target.value.slice(0, 2000))} maxLength={2000} placeholder="A sentence or two makes a real difference." className="mt-8 min-h-48 w-full resize-y border border-white/15 bg-white/5 p-4 text-white placeholder:text-white/35 focus:border-accent focus:outline-none" /><div className="mt-2 text-right text-xs text-white/45">{context.length} / 2000</div><div className="mt-8 flex items-center gap-5"><button type="button" onClick={onResults} className="text-sm font-semibold text-white/60 underline underline-offset-4 hover:text-white">Skip</button><Button onClick={onResults} className="bg-accent text-primary hover:bg-accent/90">See my results <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>;
}

function Placing() { return <div className="flex min-h-[70vh] items-center justify-center px-5 text-center"><div><div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-accent" /><p className="mt-7 font-serif text-3xl font-bold text-white">Placing you on the map...</p><p className="mt-3 text-white/55">Your snapshot is being scored across five dimensions.</p></div></div>; }

function ScoreGauge({ score }: { score: number }) { const radius = 52; const circumference = 2 * Math.PI * radius; return <div className="relative h-40 w-40"><svg viewBox="0 0 128 128" className="h-full w-full -rotate-90"><circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10" /><circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--accent))" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-4xl text-white">{score}</strong><span className="text-xs uppercase tracking-wider text-white/50">out of 100</span></div></div>; }

function StageBars({ stageIndex }: { stageIndex: number }) { return <div className="space-y-4">{baselineDistribution.map((value, index) => <div key={stageLabels[index]}><div className="mb-1 flex justify-between text-xs text-white/60"><span>{stageLabels[index]}</span><span>{index === stageIndex ? "YOU" : `${value}%`}</span></div><div className="h-3 bg-white/10"><div className={`h-full ${index === stageIndex ? "bg-accent" : "bg-white/25"}`} style={{ width: `${value * 2.2}%` }} /></div></div>)}</div>; }

function ShapeRadar({ result }: { result: ReadinessResult }) { const points = (values: number[]) => values.map((value, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5; const radius = 78 * (value / 5); return `${110 + Math.cos(angle) * radius},${110 + Math.sin(angle) * radius}`; }).join(" "); const values = dimensionOrder.map((dimension) => result.scores[dimension]); return <div className="mx-auto max-w-xs"><svg viewBox="0 0 220 220" className="w-full"><polygon points={points([5, 5, 5, 5, 5])} fill="none" stroke="rgba(255,255,255,.18)" /><polygon points={points([4, 4, 4, 4, 4])} fill="none" stroke="rgba(255,255,255,.12)" /><polygon points={points([3, 3, 3, 3, 3])} fill="none" stroke="rgba(255,255,255,.12)" /><polygon points={points(baselineDimensions)} fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.55)" strokeWidth="2" /><polygon points={points(values)} fill="rgba(245,145,40,.3)" stroke="hsl(var(--accent))" strokeWidth="3" />{dimensionOrder.map((dimension, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5; return <text key={dimension} x={110 + Math.cos(angle) * 100} y={110 + Math.sin(angle) * 100} fill="rgba(255,255,255,.7)" fontSize="8" textAnchor="middle">{dimensionNames[dimension].split(" ")[0]}</text>; })}</svg></div>; }

function Results({ result, profile, context, respondentId }: { result: ReadinessResult; profile: ReadinessProfile; context: string; respondentId: string }) {
  const [unlock, setUnlock] = useState<UnlockState>("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", wantsCall: false, website: "" });
  const weakestScore = result.scores[result.weakest];
  const recommendation = recommendationText[result.weakest][weakestScore <= 2 ? 0 : weakestScore === 3 ? 1 : 2];
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!form.name.trim() || !emailPattern.test(form.email)) { setError("Please enter your name and a valid work email."); return; } if (form.website) return; setUnlock("submitting"); setError(""); try { await postAssessment({ action: "unlock", respondentId, answers: result.scores, profile, context, result, ...form }); setUnlock("done"); } catch (caught) { setUnlock("error"); setError(caught instanceof Error ? caught.message : "We could not send your report. Please try again."); } };
  return <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">YOUR STRATEGY TO EVIDENCE POSITION</p><h1 className="mt-4 font-serif text-5xl font-bold text-white sm:text-6xl">{result.stage.name}</h1><p className="mt-4 text-lg leading-relaxed text-white/70">{result.stage.descriptor}</p></div><div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.5fr]"><section className="border border-white/10 bg-white/5 p-6 sm:p-8"><div className="flex flex-col items-center gap-6 sm:flex-row"><ScoreGauge score={result.score} /><p className="max-w-xs text-sm leading-relaxed text-white/70">Your strategy-to-evidence score is <strong className="text-white">{result.score}/100</strong>.<span className="mt-3 block text-xs text-white/40">The benchmark is a starting baseline and will strengthen as Edmeca gathers more evidence.</span></p></div></section><section className="border border-white/10 bg-white/5 p-6 sm:p-8"><h2 className="font-serif text-2xl font-bold text-white">Your next move</h2><p className="mt-3 leading-relaxed text-white/65">Your strongest area is <strong className="text-white">{dimensionNames[result.strongest]}</strong>. Focus next on {dimensionNames[result.weakest].toLowerCase()}: {recommendation}</p></section></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="border border-white/10 bg-white/5 p-6 sm:p-8"><h2 className="mb-7 font-serif text-2xl font-bold text-white">Where businesses are moving</h2><StageBars stageIndex={result.stageIndex} /></section><section className="border border-white/10 bg-white/5 p-6 sm:p-8"><h2 className="mb-2 font-serif text-2xl font-bold text-white">Your shape vs the field</h2><p className="mb-3 text-sm text-white/50">Orange is your position. White is the modelled field.</p><ShapeRadar result={result} /></section></div><section className="mt-12 border border-accent/35 bg-white/5 p-6 sm:p-10"><div className="flex items-start gap-3"><LockKeyhole className="mt-1 h-5 w-5 text-accent" /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">UNLOCK YOUR FULL ASSESSMENT</p><h2 className="mt-3 font-serif text-3xl font-bold text-white">Turn your position into a 90-day evidence plan.</h2><ul className="mt-5 grid gap-2 text-sm text-white/70 sm:grid-cols-2">{["A clear interpretation of your position", "Your strongest and weakest capabilities", "Practical priorities for the next 90 days", "Recommendations grounded in your context", "The relevant Edmeca pathway sessions"].map((item) => <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" />{item}</li>)}</ul>{unlock === "done" ? <div className="mt-8 border border-green-400/30 bg-green-400/10 p-5 text-white">Your report is on its way to {form.email}. Check your spam folder if it has not arrived in a few minutes.</div> : <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2"><input tabIndex={-1} aria-hidden="true" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="absolute left-[-9999px]" autoComplete="off" /><label className="text-sm text-white/70">Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full border border-white/15 bg-primary/40 px-3 py-3 text-white placeholder:text-white/30 focus:border-accent focus:outline-none" placeholder="Your name" /></label><label className="text-sm text-white/70">Work email *<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full border border-white/15 bg-primary/40 px-3 py-3 text-white placeholder:text-white/30 focus:border-accent focus:outline-none" placeholder="you@company.co.za" /></label><label className="text-sm text-white/70">Company<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} className="mt-2 w-full border border-white/15 bg-primary/40 px-3 py-3 text-white focus:border-accent focus:outline-none" /></label><label className="text-sm text-white/70">Role<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-2 w-full border border-white/15 bg-primary/40 px-3 py-3 text-white focus:border-accent focus:outline-none" /></label><label className="flex items-center gap-3 text-sm text-white/70 sm:col-span-2"><input type="checkbox" checked={form.wantsCall} onChange={(event) => setForm({ ...form, wantsCall: event.target.checked })} className="h-4 w-4 accent-accent" />I would like a no-obligation call</label>{error && <p className="text-sm text-red-300 sm:col-span-2">{error}</p>}<div className="sm:col-span-2"><Button disabled={unlock === "submitting"} className="bg-accent text-primary hover:bg-accent/90">{unlock === "submitting" ? "Generating your report..." : unlock === "error" ? "Try again" : "Generate my full assessment"}<Mail className="ml-2 h-4 w-4" /></Button><p className="mt-3 text-xs leading-relaxed text-white/40">We use your details to send your assessment and, if you tick the box, to arrange a call. We do not share them.</p></div></form>}</div></div></section></div>;
}

export default function AIReadiness() {
  const [step, setStep] = useState<Step>("landing");
  const [answers, setAnswers] = useState<ReadinessAnswers>({});
  const [profile, setProfile] = useState<ReadinessProfile>({ sector: "", size: "" });
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const respondentId = useMemo(getRespondentId, []);

  useEffect(() => { document.title = "From Strategy to Evidence Assessment | Edmeca"; }, []);

  const start = () => setStep(1);
  const selectAnswer = (value: number) => { if (typeof step !== "number" || step < 1 || step > 5) return; const nextAnswers = { ...answers, [questions[step - 1].dimension]: value }; setAnswers(nextAnswers); window.setTimeout(() => setStep((step + 1) as Step), 250); };
  const showResults = async () => { setStep("placing"); const nextResult = scoreReadiness(answers); setResult(nextResult); try { await Promise.race([postAssessment({ action: "snapshot", respondentId, answers, profile, context, userAgent: navigator.userAgent, referrer: document.referrer }), new Promise((resolve) => window.setTimeout(resolve, 1800))]); } catch { /* Results remain available if the optional integration is not configured. */ } await new Promise((resolve) => window.setTimeout(resolve, 1800)); setStep("results"); };
  const back = () => { if (typeof step === "number" && step > 1) setStep((step - 1) as Step); else if (step === 1) setStep("landing"); else if (step === 7) setStep(6); };

  if (step === "landing") return <Landing onStart={start} />;
  return <main className="min-h-screen bg-primary text-primary-foreground">{step !== "placing" && step !== "results" && <ProgressHeader step={step} onBack={back} />}{step === "placing" && <Placing />}{step === "results" && result && <Results result={result} profile={profile} context={context} respondentId={respondentId} />}{typeof step === "number" && step >= 1 && step <= 5 && <QuestionStep question={questions[step - 1]} selected={answers[questions[step - 1].dimension]} onSelect={selectAnswer} />}{step === 6 && <BenchmarkStep profile={profile} setProfile={setProfile} onNext={() => setStep(7)} />}{step === 7 && <ContextStep context={context} setContext={setContext} onResults={showResults} />}</main>;
}
