"use client";
import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/api";
import Link from "next/link";

interface SubjectSummary {
  subject: string;
  total_sessions: number;
  total_study_time: number;
  avg_session_length: number;
  avg_confidence: number;
  top_method: string;
  avg_score?: number;
  total_assessments?: number;
}

interface Recommendation {
  type: string;
  subject: string;
  recommendation: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SubjectSummary[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJSON<SubjectSummary[]>("/analytics/subject-summary"),
      fetchJSON<Recommendation[]>("/analytics/recommendations"),
    ])
      .then(([s, r]) => {
        setSummary(s);
        setRecs(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSessions = summary.reduce((a, s) => a + s.total_sessions, 0);
  const totalMinutes = summary.reduce((a, s) => a + s.total_study_time, 0);
  const avgScore =
    summary.filter((s) => s.avg_score != null).reduce((a, s) => a + (s.avg_score ?? 0), 0) /
      (summary.filter((s) => s.avg_score != null).length || 1);

  const priorityColor = (p: string) =>
    p === "high" ? "bg-red-100 text-red-700" : p === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your study habits and see what works best for you.</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Sessions" value={totalSessions} />
            <StatCard label="Total Study Time" value={`${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`} />
            <StatCard
              label="Avg Score"
              value={summary.some((s) => s.avg_score != null) ? `${avgScore.toFixed(1)}%` : "—"}
            />
          </div>

          {/* Quick links */}
          {totalSessions === 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
              <p className="text-indigo-700 font-medium mb-3">No data yet — start logging your study sessions!</p>
              <div className="flex gap-3 justify-center">
                <Link href="/log-session" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Log a Session
                </Link>
                <Link href="/log-performance" className="bg-white text-indigo-600 border border-indigo-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50">
                  Log a Score
                </Link>
              </div>
            </div>
          )}

          {/* Subject table */}
          {summary.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-800">Subjects Overview</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      {["Subject", "Sessions", "Study Time", "Top Method", "Avg Confidence", "Avg Score"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.map((row) => (
                      <tr key={row.subject} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.subject}</td>
                        <td className="px-4 py-3 text-gray-600">{row.total_sessions}</td>
                        <td className="px-4 py-3 text-gray-600">{row.total_study_time} min</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{row.top_method.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-gray-600">{row.avg_confidence}/5</td>
                        <td className="px-4 py-3 text-gray-600">{row.avg_score != null ? `${row.avg_score}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-800 text-lg">Recommendations</h2>
              {recs.map((r, i) => (
                <div key={i} className="bg-white rounded-xl border shadow-sm p-4 flex gap-4 items-start">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-0.5 ${priorityColor(r.priority)}`}>
                    {r.priority}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{r.recommendation}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
