"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";

const ASSESSMENT_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "practice_test", label: "Practice Test" },
];

export default function LogPerformance() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    assessment_type: "quiz",
    score: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }
    const score = parseFloat(form.score);
    if (isNaN(score) || score < 0 || score > 100) {
      setError("Score must be a number between 0 and 100.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await postJSON("/performance/", { ...form, score });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Log Performance</h1>
      <p className="text-gray-500 mb-6">Record a quiz, exam, or assignment score.</p>

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

        <Field label="Topic (optional)">
          <input
            className="input"
            placeholder="e.g. Chapter 4 – Derivatives"
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
          />
        </Field>

        <Field label="Assessment Type">
          <select className="input" value={form.assessment_type} onChange={(e) => set("assessment_type", e.target.value)}>
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Score (%)">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="input"
            placeholder="e.g. 85"
            value={form.score}
            onChange={(e) => set("score", e.target.value)}
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            className="input resize-none h-20"
            placeholder="Topics that were tricky, areas to review…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Score"}
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
