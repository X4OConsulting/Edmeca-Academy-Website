import { useEffect, useRef, useState } from "react";
import { Download, MessageCircle, RotateCcw, Share2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/logo.png";
import { type ItemId, type RespondentMode, actions, cohortNames, dimensionFor, quadrants } from "@/data/aiMap";
import type { AIMapResult, Movement } from "@/lib/aiMap";
import { movementSentence, onTheLineSentence, positionSentence, routeParagraph } from "@/lib/aiMapCopy";
import { shareImage, svgToPng, toDataUrl, downloadBlob } from "@/lib/aiMapExport";
import type { Profile } from "./ProfileCard";
import { ProfileBars } from "./ProfileBars";
import { CARD_SIZE, MapCard } from "./MapCard";
import { type UnlockFormValues, type UnlockState, UnlockForm } from "./UnlockForm";

type Props = {
  result: AIMapResult;
  mode: RespondentMode;
  profile: Profile;
  movement?: Movement | null;
  previous?: { capability: number; readiness: number } | null;
  cohort?: string;
  unlockState: UnlockState;
  unlockError?: string;
  onUnlock: (values: UnlockFormValues) => void;
  onReset: () => void;
  onRevisit: (itemId: ItemId) => void;
};

export function ReportPanel({ result, mode, profile, movement, previous, cohort, unlockState, unlockError, onUnlock, onReset, onRevisit }: Props) {
  const copy = quadrants[result.quadrant];
  const cardRef = useRef<SVGSVGElement>(null);
  const [logoHref, setLogoHref] = useState<string>();
  const [exporting, setExporting] = useState<"download" | "share" | null>(null);
  const [exportNote, setExportNote] = useState("");
  const onTheLine = onTheLineSentence(result);

  useEffect(() => { toDataUrl(logoImage).then(setLogoHref).catch(() => setLogoHref(undefined)); }, []);

  const exportCard = async (kind: "download" | "share") => {
    if (!cardRef.current || exporting) return;
    setExporting(kind);
    setExportNote("");
    try {
      const blob = await svgToPng(cardRef.current, CARD_SIZE, CARD_SIZE);
      const filename = `edmeca-ai-map-${copy.name.toLowerCase().replace(/[^a-z]+/g, "-")}.png`;
      if (kind === "download") { downloadBlob(blob, filename); setExportNote("Saved your Map Card."); }
      else {
        const outcome = await shareImage(blob, filename, `I am in the ${copy.name} quadrant of the AI Enablement Map. Capability ${result.capability}, readiness ${result.readiness}.`, "https://edmeca.co.za/ai-map");
        setExportNote(outcome === "shared" ? "Shared." : outcome === "downloaded" ? "Sharing is not available here, so the card was saved instead." : "");
      }
    } catch {
      setExportNote("The image could not be created in this browser. Try the download button, or take a screenshot of the map.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-edmeca-green-soft pb-5">
        <img src={logoImage} alt="EdMeCa" className="h-12 w-auto" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">Your position on the AI Enablement Map</p>
          <h2 className="text-3xl font-bold text-edmeca-purple">{copy.name}</h2>
          <p className="text-xs text-edmeca-grey">{copy.subtitle}</p>
        </div>
      </div>

      {cohort && <p className="rounded-full bg-edmeca-green-tint px-3 py-1 text-xs font-semibold text-edmeca-green">Answering as part of {cohortNames[cohort] ?? `cohort ${cohort}`}</p>}

      <section>
        <p className="text-base leading-relaxed text-edmeca-grey">{copy.reading}</p>
        <p className="mt-3 text-sm font-semibold text-edmeca-purple">{positionSentence(result)}</p>
        {onTheLine && <p className="mt-2 text-sm leading-relaxed text-edmeca-grey">{onTheLine}</p>}
        {movement && <p className="mt-2 rounded-lg border border-edmeca-green-soft bg-edmeca-green-tint p-3 text-sm leading-relaxed text-edmeca-grey">{movementSentence(movement, result.quadrant)}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-edmeca-purple-soft px-3 py-1 font-semibold text-edmeca-purple">Capability {result.capability}</span>
          <span className="rounded-full bg-edmeca-purple-soft px-3 py-1 font-semibold text-edmeca-purple">Readiness {result.readiness}</span>
          <span className="rounded-full bg-edmeca-green-tint px-3 py-1 font-semibold text-edmeca-green">Enablement index {result.index}</span>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-edmeca-purple">Your profile</h3>
        <p className="mt-1 text-xs text-edmeca-grey">Eight dimensions, scored 0 to 100. The two in purple move your dot most.</p>
        <div className="mt-4"><ProfileBars result={result} movement={movement} /></div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-edmeca-purple">What moves your dot</h3>
        <div className="mt-3 grid gap-3">
          {result.priorities.map((code) => {
            const dimension = dimensionFor(code);
            const action = actions[code];
            return (
              <article key={code} className="rounded-xl border border-edmeca-green-soft bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold text-edmeca-purple">{dimension.code} {dimension.name}</p>
                  <span className="text-sm font-bold text-edmeca-purple">{result.dimensions[code] ?? "n/a"}</span>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-edmeca-grey">Next 30 days</p>
                <p className="mt-1 text-sm leading-relaxed text-edmeca-grey">{action[mode]}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-edmeca-green">Covered in {action.session}</span>
                  <Link href={`/contact?topic=${encodeURIComponent(dimension.name)}`} className="inline-flex items-center gap-1 font-semibold text-edmeca-purple underline-offset-2 hover:underline"><MessageCircle className="h-3.5 w-3.5" /> Ask about this</Link>
                </div>
                <button type="button" onClick={() => onRevisit(dimension.items[0])} className="mt-2 text-xs text-edmeca-grey underline-offset-2 hover:underline">Revisit these statements</button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-edmeca-purple-soft bg-edmeca-purple-soft/30 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">Your Edmeca route</p>
        <p className="mt-2 text-sm leading-relaxed text-edmeca-grey">{routeParagraph(result, profile.programmeStatus)}</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-edmeca-purple">Your Map Card</h3>
        <p className="mt-1 text-xs text-edmeca-grey">A 1080 by 1080 image of your position, ready for LinkedIn or a team chat.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-edmeca-green-soft bg-white">
          <MapCard ref={cardRef} result={result} mode={mode} logoHref={logoHref} previous={previous} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" disabled={exporting !== null} onClick={() => exportCard("download")} className="border-edmeca-green text-edmeca-green"><Download className="mr-2 h-4 w-4" /> {exporting === "download" ? "Preparing…" : "Download"}</Button>
          <Button variant="outline" disabled={exporting !== null} onClick={() => exportCard("share")} className="border-edmeca-green text-edmeca-green"><Share2 className="mr-2 h-4 w-4" /> {exporting === "share" ? "Preparing…" : "Share"}</Button>
        </div>
        {exportNote && <p className="mt-2 text-xs text-edmeca-grey" role="status">{exportNote}</p>}
      </section>

      <section className="rounded-2xl border border-edmeca-green-soft bg-edmeca-green-tint p-5">
        <h3 className="text-lg font-bold text-edmeca-purple">Get your AI Enablement Report</h3>
        <p className="mt-1 text-sm text-edmeca-grey">A written report on your position, your eight dimensions and your two priorities, emailed to you with a link to come back and move the dot.</p>
        <UnlockForm mode={mode} state={unlockState} error={unlockError} onSubmit={onUnlock} />
      </section>

      <section>
        <h3 className="text-base font-bold text-edmeca-purple">Come back and move the dot</h3>
        <p className="mt-1 text-sm leading-relaxed text-edmeca-grey">The link in your email re-opens this baseline. Retake it after a programme, or in 90 days, and your results will show how far your dot has moved on both axes and in every dimension.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onReset} className="border-edmeca-purple text-edmeca-purple"><RotateCcw className="mr-2 h-4 w-4" /> Start again</Button>
      </div>
    </div>
  );
}
