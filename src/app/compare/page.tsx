"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback } from "react";

type Part = {
  id: string;
  type: string;
  brand: string;
  model: string;
  specs: string;
  prices: { retailer: string; amount: number; fetchedAt: string }[];
  benchmarks: { benchmark: string; score: number; unit: string }[];
};

type PartType = string;

const BENCHMARK_LABELS: Record<string, string> = {
  cinebench_r23_mt: "Cinebench R23 (Multi)",
  geekbench6_single: "Geekbench 6 (Single)",
  "3dmark_time_spy": "3DMark Time Spy",
  cyberpunk_2077_1440p: "Cyberpunk 2077 (1440p)",
};

const CPU_SPECS = ["cores", "threads", "baseClock", "boostClock", "tdp", "socket", "cache", "lithography"];
const GPU_SPECS = ["vram", "cudaCores", "boostClock", "tdp", "memoryBus", "memoryBandwidth"];

const SPEC_LABELS: Record<string, string> = {
  cores: "Cores",
  threads: "Threads",
  baseClock: "Base Clock",
  boostClock: "Boost Clock",
  tdp: "TDP",
  socket: "Socket",
  cache: "Cache",
  lithography: "Lithography",
  vram: "VRAM",
  cudaCores: "CUDA Cores",
  memoryBus: "Memory Bus",
  memoryBandwidth: "Memory Bandwidth",
  // Dataset fields
  core_count: "Cores",
  core_clock: "Core Clock",
  microarchitecture: "Architecture",
  graphics: "Integrated Graphics",
  chipset: "Chipset",
  memory: "Memory (GB)",
  speed: "Speed",
  modules: "Modules",
  price_per_gb: "Price/GB",
  first_word_latency: "First Word Latency",
  cas_latency: "CAS Latency",
  capacity: "Capacity",
  type: "Type",
  form_factor: "Form Factor",
  interface: "Interface",
  wattage: "Wattage",
  efficiency: "Efficiency",
  modular: "Modular",
  color: "Color",
  length: "Length",
};

const DIRECTIONS: Record<string, "higher" | "lower" | "neutral"> = {
  cores: "higher",
  threads: "higher",
  boostClock: "higher",
  core_clock: "higher",
  speed: "higher",
  wattage: "lower",
  tdp: "lower",
  memory: "higher",
  core_count: "higher",
  capacity: "higher",
};

function getDirection(key: string): "higher" | "lower" | "neutral" {
  return DIRECTIONS[key] || "neutral";
}

function getSpecFields(type: string): string[] {
  const t = type.toLowerCase();
  if (t === "cpu") return CPU_SPECS;
  if (t === "gpu") return GPU_SPECS;
  // For other types, extract from the data
  return [];
}

function matchDatasetFields(datasetKeys: string[], knownFields: string[]): string[] {
  const fieldMap: Record<string, string> = {
    core_clock: "baseClock",
    boost_clock: "boostClock",
    core_count: "cores",
  };
  return knownFields.length
    ? knownFields
    : datasetKeys.filter((k) => SPEC_LABELS[k] && k !== "price" && k !== "name");
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [partTypes, setPartTypes] = useState<PartType[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedIds = useMemo(() => {
    const raw = searchParams.get("parts");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const selectedParts = useMemo(
    () => parts.filter((p) => selectedIds.includes(p.id)),
    [parts, selectedIds]
  );

  // Fetch types on mount
  useEffect(() => {
    fetch("/api/parts?limit=1")
      .then((r) => r.json())
      .then((data) => {
        setPartTypes(data.types || []);
      })
      .catch(() => {});
  }, []);

  // Fetch parts on search/page/type change
  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (searchQuery) params.set("search", searchQuery);
    if (selectedType) params.set("type", selectedType);

    try {
      const r = await fetch(`/api/parts?${params}`);
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      setParts(data.parts);
      setTotal(data.total);
      setHasSearched(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedType]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

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

  // Check if selected parts are all the same type
  const partType = selectedParts.length > 0 ? selectedParts[0].type : null;
  const validComparison =
    partType && selectedParts.every((p) => p.type === partType);

  const totalPages = Math.ceil(total / 50);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100 sm:text-xl">
          Compare PC Parts
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total.toLocaleString()} parts across {partTypes.length} categories
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search parts by brand, model..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pl-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-600"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none transition-colors focus:border-zinc-600"
          >
            <option value="">All categories</option>
            {partTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected parts chips */}
      {selectedParts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Comparing:</span>
          {selectedParts.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePart(p.id)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-red-600 hover:text-red-400"
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

      {/* Main content */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-zinc-500">Searching {total.toLocaleString()} parts...</div>
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-6 py-4 text-sm text-amber-400">
            Failed to load parts. Check your connection.
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-1 flex-col gap-6">
          {/* Parts grid (when selecting) */}
          {selectedParts.length < 4 && parts.length > 0 && (
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  {total > 50 ? `Showing ${page}-${Math.min(page * 50, total)} of ${total.toLocaleString()}` : `${parts.length} results`}
                </span>
                {partType && selectedParts.length < 4 && (
                  <span className="text-xs text-zinc-600">
                    Selected type: {partType}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {parts
                  .filter((p) => !selectedIds.includes(p.id))
                  .filter((p) => !partType || p.type === partType)
                  .map((p) => {
                    const price = p.prices?.[0];
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePart(p.id)}
                        className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-left text-xs transition-all hover:border-zinc-600 hover:bg-zinc-800/50"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium text-zinc-200">
                            {p.brand}
                          </span>
                          <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                            {p.type}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-zinc-400">{p.model}</div>
                        {price && (
                          <div className="mt-1.5 font-medium text-emerald-400">
                            ${price.amount.toLocaleString()}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-zinc-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && hasSearched && parts.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mb-1 text-2xl">🔍</div>
                <div className="text-sm text-zinc-500">
                  No parts match &quot;{searchQuery}&quot;
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasSearched && selectedParts.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-4xl">🔍</div>
                <div className="text-sm font-medium text-zinc-400">
                  Search {total.toLocaleString()} parts to compare
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  Select up to 4 parts of the same type
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {validComparison && selectedParts.length >= 2 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="w-44 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Spec
                </th>
                {selectedParts.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left text-sm font-semibold text-zinc-200">
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
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Dynamic spec rows from specs JSON */}
              {(() => {
                const specsList = selectedParts.map((p) => getSpecs(p));
                const allKeys = [...new Set(specsList.flatMap((s) => Object.keys(s)))];
                const preferredKeys = getSpecFields(selectedParts[0].type);
                const displayKeys = preferredKeys.filter((k) => allKeys.includes(k));
                const extraKeys = allKeys.filter(
                  (k) => !displayKeys.includes(k) && SPEC_LABELS[k]
                );

                const keys = [...displayKeys, ...extraKeys.slice(0, 10)];

                return keys.map((key) => {
                  const values = specsList.map((s) => s[key]);
                  const direction = getDirection(key);
                  const nums = values.map(
                    (v) => parseFloat(String(v).replace(/[^0-9.]/g, ""))
                  );
                  const hasNums = nums.every((n) => !isNaN(n));
                  const max = hasNums ? Math.max(...nums) : null;
                  const min = hasNums ? Math.min(...nums) : null;

                  return (
                    <tr key={key} className="border-b border-zinc-800/50">
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {SPEC_LABELS[key] || key}
                      </td>
                      {values.map((v, i) => {
                        const n = parseFloat(String(v || "0").replace(/[^0-9.]/g, ""));
                        const isNum = !isNaN(n);
                        let color = "text-zinc-300";
                        if (isNum && max && min && max !== min) {
                          if (direction === "higher" && n === max) color = "text-emerald-400";
                          else if (direction === "higher" && n === min) color = "text-red-400";
                          else if (direction === "lower" && n === min) color = "text-emerald-400";
                          else if (direction === "lower" && n === max) color = "text-red-400";
                        }
                        return (
                          <td key={i} className={`px-4 py-2.5 text-sm ${color}`}>
                            {v || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}

              {/* Benchmarks */}
              {selectedParts.length >= 2 && (
                <>
                  <tr className="border-b border-zinc-700">
                    <td colSpan={selectedParts.length + 1}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
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

                    return (
                      <tr key={benchKey} className="border-b border-zinc-800/50">
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          {BENCHMARK_LABELS[benchKey]}
                        </td>
                        {values.map((v, i) => {
                          const isBest = v?.score === maxScore && maxScore > 0;
                          return (
                            <td key={i}
                              className={`px-4 py-2.5 text-sm ${
                                v ? (isBest ? "text-emerald-400" : "text-zinc-300") : "text-zinc-600"
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

          {/* Mobile cards */}
          <div className="mt-6 block md:hidden">
            <div className="space-y-4">
              {selectedParts.map((p) => {
                const specs = getSpecs(p);
                return (
                  <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="mb-2 font-semibold text-zinc-200">
                      {p.brand} {p.model}
                    </div>
                    <div className="space-y-1 text-xs text-zinc-400">
                      {Object.entries(specs).slice(0, 10).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span>{SPEC_LABELS[k] || k}</span>
                          <span className="text-zinc-300">{v}</span>
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

      {/* Wrong type warning */}
      {selectedParts.length >= 2 && !validComparison && (
        <div className="mt-4 rounded-lg border border-amber-800 bg-amber-900/20 px-4 py-3 text-sm text-amber-400">
          Parts must be the same type to compare. Clear selection and choose parts from one category.
        </div>
      )}
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={<div className="flex flex-1 items-center justify-center text-zinc-500">Loading...</div>}
    >
      <CompareContent />
    </Suspense>
  );
}
