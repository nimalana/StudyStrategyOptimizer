"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";

const METHODS = [
  { value: "practice_problems", label: "Practice Problems" },
  { value: "flashcards", label: "Flashcards" },
  { value: "notes", label: "Notes / Writing" },
  { value: "reading", label: "Reading / Rereading" },
  { value: "video", label: "Video Lectures" },
  { value: "group_study", label: "Group Study" },
];

const SCALE = [1, 2, 3, 4, 5];

export default function LogSession() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    study_method: "practice_problems",
    duration_minutes: 45,
    difficulty: 3,
    confidence_after: 3,
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) {
      setError("Subject and topic are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await postJSON("/sessions/", form);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Log Study Session</h1>
      <p className="text-gray-500 mb-6">Record what you studied and how it went.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">{error}</p>}

        <Field label="Subject">
          <input
            className="input"
            placeholder="e.g. Calculus, Biology"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </Field>

        <Field label="Topic">
          <input
            className="input"
            placeholder="e.g. Integration by Parts"
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
          />
        </Field>

        <Field label="Study Method">
          <select className="input" value={form.study_method} onChange={(e) => set("study_method", e.target.value)}>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>

        <Field label={`Duration: ${form.duration_minutes} min`}>
          <input
            type="range"
            min={5}
            max={240}
            step={5}
            value={form.duration_minutes}
            onChange={(e) => set("duration_minutes", +e.target.value)}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 min</span><span>240 min</span>
          </div>
        </Field>

        <Field label="Difficulty (1 = very easy, 5 = very hard)">
          <ScaleSelector value={form.difficulty} onChange={(v) => set("difficulty", v)} />
        </Field>

        <Field label="Confidence after studying (1 = low, 5 = high)">
          <ScaleSelector value={form.confidence_after} onChange={(v) => set("confidence_after", v)} />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            className="input resize-none h-20"
            placeholder="Any observations…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Session"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function ScaleSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
            value === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
