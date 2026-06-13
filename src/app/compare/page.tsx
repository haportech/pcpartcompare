"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback, useRef } from "react";

type Part = {
  id: string;
  type: string;
  brand: string;
  model: string;
  specs: string;
  prices: { retailer: string; amount: number; fetchedAt: string }[];
  benchmarks: { benchmark: string; score: number; unit: string }[];
};

const BENCHMARK_LABELS: Record<string, string> = {
  cinebench_r23_mt: "Cinebench R23 (Multi)",
  geekbench6_single: "Geekbench 6 (Single)",
  "3dmark_time_spy": "3DMark Time Spy",
  cyberpunk_2077_1440p: "Cyberpunk 2077 (1440p)",
};

const CPU_KEYS = ["cores", "threads", "baseClock", "boostClock", "tdp", "socket", "cache", "lithography"];
const GPU_KEYS = ["vram", "cudaCores", "boostClock", "tdp", "memoryBus", "memoryBandwidth"];

const SPEC_LABELS: Record<string, string> = {
  cores: "Cores", threads: "Threads", baseClock: "Base Clock", boostClock: "Boost Clock",
  tdp: "TDP", socket: "Socket", cache: "Cache", lithography: "Lithography",
  vram: "VRAM", cudaCores: "CUDA Cores", memoryBus: "Memory Bus", memoryBandwidth: "Memory Bandwidth",
  core_count: "Cores", core_clock: "Core Clock", microarchitecture: "Architecture",
  graphics: "iGPU", chipset: "Chipset", memory: "VRAM (GB)", speed: "Speed",
  modules: "Modules", price_per_gb: "Price/GB", first_word_latency: "FWL",
  cas_latency: "CAS", capacity: "Capacity", type: "Type", form_factor: "Form Factor",
  interface: "Interface", wattage: "Wattage", efficiency: "Efficiency",
  modular: "Modular", color: "Color", length: "Length",
};

const DIRECTIONS: Record<string, "higher" | "lower" | "neutral"> = {
  cores: "higher", threads: "higher", boostClock: "higher", core_clock: "higher",
  speed: "higher", wattage: "lower", tdp: "lower", memory: "higher",
  core_count: "higher", capacity: "higher",
};

function getSpecs(p: Part): Record<string, string> {
  try { return JSON.parse(p.specs); } catch { return {}; }
}

// Skeleton loader component
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg`}
      style={{ backgroundColor: "#1E293B" }}
      {...{ className: undefined } as any}
    >
      <div className={`${className}`} />
    </div>
  );
}

// Search icon
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  );
}

// Close/X icon
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}

// Chevron icons
function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

// Chip icon (comparison)
function CpuIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3"/>
    </svg>
  );
}

// Empty box icon
function BoxIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);

  const [partTypes, setPartTypes] = useState<string[]>([]);
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

  // Entrance animation
  useEffect(() => { setLoaded(true); }, []);

  // Fetch types
  useEffect(() => {
    fetch("/api/parts?limit=1")
      .then((r) => r.json())
      .then((d) => { setPartTypes(d.types || []); })
      .catch(() => {});
  }, []);

  const fetchParts = useCallback(async () => {
    setLoading(true); setError(false);
    const params = new URLSearchParams({ page: String(page), limit: "48" });
    if (searchQuery) params.set("search", searchQuery);
    if (selectedType) params.set("type", selectedType);
    if (selectedIds.length && !searchQuery && !selectedType) {
      params.set("ids", selectedIds.join(","));
      params.delete("page");
    }
    try {
      const r = await fetch(`/api/parts?${params}`);
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setParts(d.parts); setTotal(d.total); setHasSearched(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [page, searchQuery, selectedType, selectedIds.join(",")]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  function togglePart(id: string) {
    const ids = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id].slice(0, 4);
    router.push(`/compare${ids.length ? `?parts=${ids.join(",")}` : ""}`, { scroll: false });
  }

  const partType = selectedParts.length > 0 ? selectedParts[0].type : null;
  const validComparison = partType && selectedParts.every((p) => p.type === partType);
  const totalPages = Math.ceil(total / 48);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col"
      style={{ padding: "24px 16px", transition: "opacity 300ms", opacity: loaded ? 1 : 0 }}
    >
      {/* Header section */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-exo)", color: "#F8FAFC" }}>
          Compare <span style={{ color: "#22C55E" }}>PC Parts</span>
        </h1>
        <p style={{ marginTop: "4px", fontSize: "13px", color: "#64748B", fontFamily: "var(--font-roboto-mono)" }}>
          {total.toLocaleString()} parts across {partTypes.length} categories &middot; select up to 4 to compare
        </p>
      </div>

      {/* Search + Filter bar */}
      <div style={{ marginBottom: "20px" }}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by brand, model..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full outline-none transition-all duration-200"
              style={{
                width: "100%",
                padding: "14px 14px 14px 42px",
                borderRadius: "12px",
                border: "1px solid #1E293B",
                backgroundColor: "#0F172A",
                color: "#F8FAFC",
                fontSize: "14px",
                fontFamily: "var(--font-roboto-mono)",
                outline: "none",
                transition: "border-color 200ms",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#22C55E")}
              onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #1E293B",
              backgroundColor: "#0F172A",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: "var(--font-roboto-mono)",
              outline: "none",
              cursor: "pointer",
              minWidth: "160px",
              transition: "border-color 200ms",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#22C55E")}
            onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
          >
            <option value="">All categories</option>
            {partTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Selected parts chips — bento header */}
      {selectedParts.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px",
          marginBottom: "16px", padding: "12px 16px",
          borderRadius: "12px", border: "1px solid #1E293B",
          backgroundColor: "rgba(30,41,59,0.4)",
          transition: "all 300ms",
        }}>
          <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "var(--font-roboto-mono)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Comparing
          </span>
          {selectedParts.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePart(p.id)}
              className="group"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "8px",
                border: "1px solid #22C55E", backgroundColor: "rgba(34,197,94,0.08)",
                color: "#F8FAFC", fontSize: "12px", cursor: "pointer",
                fontFamily: "var(--font-roboto-mono)",
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#22C55E"; e.currentTarget.style.color = "#F8FAFC"; }}
            >
              <CpuIcon />
              {p.brand} {p.model}
              <CloseIcon />
            </button>
          ))}
          <span style={{ fontSize: "11px", color: "#475569", fontFamily: "var(--font-roboto-mono)" }}>
            {selectedParts.length}/4
          </span>
        </div>
      )}

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              padding: "16px", borderRadius: "12px",
              border: "1px solid #1E293B", backgroundColor: "rgba(30,41,59,0.3)",
            }}>
              <div className="animate-pulse" style={{ height: "12px", width: "60%", backgroundColor: "#1E293B", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="animate-pulse" style={{ height: "10px", width: "80%", backgroundColor: "#1E293B", borderRadius: "4px", marginBottom: "12px" }} />
              <div className="animate-pulse" style={{ height: "10px", width: "40%", backgroundColor: "#1E293B", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          display: "flex", flex: 1, alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            padding: "16px 24px", borderRadius: "12px",
            border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)",
            color: "#EF4444", fontSize: "13px", fontFamily: "var(--font-roboto-mono)",
          }}>
            Connection error — could not load parts
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Parts grid — bento layout */}
          {selectedParts.length < 4 && parts.length > 0 && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "10px",
              }}>
                <span style={{ fontSize: "11px", color: "#475569", fontFamily: "var(--font-roboto-mono)" }}>
                  {total > 48
                    ? `${(page - 1) * 48 + 1}–${Math.min(page * 48, total)} of ${total.toLocaleString()}`
                    : `${parts.length} results`
                  }
                </span>
                {partType && (
                  <span style={{ fontSize: "11px", color: "#22C55E", fontFamily: "var(--font-roboto-mono)" }}>
                    {partType} only
                  </span>
                )}
              </div>

              {/* Bento grid — 2 cols mobile, 3 tablet, 4 desktop, 5 wide */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {parts
                  .filter((p) => !selectedIds.includes(p.id))
                  .filter((p) => !partType || p.type === partType)
                  .map((p, idx) => {
                    const price = p.prices?.[0];
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePart(p.id)}
                        style={{
                          padding: "14px", borderRadius: "12px",
                          border: "1px solid #1E293B",
                          backgroundColor: "rgba(30,41,59,0.3)",
                          cursor: "pointer", textAlign: "left",
                          fontSize: "12px", fontFamily: "var(--font-roboto-mono)",
                          transition: "all 200ms",
                          animation: loaded ? `fadeIn 300ms ${idx * 20}ms both` : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#334155";
                          e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.6)";
                          e.currentTarget.style.boxShadow = "0 0 20px rgba(34,197,94,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#1E293B";
                          e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.3)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 500, color: "#F8FAFC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.brand}
                          </span>
                          <span style={{
                            flexShrink: 0, padding: "2px 6px", borderRadius: "4px",
                            backgroundColor: "#1E293B", fontSize: "9px",
                            color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase",
                          }}>
                            {p.type}
                          </span>
                        </div>
                        <div style={{ color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: price ? "8px" : 0 }}>
                          {p.model}
                        </div>
                        {price && (
                          <div style={{ fontWeight: 500, color: "#22C55E" }}>
                            ${price.amount.toLocaleString()}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  marginTop: "20px",
                }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "8px 14px", borderRadius: "8px",
                      border: "1px solid #1E293B", backgroundColor: "transparent",
                      color: page === 1 ? "#1E293B" : "#64748B", fontSize: "12px",
                      cursor: page === 1 ? "default" : "pointer",
                      fontFamily: "var(--font-roboto-mono)", transition: "all 200ms",
                    }}
                    onMouseEnter={(e) => { if (page !== 1) { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#F8FAFC"; }}}
                    onMouseLeave={(e) => { if (page !== 1) { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; }}}
                  >
                    <ChevronLeft /> Prev
                  </button>
                  <span style={{ fontSize: "12px", color: "#475569", fontFamily: "var(--font-roboto-mono)" }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "8px 14px", borderRadius: "8px",
                      border: "1px solid #1E293B", backgroundColor: "transparent",
                      color: page === totalPages ? "#1E293B" : "#64748B", fontSize: "12px",
                      cursor: page === totalPages ? "default" : "pointer",
                      fontFamily: "var(--font-roboto-mono)", transition: "all 200ms",
                    }}
                    onMouseEnter={(e) => { if (page !== totalPages) { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#F8FAFC"; }}}
                    onMouseLeave={(e) => { if (page !== totalPages) { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; }}}
                  >
                    Next <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {hasSearched && parts.length === 0 && !loading && (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <BoxIcon />
                <div style={{ marginTop: "12px", fontFamily: "var(--font-exo)", color: "#64748B" }}>
                  No parts match &ldquo;{searchQuery}&rdquo;
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasSearched && selectedParts.length === 0 && (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", animation: loaded ? "fadeIn 500ms both" : "none" }}>
                <BoxIcon />
                <div style={{ marginTop: "12px", fontFamily: "var(--font-exo)", color: "#94A3B8", fontSize: "15px" }}>
                  Search <span style={{ color: "#22C55E" }}>{total.toLocaleString()}</span> parts
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#475569", fontFamily: "var(--font-roboto-mono)" }}>
                  Select up to 4 of the same type to compare
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ——— COMPARISON TABLE ——— */}
      {validComparison && selectedParts.length >= 2 && (
        <div className="overflow-x-auto" style={{
          marginTop: "24px",
          animation: loaded ? "fadeIn 400ms both" : "none",
        }}>
          <div style={{
            borderRadius: "12px", border: "1px solid #1E293B",
            backgroundColor: "rgba(30,41,59,0.2)", overflow: "hidden",
          }}>
            <table style={{ width: "100%", minWidth: "500px", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  <th style={{
                    width: "160px", padding: "14px 16px", textAlign: "left",
                    fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em",
                    color: "#475569", fontFamily: "var(--font-roboto-mono)", textTransform: "uppercase",
                  }}>
                    Spec
                  </th>
                  {selectedParts.map((p) => (
                    <th key={p.id} style={{ padding: "14px 16px", textAlign: "left" }}>
                      <div style={{ fontFamily: "var(--font-exo)", fontWeight: 600, color: "#F8FAFC" }}>{p.brand}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px", fontFamily: "var(--font-roboto-mono)" }}>{p.model}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.6)" }}>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontSize: "11px", fontWeight: 500, fontFamily: "var(--font-roboto-mono)" }}>
                    Price
                  </td>
                  {selectedParts.map((p) => {
                    const price = p.prices?.[0];
                    return (
                      <td key={p.id} style={{ padding: "12px 16px", fontFamily: "var(--font-roboto-mono)" }}>
                        {price
                          ? <span style={{ fontWeight: 500, color: "#22C55E" }}>${price.amount.toLocaleString()}</span>
                          : <span style={{ color: "#475569" }}>—</span>
                        }
                      </td>
                    );
                  })}
                </tr>

                {/* Dynamic specs */}
                {(() => {
                  const specsList = selectedParts.map((p) => getSpecs(p));
                  const allKeys = [...new Set(specsList.flatMap((s) => Object.keys(s)))];
                  const t = selectedParts[0].type.toLowerCase();
                  const pref = t === "cpu" ? CPU_KEYS : t === "gpu" ? GPU_KEYS : [];
                  const displayKeys = pref.filter((k) => allKeys.includes(k));
                  const extra = allKeys.filter((k) => !displayKeys.includes(k) && SPEC_LABELS[k]);
                  const keys = [...displayKeys, ...extra.slice(0, 10)];

                  return keys.map((key) => {
                    const values = specsList.map((s) => s[key]);
                    const dir = DIRECTIONS[key] || "neutral";
                    const nums = values.map((v) => parseFloat(String(v).replace(/[^0-9.]/g, "")));
                    const hasNums = nums.every((n) => !isNaN(n));
                    const max = hasNums ? Math.max(...nums) : null;
                    const min = hasNums ? Math.min(...nums) : null;

                    return (
                      <tr key={key} style={{ borderBottom: "1px solid rgba(30,41,59,0.3)" }}>
                        <td style={{ padding: "10px 16px", color: "#64748B", fontSize: "11px", fontFamily: "var(--font-roboto-mono)" }}>
                          {SPEC_LABELS[key] || key}
                        </td>
                        {values.map((v, i) => {
                          const n = parseFloat(String(v || "0").replace(/[^0-9.]/g, ""));
                          const isNum = !isNaN(n);
                          let color = "#94A3B8";
                          if (isNum && max && min && max !== min) {
                            if (dir === "higher" && n === max) color = "#22C55E";
                            else if (dir === "higher" && n === min) color = "#EF4444";
                            else if (dir === "lower" && n === min) color = "#22C55E";
                            else if (dir === "lower" && n === max) color = "#EF4444";
                          }
                          return (
                            <td key={i} style={{ padding: "10px 16px", color, fontFamily: "var(--font-roboto-mono)", fontSize: "12px" }}>
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
                    <tr style={{ borderBottom: "1px solid #1E293B" }}>
                      <td colSpan={selectedParts.length + 1} style={{
                        padding: "12px 16px", fontSize: "11px", fontWeight: 500,
                        letterSpacing: "0.05em", color: "#475569",
                        fontFamily: "var(--font-roboto-mono)", textTransform: "uppercase",
                      }}>
                        Benchmarks
                      </td>
                    </tr>
                    {Object.keys(BENCHMARK_LABELS).map((bk) => {
                      const vals = selectedParts.map((p) => p.benchmarks.find((b) => b.benchmark === bk));
                      if (!vals.some(Boolean)) return null;
                      const sc = vals.map((v) => v?.score ?? 0);
                      const mx = Math.max(...sc);
                      return (
                        <tr key={bk} style={{ borderBottom: "1px solid rgba(30,41,59,0.3)" }}>
                          <td style={{ padding: "10px 16px", color: "#64748B", fontSize: "11px", fontFamily: "var(--font-roboto-mono)" }}>
                            {BENCHMARK_LABELS[bk]}
                          </td>
                          {vals.map((v, i) => (
                            <td key={i} style={{
                              padding: "10px 16px", fontSize: "12px",
                              color: v ? (v.score === mx && mx > 0 ? "#22C55E" : "#94A3B8") : "#475569",
                              fontFamily: "var(--font-roboto-mono)",
                            }}>
                              {v ? `${v.score.toLocaleString()} ${v.unit}` : "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div style={{ marginTop: "16px", display: "block" }} className="md:hidden">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedParts.map((p) => {
                const sp = getSpecs(p);
                return (
                  <div key={p.id} style={{
                    padding: "16px", borderRadius: "12px",
                    border: "1px solid #1E293B", backgroundColor: "rgba(30,41,59,0.3)",
                  }}>
                    <div style={{ fontFamily: "var(--font-exo)", fontWeight: 600, color: "#F8FAFC", marginBottom: "8px" }}>
                      {p.brand} {p.model}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {Object.entries(sp).slice(0, 10).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-roboto-mono)" }}>
                          <span style={{ color: "#64748B" }}>{SPEC_LABELS[k] || k}</span>
                          <span style={{ color: "#94A3B8" }}>{v}</span>
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
        <div style={{
          marginTop: "16px", padding: "12px 16px", borderRadius: "12px",
          border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)",
          color: "#EF4444", fontSize: "12px", fontFamily: "var(--font-roboto-mono)",
        }}>
          Parts must be the same type to compare. Choose parts from one category.
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        *:focus-visible { outline: 2px solid #22C55E; outline-offset: 2px; border-radius: 4px; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A" }}>
          <div className="animate-pulse" style={{ width: "100%", maxWidth: "1200px", padding: "24px" }}>
            <div style={{ height: "20px", width: "200px", backgroundColor: "#1E293B", borderRadius: "6px", marginBottom: "24px" }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: "100px", backgroundColor: "#1E293B", borderRadius: "12px" }} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
