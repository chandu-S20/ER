import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Map,
  Star,
  Shield,
  Activity,
  AlertTriangle,
  Sparkles,
  Phone,
  ArrowDownWideNarrow,
  X,
  ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MOCK_CENTERS,
  ALL_INSURANCES,
  ALL_MODALITIES,
  type Insurance,
  type Modality,
} from "@/data/mockCenters";
import { type ScoredCenter, formatSortDetail, rankCenters } from "@/lib/scoring";
import { parseSortBy, sortOptionLabel, SORT_OPTIONS } from "@/lib/sortOptions";
import {
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  parseRadiusMilesParam,
  radiusParamForQuery,
} from "@/lib/searchRadius";
import { cn } from "@/lib/utils";
import { ReferralDialog } from "@/components/ReferralDialog";

function parseModalitiesParam(raw: string | null): Modality[] {
  if (!raw || raw === "any") return [];
  const set = new Set<Modality>();
  for (const chunk of raw.split(",")) {
    const m = chunk.trim() as Modality;
    if (ALL_MODALITIES.includes(m)) set.add(m);
  }
  return [...set];
}

function formatModalitiesLabel(modalities: Modality[]): string {
  if (modalities.length === 0) return "Any modality";
  if (modalities.length <= 2) return modalities.join(", ");
  return `${modalities.slice(0, 2).join(", ")} +${modalities.length - 2}`;
}

/** `loc` query param: prefer showing a 5-digit ZIP as "ZIP 77024"; otherwise show the saved string. */
function formatSearchAreaLabel(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 5) return `ZIP ${digits}`;
  return raw;
}

function formatRadiusLine(miles: number): string {
  if (miles === Number.POSITIVE_INFINITY) return "Any distance";
  return `Within ${Math.round(miles)} mi`;
}

const Results = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralCenterName, setReferralCenterName] = useState("");
  const [referralCenterId, setReferralCenterId] = useState<string | null>(null);
  const [referredCenterIds, setReferredCenterIds] = useState(() => new Set<string>());
  const location = searchParams.get("loc") || "77024";
  const radiusParam = searchParams.get("radius");
  const radiusMiles = useMemo(() => parseRadiusMilesParam(radiusParam), [radiusParam]);
  const urgent = searchParams.get("urgent") === "true";
  const insurance = (searchParams.get("insurance") || "any") as Insurance | "any";
  const modalities = parseModalitiesParam(searchParams.get("modality"));
  const sortBy = parseSortBy(searchParams.get("sort"));

  const setSortInUrl = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "relevance") {
          next.delete("sort");
        } else {
          next.set("sort", value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const clearFilter = (key: "urgent" | "insurance" | "modality" | "sort" | "radius") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === "urgent") {
          next.set("urgent", "false");
        } else if (key === "insurance") {
          next.set("insurance", "any");
        } else if (key === "modality") {
          next.delete("modality");
        } else if (key === "radius") {
          next.delete("radius");
        } else {
          next.delete("sort");
        }
        return next;
      },
      { replace: true },
    );
  };

  const setUrgent = (v: boolean) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("urgent", String(v));
        return next;
      },
      { replace: true },
    );
  };
  const toggleModality = (value: Modality) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = parseModalitiesParam(next.get("modality"));
        const updated = current.includes(value)
          ? current.filter((m) => m !== value)
          : [...current, value];
        if (updated.length === 0) {
          next.delete("modality");
        } else {
          next.set("modality", updated.join(","));
        }
        return next;
      },
      { replace: true },
    );
  };

  const clearModalities = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("modality");
        return next;
      },
      { replace: true },
    );
  };
  const setInsurance = (v: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("insurance", v);
        return next;
      },
      { replace: true },
    );
  };

  const setRadius = (v: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v === DEFAULT_RADIUS) {
          next.delete("radius");
        } else {
          next.set("radius", v);
        }
        return next;
      },
      { replace: true },
    );
  };

  const searchCriteria = useMemo(
    () => ({ urgent, insurance, modalities }),
    [urgent, insurance, modalities],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (urgent) n += 1;
    if (modalities.length > 0) n += 1;
    if (insurance !== "any") n += 1;
    if (sortBy !== "relevance") n += 1;
    if (radiusParam != null && radiusParam !== "" && radiusParam !== DEFAULT_RADIUS) n += 1;
    return n;
  }, [urgent, modalities, insurance, sortBy, radiusParam]);

  const radiusQueryValue = radiusParam && radiusParam !== "" ? radiusParam : DEFAULT_RADIUS;

  const centersQuery = useQuery({
    queryKey: [
      "centers-rank",
      location,
      radiusQueryValue,
      searchCriteria.urgent,
      searchCriteria.insurance,
      searchCriteria.modalities.join(","),
      sortBy,
    ] as const,
    queryFn: async ({ signal }) => {
      const q = new URLSearchParams({
        loc: location,
        radius: radiusParamForQuery(radiusMiles),
        urgent: String(searchCriteria.urgent),
        insurance: searchCriteria.insurance,
        modality: searchCriteria.modalities.length ? searchCriteria.modalities.join(",") : "any",
        sort: sortBy,
      });
      const res = await fetch(`/api/centers/rank?${q}`, { signal });
      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }
      const body = (await res.json()) as { centers: ScoredCenter[] };
      return body.centers;
    },
    retry: 1,
  });

  const ranked: ScoredCenter[] = centersQuery.isError
    ? rankCenters(MOCK_CENTERS, searchCriteria, sortBy, radiusMiles)
    : (centersQuery.data ?? rankCenters(MOCK_CENTERS, searchCriteria, sortBy, radiusMiles));

  const listStats = useMemo(() => {
    if (ranked.length === 0) {
      return { minDistance: 0, avgWait: null as number | null };
    }
    const minDistance = Math.min(...ranked.map((c) => c.distanceMiles));
    const waits = ranked
      .map((c) => c.currentWaitMinutes)
      .filter((m): m is number => m != null);
    const avgWait = waits.length
      ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length)
      : null;
    return { minDistance, avgWait };
  }, [ranked]);

  return (
    <main className="min-h-screen flex flex-col text-foreground">
      <header className="shrink-0 sticky top-0 z-10 border-b border-primary/25 bg-primary-soft backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-3">
          <div className="flex items-start gap-3">
            <Link to="/" className="shrink-0 pt-0.5">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">New search</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="font-medium truncate block sm:inline sm:whitespace-nowrap">
                      {formatSearchAreaLabel(location)}
                    </span>{" "}
                    <span className="text-muted-foreground font-normal">· {formatRadiusLine(radiusMiles)}</span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="hero"
                  size="sm"
                  className="shrink-0 gap-1.5 w-full sm:w-auto font-semibold"
                  onClick={() => toast.info("Map view is coming in a future release.", { duration: 3000 })}
                >
                  <Map className="h-3.5 w-3.5" />
                  Map view
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {urgent && (
                  <FilterPill
                    label="Urgent"
                    onRemove={() => clearFilter("urgent")}
                    tone="urgent"
                  />
                )}
                {modalities.length > 0 && (
                  <FilterPill
                    label={formatModalitiesLabel(modalities)}
                    onRemove={() => clearFilter("modality")}
                    tone="default"
                    prefix="Modality"
                  />
                )}
                {insurance !== "any" && (
                  <FilterPill
                    label={insurance}
                    onRemove={() => clearFilter("insurance")}
                    tone="default"
                    prefix="Ins."
                  />
                )}
                {sortBy !== "relevance" && (
                  <FilterPill
                    label={sortOptionLabel(sortBy)}
                    onRemove={() => clearFilter("sort")}
                    tone="default"
                    prefix="Sort"
                  />
                )}
                {radiusParam != null && radiusParam !== "" && radiusParam !== DEFAULT_RADIUS && (
                  <FilterPill
                    label={
                      RADIUS_OPTIONS.find((o) => o.value === radiusParam)?.label ?? `Within ${radiusParam}`
                    }
                    onRemove={() => clearFilter("radius")}
                    tone="default"
                    prefix="Radius"
                  />
                )}
                <FiltersPopover
                  count={activeFilterCount}
                  urgent={urgent}
                  modalities={modalities}
                  insurance={insurance}
                  sortBy={sortBy}
                  radiusValue={radiusQueryValue}
                  onUrgent={setUrgent}
                  onToggleModality={toggleModality}
                  onClearModalities={clearModalities}
                  onInsurance={setInsurance}
                  onSort={setSortInUrl}
                  onRadius={setRadius}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto w-full max-w-4xl flex-1 flex flex-col px-6 pt-6 sm:pt-8 pb-16">
        <div className="min-h-0">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr,auto] lg:items-end lg:gap-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              {centersQuery.isPending ? "Finding centers…" : `${ranked.length} centers near you`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ordered by:{" "}
              <span className="font-medium text-foreground">{sortOptionLabel(sortBy)}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row lg:items-stretch xl:items-end">
            {!centersQuery.isPending && ranked.length > 0 && (
              <div className="grid w-full min-w-0 max-w-[12.5rem] sm:max-w-[13rem] grid-cols-2 gap-1.5">
                <div className="flex min-h-[3.25rem] min-w-0 flex-col justify-center rounded-lg border border-border/80 bg-card/90 px-2 py-1.5 shadow-sm">
                  <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
                    Closest in list
                  </p>
                  <p className="mt-0.5 text-xs font-bold tabular-nums leading-none text-foreground">
                    {listStats.minDistance.toFixed(1)} mi
                  </p>
                </div>
                <div className="flex min-h-[3.25rem] min-w-0 flex-col justify-center rounded-lg border border-border/80 bg-card/90 px-2 py-1.5 shadow-sm">
                  <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
                    Avg wait
                  </p>
                  <p className="mt-0.5 text-xs font-bold tabular-nums leading-none text-foreground">
                    {listStats.avgWait != null ? `~${listStats.avgWait} min` : "—"}
                  </p>
                </div>
              </div>
            )}
            <div className="w-full min-w-0 sm:min-w-[12rem] lg:min-w-[14rem] space-y-1">
              <Label
                htmlFor="results-sort"
                className="text-xs text-muted-foreground font-normal flex items-center gap-1.5"
              >
                <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                Change sort
              </Label>
              <Select value={sortBy} onValueChange={setSortInUrl}>
                <SelectTrigger id="results-sort" className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {centersQuery.isError && (
          <p className="mb-4 text-sm text-amber-700">
            Couldn&apos;t reach the API; showing the same ranking computed in your browser.
          </p>
        )}

        {centersQuery.isPending && <p className="mb-6 text-muted-foreground">Loading ranked centers…</p>}

        {urgent && !centersQuery.isPending && (
          <div className="mb-6 rounded-2xl border border-urgent/20 bg-urgent-soft p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-urgent text-urgent-foreground flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Urgent request flagged</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Centers that accept emergency walk-ins are highlighted.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {!centersQuery.isPending &&
            ranked.map((center, idx) => {
              const sortLine = formatSortDetail(center, sortBy);
              const wait = waitMetric(center);
              const net = networkMetric(insurance, center.inNetwork);
              return (
                <article
                  key={center.id}
                  className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-smooth hover:shadow-card hover:border-primary/25 ${
                    idx === 0
                      ? "ring-1 ring-primary/20 border-l-4 border-l-primary"
                      : ""
                  }`}
                >
                  {idx === 0 && (
                    <div className="flex items-center gap-2 border-b border-primary/20 bg-primary-soft/70 px-4 py-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      Best match for your search
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-semibold ${
                          idx === 0
                            ? "bg-gradient-hero text-primary-foreground shadow-glow"
                            : "bg-primary-soft text-primary"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-display text-base font-semibold leading-tight text-foreground sm:text-lg">
                                {center.name}
                              </h2>
                              {center.isExpertRadiologyOwned && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 gap-1 border-primary/50 bg-primary-soft/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm"
                                  title="Operated in the Expert Radiology network—preferred for coordinated referrals."
                                >
                                  <Activity className="h-3 w-3" aria-hidden />
                                  Expert Radiology
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {center.address}
                            </p>
                          </div>
                          <div className="shrink-0 sm:text-right">
                            <div className="flex items-center justify-end gap-1 text-sm">
                              <Star
                                className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-600 dark:fill-yellow-400 dark:text-yellow-300"
                                aria-hidden
                              />
                              <span className="font-semibold text-foreground">{center.rating}</span>
                              <span className="text-xs text-muted-foreground">({center.reviewCount})</span>
                            </div>
                            {sortBy !== "relevance" && (
                              <>
                                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{sortLine.primary}</p>
                                {sortLine.secondary && (
                                  <p className="text-[11px] text-muted-foreground">{sortLine.secondary}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-border/40 bg-secondary/15 [-webkit-overflow-scrolling:touch]">
                          <div className="grid w-full min-w-[28rem] grid-cols-5 gap-2 px-2.5 py-2.5 sm:min-w-0 sm:gap-2.5 sm:px-3 sm:py-2.5">
                            <MetricBlock
                              label="Distance"
                              value={`${center.distanceMiles.toFixed(1)} mi`}
                              valueClass="text-foreground"
                            />
                            <MetricBlock label="Wait time" value={wait.text} valueClass={wait.className} />
                            <MetricBlock label="Coverage" value={net.text} valueClass={net.className} />
                            <MetricBlock
                              label="Avg report time"
                              value={`~${center.avgReportTurnaroundHours}h`}
                              valueClass="text-foreground"
                            />
                            <MetricBlock
                              label="Match"
                              value={`${Math.round(center.score * 100)}%`}
                              valueClass="text-foreground"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div>
                              <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                                Scans
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {center.modalities.slice(0, 5).map((m) => (
                                  <span
                                    key={m}
                                    className="inline-flex items-center rounded-md border border-border/70 bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground/90"
                                  >
                                    {m}
                                  </span>
                                ))}
                                {center.modalities.length > 5 && (
                                  <span className="inline-flex items-center rounded-md border border-dashed border-border/80 bg-secondary/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    +{center.modalities.length - 5}
                                  </span>
                                )}
                                {urgent && center.acceptsEmergency && (
                                  <span className="inline-flex items-center gap-0.5 rounded-md border border-urgent/30 bg-urgent-soft px-1.5 py-0.5 text-[10px] font-medium text-urgent">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>
                            {center.specialties.length > 0 && (
                              <p className="text-xs leading-snug text-muted-foreground">
                                <span className="font-medium text-foreground/85">Known for: </span>
                                {center.specialties.join(" · ")}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-start sm:pt-0.5">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="shrink-0 h-9 w-9"
                              title={`Call ${center.phone}`}
                              onClick={() => {
                                const d = center.phone.replace(/\D/g, "");
                                window.location.href = d ? `tel:${d}` : "#";
                              }}
                            >
                              <Phone className="h-4 w-4" />
                              <span className="sr-only">Call</span>
                            </Button>
                            <Button
                              type="button"
                              variant="hero"
                              disabled={referredCenterIds.has(center.id)}
                              className="min-h-9 min-w-[7.5rem] gap-2 font-semibold"
                              onClick={() => {
                                setReferralCenterName(center.name);
                                setReferralCenterId(center.id);
                                setReferralOpen(true);
                              }}
                            >
                              <Shield className="h-3.5 w-3.5" />
                              {referredCenterIds.has(center.id) ? "Referred" : "Refer"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
        </div>
      </section>

      <ReferralDialog
        open={referralOpen}
        onOpenChange={(o) => {
          setReferralOpen(o);
          if (!o) {
            setReferralCenterName("");
            setReferralCenterId(null);
          }
        }}
        centerName={referralCenterName}
        centerId={referralCenterId ?? ""}
        onReferred={(id) => {
          setReferredCenterIds((prev) => new Set(prev).add(id));
        }}
      />
    </main>
  );
};

function FilterPill({
  label,
  onRemove,
  tone = "default",
  prefix,
}: {
  label: string;
  onRemove: () => void;
  tone?: "default" | "urgent";
  prefix?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-0.5 rounded-full border-0 pl-2 pr-0.5 text-xs font-semibold text-primary-foreground bg-gradient-hero shadow-glow",
        tone === "urgent" && "ring-2 ring-urgent/90 ring-offset-0",
      )}
    >
      {prefix && (
        <span className="shrink-0 font-normal text-primary-foreground/90 sm:inline hidden">
          {prefix}:{" "}
        </span>
      )}
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded-full p-1 text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function FiltersPopover({
  count,
  urgent,
  modalities,
  insurance,
  sortBy,
  radiusValue,
  onUrgent,
  onToggleModality,
  onClearModalities,
  onInsurance,
  onSort,
  onRadius,
}: {
  count: number;
  urgent: boolean;
  modalities: Modality[];
  insurance: string;
  sortBy: ReturnType<typeof parseSortBy>;
  radiusValue: string;
  onUrgent: (v: boolean) => void;
  onToggleModality: (v: Modality) => void;
  onClearModalities: () => void;
  onInsurance: (v: string) => void;
  onSort: (v: string) => void;
  onRadius: (v: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="hero" size="sm" className="gap-1.5 h-7 text-xs font-semibold">
          <ListFilter className="h-3.5 w-3.5" />
          Filters
          {count > 0 && (
            <span className="ml-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <p className="text-sm font-semibold mb-3">Refine search</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Urgent referral</Label>
            <Switch checked={urgent} onCheckedChange={onUrgent} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Search within</Label>
            <Select value={radiusValue} onValueChange={onRadius}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Modality</Label>
              {modalities.length > 0 && (
                <button type="button" className="text-[11px] text-primary hover:underline" onClick={onClearModalities}>
                  Clear
                </button>
              )}
            </div>
            <div className="rounded-md border p-2 space-y-2 max-h-36 overflow-auto">
              {ALL_MODALITIES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={modalities.includes(m)} onCheckedChange={() => onToggleModality(m)} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Insurance</Label>
            <Select value={insurance} onValueChange={onInsurance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No preference</SelectItem>
                {ALL_INSURANCES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sort</Label>
            <Select value={sortBy} onValueChange={onSort}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function waitMetric(center: ScoredCenter): { text: string; className: string } {
  if (center.currentWaitMinutes != null) {
    const m = center.currentWaitMinutes;
    return {
      text: `~${m}m`,
      className: m <= 20 ? "text-emerald-600" : m <= 45 ? "text-amber-600" : "text-amber-800",
    };
  }
  if (center.walkInsAvailable) {
    return { text: "Walk-in", className: "text-emerald-600" };
  }
  if (/today/i.test(center.nextAvailable)) {
    return { text: "Today", className: "text-amber-600" };
  }
  if (/tomorrow/i.test(center.nextAvailable)) {
    return { text: "Next day", className: "text-amber-700" };
  }
  return { text: "By appt", className: "text-muted-foreground" };
}

function networkMetric(
  insurance: string,
  inNetwork: boolean,
): { text: string; className: string } {
  if (insurance === "any") {
    return { text: "—", className: "text-muted-foreground" };
  }
  return inNetwork
    ? { text: "In", className: "text-emerald-600" }
    : { text: "Out", className: "text-amber-800" };
}

function MetricBlock({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground/90 sm:text-[9px]">
        {label}
      </p>
      <p
        className={cn("mt-0.5 break-words text-sm font-bold tabular-nums leading-tight sm:mt-1", valueClass)}
      >
        {value}
      </p>
    </div>
  );
}

export default Results;
