import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, AlertTriangle, Shield, Activity, Search, ChevronDown, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_INSURANCES, ALL_MODALITIES, type Modality } from "@/data/mockCenters";
import { RankingFooterNote } from "@/components/RankingFooterNote";
import { DEFAULT_RADIUS, RADIUS_OPTIONS } from "@/lib/searchRadius";

const HOME_LOCATION_LABEL =
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5";
const HOME_LOCATION_FIELD =
  "flex min-h-12 items-center gap-2 rounded-2xl border-2 border-primary/30 bg-secondary/50 pl-3 pr-2 py-2";
const HOME_ZIP_INPUT =
  "border-0 bg-transparent h-8 min-h-8 text-base font-medium tracking-wider focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-0";
const HOME_RADIUS_TRIGGER =
  "h-8 min-h-8 w-full min-w-0 border-0 bg-transparent px-0 text-base font-medium leading-none shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&>span]:line-clamp-1";

const Index = () => {
  const navigate = useNavigate();
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [zipCode, setZipCode] = useState("77024");
  const [zipError, setZipError] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [insurance, setInsurance] = useState<string>("any");
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  const toggleModality = (modality: Modality) => {
    setModalities((prev) =>
      prev.includes(modality) ? prev.filter((m) => m !== modality) : [...prev, modality],
    );
  };

  const modalityParam = modalities.length ? modalities.join(",") : "any";

  const modalityLabel =
    modalities.length === 0
      ? "Any modality"
      : modalities.length <= 2
        ? modalities.join(", ")
        : `${modalities.slice(0, 2).join(", ")} +${modalities.length - 2}`;

  const handleZipChange = (value: string) => {
    setZipError(null);
    setZipCode(value.replace(/\D/g, "").slice(0, 5));
  };

  const handleSearch = () => {
    if (zipCode.length !== 5) {
      setZipError("Enter a valid 5-digit U.S. ZIP code.");
      zipInputRef.current?.focus();
      return;
    }
    setZipError(null);
    const params = new URLSearchParams({
      loc: zipCode,
      urgent: String(urgent),
      insurance,
      modality: modalityParam,
    });
    if (radius !== DEFAULT_RADIUS) {
      params.set("radius", radius);
    }
    navigate(`/results?${params.toString()}`);
  };

  return (
    <main className="min-h-screen text-foreground">
      <header className="border-b border-primary/25 bg-primary-soft backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow shrink-0">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="font-display text-xl font-semibold tracking-tight text-foreground block">
                Expert Radiology
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80 block mt-0.5">
                Imaging center finder
              </span>
            </div>
          </div>
          <nav className="flex items-center">
            <Button type="button" variant="hero" size="sm" className="font-semibold">
              Sign in
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto max-w-4xl px-6 pt-12 md:pt-16 pb-16">
        <h1 className="font-display text-[1.85rem] sm:text-[2.55rem] font-semibold leading-[1.1] tracking-tight text-center text-foreground whitespace-nowrap">
          Find the right center, <span className="text-primary">Fast.</span>
        </h1>

        <div className="mt-8 bg-card rounded-3xl shadow-card border border-border/60 p-2.5 sm:p-3">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="zip" className={HOME_LOCATION_LABEL}>
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  ZIP code
                </Label>
                <div className={HOME_LOCATION_FIELD}>
                  <Input
                    ref={zipInputRef}
                    id="zip"
                    name="zip"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={zipCode}
                    onChange={(e) => handleZipChange(e.target.value)}
                    className={HOME_ZIP_INPUT}
                    placeholder="e.g. 77024"
                    maxLength={5}
                    pattern="\d{5}"
                    aria-invalid={zipError ? true : undefined}
                    aria-describedby={zipError ? "zip-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.focus()}
                    className="shrink-0 text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="w-full sm:w-[11rem] shrink-0 space-y-2 sm:pt-0">
                <Label htmlFor="search-radius" className={HOME_LOCATION_LABEL}>
                  <Radar className="h-3.5 w-3.5 text-primary" />
                  Search within
                </Label>
                <div className={HOME_LOCATION_FIELD}>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger id="search-radius" className={HOME_RADIUS_TRIGGER}>
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
              </div>
            </div>
            {zipError && (
              <p id="zip-error" className="text-xs font-medium text-amber-800 dark:text-amber-200" role="alert">
                {zipError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug">
              Results are ordered by distance from the center of this ZIP code. Some regions are estimates
              in this preview.
            </p>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="px-3 py-2.5 rounded-2xl hover:bg-secondary/40 transition-smooth">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Scan type
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="mt-1 flex h-7 w-full items-center justify-between text-left text-sm font-medium leading-none text-foreground"
                  >
                    <span className="truncate pr-2">{modalityLabel}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select scan types</p>
                    {modalities.length > 0 && (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-primary hover:underline"
                        onClick={() => setModalities([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {ALL_MODALITIES.map((m) => (
                      <label key={m} className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-secondary/60">
                        <Checkbox
                          checked={modalities.includes(m)}
                          onCheckedChange={() => toggleModality(m)}
                        />
                        <span className="text-sm">{m}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="px-3 py-2.5 rounded-2xl hover:bg-secondary/40 transition-smooth">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Insurance
              </Label>
              <Select value={insurance} onValueChange={setInsurance}>
                <SelectTrigger className="border-0 bg-transparent h-7 px-0 text-sm font-medium leading-none focus:ring-0 shadow-none mt-1 w-full min-w-0 text-left items-center">
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
          </div>

          <div
            className={`mt-1.5 flex items-center gap-3 rounded-2xl px-4 py-2.5 border ${
              urgent
                ? "bg-urgent-soft border-urgent/30"
                : "bg-secondary/50 border-transparent hover:border-border/40"
            }`}
          >
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                urgent ? "bg-urgent text-urgent-foreground" : "bg-background text-muted-foreground border border-border/60"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold">Urgent referral</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Prioritize centers with walk-in availability today.
              </p>
            </div>
            <Switch checked={urgent} onCheckedChange={setUrgent} className="shrink-0" />
          </div>

          <Button
            type="button"
            onClick={handleSearch}
            variant="hero"
            size="lg"
            className="mt-2.5 w-full h-11 rounded-2xl font-semibold"
          >
            <Search className="h-4 w-4" />
            Find imaging centers
          </Button>
        </div>

        <RankingFooterNote />
      </section>
    </main>
  );
};

export default Index;
