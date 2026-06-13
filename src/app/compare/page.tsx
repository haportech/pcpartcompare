"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";

type Part = {
  id: string;
  type: string;
  brand: string;
  model: string;
  specs: string;
  prices: { retailer: string; amount: number; fetchedAt: string }[];
  benchmarks: { benchmark: string; score: number; unit: string }[];
};

type SpecField = {
  key: string;
  label: string;
  direction: "higher" | "lower" | "neutral";
};

const CPU_SPECS: SpecField[] = [
  { key: "cores", label: "Cores", direction: "higher" },
  { key: "threads", label: "Threads", direction: "higher" },
  { key: "baseClock", label: "Base Clock", direction: "neutral" },
  { key: "boostClock", label: "Boost Clock", direction: "higher" },
  { key: "tdp", label: "TDP", direction: "lower" },
  { key: "socket", label: "Socket", direction: "neutral" },
  { key: "cache", label: "Cache", direction: "higher" },
  { key: "lithography", label: "Lithography", direction: "neutral" },
];

const GPU_SPECS: SpecField[] = [
  { key: "vram", label: "VRAM", direction: "higher" },
  { key: "cudaCores", label: "CUDA Cores", direction: "higher" },
  { key: "boostClock", label: "Boost Clock", direction: "higher" },
  { key: "tdp", label: "TDP", direction: "lower" },
  { key: "memoryBus", label: "Memory Bus", direction: "higher" },
  { key: "memoryBandwidth", label: "Memory Bandwidth", direction: "higher" },
];

const BENCHMARK_LABELS: Record<string, string> = {
  cinebench_r23_mt: "Cinebench R23 (Multi)",
  geekbench6_single: "Geekbench 6 (Single)",
  "3dmark_time_spy": "3DMark Time Spy",
  cyberpunk_2077_1440p: "Cyberpunk 2077 (1440p)",
};

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/parts")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setParts(data.parts);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const selectedIds = useMemo(() => {
    const raw = searchParams.get("parts");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const selectedParts = useMemo(
    () => parts.filter((p) => selectedIds.includes(p.id)),
    [parts, selectedIds]
  );

  const filteredParts = useMemo(
    () =>
      parts.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          !q ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
        );
      }),
    [parts, searchQuery]
  );

  // Show only same-type parts for selection
  const partType = selectedParts.length > 0 ? selectedParts[0].type : null;
  const selectableParts = partType
    ? filteredParts.filter((p) => p.type === partType && !selectedIds.includes(p.id))
    : filteredParts.filter((p) => !selectedIds.includes(p.id));

  function togglePart(id: string) {
    const ids = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id].slice(0, 4);
    router.push(`/compare${ids.length ? `?parts=${ids.join(",")}` : ""}`, {
      scroll: false,
    });
  }

  function getSpecs(p: Part): Record<string, string> {
    try {
      return JSON.parse(p.specs);
    } catch {
      return {};
    }
  }

  function getSpecFields(type: string): SpecField[] {
    return type === "CPU" ? CPU_SPECS : GPU_SPECS;
  }

  function colorClass(
    values: (string | undefined)[],
    direction: "higher" | "lower" | "neutral"
  ): string {
    if (direction === "neutral" || values.some((v) => v === undefined)) return "";
    const nums = values.map((v) => parseFloat(String(v).replace(/[^0-9.]/g, "")));
    if (nums.some(isNaN)) return "";
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max === min) return "";
    const best = direction === "higher" ? max : min;
    const worst = direction === "higher" ? min : max;
    return values
      .map((v) => {
        const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
        if (n === best) return "text-emerald-400";
        if (n === worst) return "text-red-400";
        return "text-zinc-300";
      })
      .join(",");
  }

  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-zinc-500">Loading parts...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-6 py-4 text-amber-400">
          Data may be stale. Could not connect to database.
        </div>
      </div>
    );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search parts by brand, model, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pl-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-600"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Part type chips */}
      {selectedParts.length === 0 && searchQuery && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSearchQuery("CPU")}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            CPUs only
          </button>
          <button
            onClick={() => setSearchQuery("GPU")}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            GPUs only
          </button>
        </div>
      )}

      {/* Selected parts */}
      {selectedParts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Comparing:</span>
          {selectedParts.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePart(p.id)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:border-red-600 hover:text-red-400"
            >
              {p.brand} {p.model}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <span className="text-xs text-zinc-600">{selectedParts.length}/4</span>
        </div>
      )}

      {/* Available parts list */}
      {selectableParts.length > 0 && selectedParts.length < 4 && (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {selectableParts.slice(0, 20).map((p) => (
            <button
              key={p.id}
              onClick={() => togglePart(p.id)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
            >
              <div className="font-medium text-zinc-200">{p.brand}</div>
              <div className="text-zinc-400">{p.model}</div>
            </button>
          ))}
        </div>
      )}

      {searchQuery && selectableParts.length === 0 && (
        <div className="mb-8 rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-500">
          No parts match &quot;{searchQuery}&quot;. Try a different search term.
        </div>
      )}

      {/* Comparison Table */}
      {selectedParts.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-4xl">🔍</div>
            <div className="text-lg font-medium text-zinc-400">Select parts to compare</div>
            <div className="mt-1 text-sm text-zinc-600">
              Search and select up to 4 parts of the same type
            </div>
          </div>
        </div>
      )}

      {selectedParts.length >= 1 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="w-40 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Spec
                </th>
                {selectedParts.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-zinc-200"
                  >
                    {p.brand}
                    <div className="text-xs font-normal text-zinc-500">{p.model}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price row */}
              <tr className="border-b border-zinc-800">
                <td className="px-4 py-3 text-xs font-medium text-zinc-400">Price</td>
                {selectedParts.map((p) => {
                  const price = p.prices?.[0];
                  return (
                    <td key={p.id} className="px-4 py-3 text-sm text-zinc-200">
                      {price ? (
                        <span className="font-medium text-emerald-400">
                          ${price.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-zinc-600">No data</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Spec rows */}
              {getSpecFields(selectedParts[0].type).map((field) => {
                const values = selectedParts.map((p) => {
                  const specs = getSpecs(p);
                  return specs[field.key];
                });
                const colors = colorClass(values, field.direction).split(",");

                return (
                  <tr key={field.key} className="border-b border-zinc-800/50">
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{field.label}</td>
                    {selectedParts.map((p, i) => (
                      <td
                        key={p.id}
                        className={`px-4 py-2.5 text-sm ${
                          colors[i] || "text-zinc-300"
                        }`}
                      >
                        {values[i] || "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Benchmark rows */}
              {selectedParts.length >= 2 && (
                <>
                  <tr className="border-b border-zinc-700">
                    <td
                      colSpan={selectedParts.length + 1}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      Benchmarks
                    </td>
                  </tr>
                  {Object.keys(BENCHMARK_LABELS).map((benchKey) => {
                    const values = selectedParts.map((p) =>
                      p.benchmarks.find((b) => b.benchmark === benchKey)
                    );
                    const hasAny = values.some((v) => v !== undefined);
                    if (!hasAny) return null;
                    const scores = values.map((v) => v?.score ?? 0);
                    const maxScore = Math.max(...scores);
                    const minScore = Math.min(...scores);

                    return (
                      <tr key={benchKey} className="border-b border-zinc-800/50">
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          {BENCHMARK_LABELS[benchKey]}
                        </td>
                        {values.map((v, i) => {
                          const isBest = v?.score === maxScore && maxScore > 0;
                          const isWorst = v?.score === minScore && minScore < maxScore;
                          return (
                            <td
                              key={i}
                              className={`px-4 py-2.5 text-sm ${
                                v
                                  ? isBest
                                    ? "text-emerald-400"
                                    : isWorst
                                      ? "text-red-400"
                                      : "text-zinc-300"
                                  : "text-zinc-600"
                              }`}
                            >
                              {v ? `${v.score.toLocaleString()} ${v.unit}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>

          {/* Mobile card view */}
          <div className="mt-6 block md:hidden">
            <div className="space-y-4">
              {selectedParts.map((p) => {
                const specs = getSpecs(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="mb-2 font-semibold text-zinc-200">
                      {p.brand} {p.model}
                    </div>
                    <div className="space-y-1 text-xs text-zinc-400">
                      {getSpecFields(p.type).map((field) => (
                        <div key={field.key} className="flex justify-between">
                          <span>{field.label}</span>
                          <span className="text-zinc-300">
                            {specs[field.key] || "—"}
                          </span>
                        </div>
                      ))}
                      {p.benchmarks.map((b) => (
                        <div key={b.benchmark} className="flex justify-between">
                          <span>{BENCHMARK_LABELS[b.benchmark] || b.benchmark}</span>
                          <span className="text-zinc-300">
                            {b.score.toLocaleString()} {b.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-zinc-700">
        {parts.length} parts loaded
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-zinc-500">
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
