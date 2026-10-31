/**
 * Spec presentation rules: units, metric/imperial pairs, editorial qualifier buckets and the
 * three missing-value renderings from PROMPT.md §6.3 (DB-10). Pure functions so the contract
 * is unit-testable; the React renderer only turns a description into markup.
 */
import type { QualifierBucket, SpecValueType } from "./spec-taxonomy";

export type { QualifierBucket, SpecValueType };

export type SpecState = "present" | "not_disclosed" | "absent";
export type SpecConfidence = "verified" | "unverified" | "conflicting";

export type SpecValueInput = {
  specKey: string;
  label: string;
  valueType: SpecValueType;
  unit: string | null;
  state: SpecState;
  valueNumber: number | null;
  valueText: string | null;
  valueBool: boolean | null;
  qualifierBuckets: QualifierBucket[];
  confidence: SpecConfidence;
};

export type DescribedSpecValue = {
  /** Primary visible value, e.g. `15.6 inches`, `Not disclosed`, `—`. */
  text: string;
  /** The other side of a metric/imperial pair, e.g. `39.6 cm`. */
  secondary?: string;
  /** Editorial hint from the qualifier buckets, never part of the value itself (DB-03). */
  qualifier?: string;
  missingKind?: "not_disclosed" | "absent";
  tooltip?: string;
  conflict: boolean;
};

const unitLabels: Record<string, string> = {
  mm: "mm",
  cm: "cm",
  inches: "inches",
  kg: "kg",
  lb: "lb",
  GB: "GB",
  TB: "TB",
  Wh: "Wh",
  Hz: "Hz",
  nits: "nits",
};

/**
 * One metric/imperial partner per unit (LOC-04). Families without an imperial partner
 * (`storage`, `volume_energy`, `frequency`, `brightness`, `count`) return null.
 */
const unitPairs: Record<string, { unit: string; factor: number; decimals: number }> = {
  inches: { unit: "cm", factor: 2.54, decimals: 1 },
  cm: { unit: "inches", factor: 1 / 2.54, decimals: 2 },
  mm: { unit: "inches", factor: 1 / 25.4, decimals: 2 },
  kg: { unit: "lb", factor: 2.2046226218, decimals: 1 },
  lb: { unit: "kg", factor: 1 / 2.2046226218, decimals: 2 },
};

const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function unitLabel(unit: string): string {
  return unitLabels[unit] ?? unit;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** The metric/imperial partner of a measurement, rounded to the pair's precision. */
export function pairedUnit(
  value: number,
  unit: string | null,
): { value: number; unit: string } | null {
  if (!unit) return null;
  const pair = unitPairs[unit];
  if (!pair) return null;
  return { value: roundTo(value * pair.factor, pair.decimals), unit: pair.unit };
}

/** First bucket whose inclusive `max` covers the value; a bucket without `max` is the catch-all. */
export function qualifierFor(value: number, buckets: QualifierBucket[]): string | null {
  for (const bucket of buckets) {
    if (bucket.max === undefined || value <= bucket.max) return bucket.label;
  }
  return null;
}

export const NOT_DISCLOSED_TOOLTIP = "The vendor does not publish this specification.";
export const ABSENT_TOOLTIP = "This product does not have it.";

export function describeSpecValue(input: SpecValueInput): DescribedSpecValue {
  const conflict = input.confidence === "conflicting";

  if (input.state === "not_disclosed") {
    return {
      text: "Not disclosed",
      missingKind: "not_disclosed",
      tooltip: NOT_DISCLOSED_TOOLTIP,
      conflict,
    };
  }

  if (input.state === "absent") {
    // §6.3: `No` for booleans, `—` for numeric/text values, with the "does not have it" tooltip.
    return {
      text: input.valueType === "bool" ? "No" : "—",
      missingKind: "absent",
      tooltip: ABSENT_TOOLTIP,
      conflict,
    };
  }

  if (input.valueType === "bool") {
    return { text: input.valueBool ? "Yes" : "No", conflict };
  }

  if (input.valueType === "number" && input.valueNumber !== null) {
    const text = input.unit
      ? `${formatNumber(input.valueNumber)} ${unitLabel(input.unit)}`
      : formatNumber(input.valueNumber);
    const pair = pairedUnit(input.valueNumber, input.unit);
    return {
      text,
      secondary: pair ? `${formatNumber(pair.value)} ${unitLabel(pair.unit)}` : undefined,
      qualifier:
        input.qualifierBuckets.length > 0
          ? qualifierFor(input.valueNumber, input.qualifierBuckets) ?? undefined
          : undefined,
      conflict,
    };
  }

  return { text: input.valueText ?? "—", conflict };
}

/**
 * Keys that make up the quick-spec block on the product page, in reading order
 * (DB-03: value, unit and qualifier before the full sheet).
 */
export const quickSpecKeys: string[] = [
  "display.screen_size_in",
  "processor.cpu_model",
  "memory.ram_gb",
  "storage.capacity_gb",
  "graphics.gpu_model",
  "general.weight_kg",
  "software.os",
];

export function pickQuickSpecs<T extends SpecValueInput>(values: T[], limit = 6): T[] {
  const byKey = new Map<string, T>(values.map((value) => [value.specKey, value]));
  const picked: T[] = [];
  for (const key of quickSpecKeys) {
    const value = byKey.get(key);
    if (value) picked.push(value);
    if (picked.length === limit) return picked;
  }
  return picked;
}
