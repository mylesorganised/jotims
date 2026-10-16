import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { MorseTool } from "@/components/tools/morse";
import { PhoneticTool } from "@/components/tools/phonetic";
import { SemaphoreTool } from "@/components/tools/semaphore";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Code toolbox" };

const SHEETS = [
  { label: "Beavers Communicator", file: "beavers-communicator.pdf" },
  { label: "Cubs Communicator", file: "cubs-communicator.pdf" },
  { label: "Scouts Communicator", file: "scouts-communicator.pdf" },
  { label: "JOTI Dance Party (Scratch picture guide)", file: "joti-dance-party.pdf" },
  { label: "Leaf identifier worksheet", file: "leaf-identifier.pdf" },
  { label: "micro:bit step tracker worksheet", file: "microbit-step-tracker.pdf" },
  { label: "Digital persuasion game cards", file: "digital-persuasion-cards.pdf" },
  { label: "Technology timeline cards", file: "technology-timeline-cards.pdf" },
];

export default function ToolboxPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Code toolbox 🧰" subtitle="Translators and charts for Morse code, the phonetic alphabet and semaphore." />
      <div className="grid gap-6">
        <MorseTool />
        <PhoneticTool />
        <SemaphoreTool />
      </div>
      <section>
        <h2 className="mb-3 text-xl font-extrabold">Printable sheets</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {SHEETS.map((s) => (
            <a
              key={s.file}
              href={`/resources/${s.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-line transition hover:ring-brand-300"
            >
              <FileText className="size-5 text-brand-500" />
              <span className="font-bold">{s.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
