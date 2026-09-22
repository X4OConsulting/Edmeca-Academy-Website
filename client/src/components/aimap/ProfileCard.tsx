import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type RespondentMode, businessSizes, programmeStatuses, roles, sectors } from "@/data/aiMap";

export type Profile = { sizeOrRole: string; sector: string; programmeStatus: string };

type Props = { mode: RespondentMode; profile: Profile; onChange: (profile: Profile) => void; onContinue: () => void };

function Choice({ label, options, value, onPick, columns = 2 }: { label: string; options: string[]; value: string; onPick: (value: string) => void; columns?: 1 | 2 }) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-bold text-edmeca-grey">{label}</legend>
      <div className={`mt-2 grid gap-2 ${columns === 2 ? "grid-cols-2" : ""}`}>
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onPick(option)} className={`rounded-lg border p-3 text-left text-xs transition ${value === option ? "border-edmeca-green bg-edmeca-green text-white" : "border-edmeca-green-soft bg-white text-edmeca-grey hover:border-edmeca-purple"}`}>{option}</button>
        ))}
      </div>
    </fieldset>
  );
}

export function ProfileCard({ mode, profile, onChange, onContinue }: Props) {
  const complete = profile.sizeOrRole && profile.sector && profile.programmeStatus;
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-edmeca-purple">Nearly there</p>
      <h2 className="mt-3 text-2xl font-bold text-edmeca-purple">Three quick details so your report fits</h2>
      <Choice label={mode === "business" ? "Business size" : "Your role"} options={mode === "business" ? businessSizes : roles} value={profile.sizeOrRole} onPick={(sizeOrRole) => onChange({ ...profile, sizeOrRole })} />
      <Choice label="Sector" options={sectors} value={profile.sector} onPick={(sector) => onChange({ ...profile, sector })} />
      <Choice label="Development support" options={programmeStatuses} value={profile.programmeStatus} onPick={(programmeStatus) => onChange({ ...profile, programmeStatus })} columns={1} />
      <Button disabled={!complete} onClick={onContinue} className="mt-6 bg-edmeca-purple text-white hover:bg-edmeca-purple/90">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </section>
  );
}
