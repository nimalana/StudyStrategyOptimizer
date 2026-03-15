"use client";
import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MethodEffectiveness {
  subject: string;
  study_method: string;
  avg_score: number;
  avg_confidence: number;
  total_sessions: number;
  avg_duration: number;
}

interface OptimalLength {
  optimal_range: string;
  avg_score: number;
  buckets: { duration_bucket: string; avg_score: number; count: number }[];
}

interface Recommendation {
  type: string;
  subject: string;
  recommendation: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export default function Analytics() {
  const [effectiveness, setEffectiveness] = useState<MethodEffectiveness[]>([]);
  const [optimal, setOptimal] = useState<OptimalLength | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJSON<MethodEffectiveness[]>("/analytics/method-effectiveness"),
      fetchJSON<OptimalLength>("/analytics/optimal-session-length"),
      fetchJSON<Recommendation[]>("/analytics/recommendations"),
    ])
      .then(([e, o, r]) => {
        setEffectiveness(e);
        setOptimal(Object.keys(o).length ? o : null);
        setRecs(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const priorityColor = (p: string) =>
    p === "high" ? "bg-red-100 text-red-700 border-red-200" : p === "medium" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200";

  const isEmpty = effectiveness.length === 0 && !optimal;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Insights from your study sessions and scores.</p>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && isEmpty && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <p className="text-indigo-700 font-medium">Not enough data yet.</p>
          <p className="text-indigo-500 text-sm mt-1">Log study sessions and performance scores to see analytics here.</p>
        </div>
      )}

      {/* Method effectiveness bar chart */}
      {effectiveness.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Study Method vs Avg Score by Subject</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={effectiveness} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="study_method" tickFormatter={(v: string) => v.replace(/_/g, " ")} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Avg Score"]} labelFormatter={(l: string) => l.replace(/_/g, " ")} />
              <Legend />
              <Bar dataKey="avg_score" name="Avg Score (%)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_confidence" name="Avg Confidence (/5)" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Detail table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  {["Subject", "Method", "Avg Score", "Avg Confidence", "Sessions", "Avg Duration"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {effectiveness.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{row.subject}</td>
                    <td className="px-4 py-2 text-gray-600 capitalize">{row.study_method.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2 text-gray-600">{row.avg_score}%</td>
                    <td className="px-4 py-2 text-gray-600">{row.avg_confidence}/5</td>
                    <td className="px-4 py-2 text-gray-600">{row.total_sessions}</td>
                    <td className="px-4 py-2 text-gray-600">{row.avg_duration} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Optimal session length */}
      {optimal && optimal.buckets && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Optimal Session Length</h2>
          <p className="text-sm text-gray-500 mb-4">
            Best range: <span className="font-semibold text-indigo-700">{optimal.optimal_range}</span> — avg score {optimal.avg_score}%
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={optimal.buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="duration_bucket" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Avg Score"]} />
              <Bar dataKey="avg_score" name="Avg Score (%)" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 text-lg">Personalized Recommendations</h2>
          {recs.map((r, i) => (
            <div key={i} className={`rounded-xl border p-4 flex gap-4 items-start ${priorityColor(r.priority)}`}>
              <span className="text-xs font-bold uppercase mt-0.5 bg-white/60 px-2 py-0.5 rounded-full">
                {r.priority}
              </span>
              <div>
                <p className="font-semibold">{r.recommendation}</p>
                <p className="text-sm mt-0.5 opacity-80">{r.reason}</p>
                <p className="text-xs mt-1 opacity-60">Subject: {r.subject}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
