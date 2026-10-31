/**
 * Data-correction links (DB-14 / COMM-07). One helper so the conflicting-value warning and the
 * empty spec group reach the same form with the product/spec context pre-filled.
 */

export type CorrectionKind = "spec_correction" | "missing_spec" | "missing_model";

export const correctionKinds: CorrectionKind[] = [
  "spec_correction",
  "missing_spec",
  "missing_model",
];

export function isCorrectionKind(value: string | undefined): value is CorrectionKind {
  return correctionKinds.includes(value as CorrectionKind);
}

export function correctionHref(input: {
  kind: CorrectionKind;
  productSlug?: string;
  specKey?: string;
  groupKey?: string;
}): string {
  const params = new URLSearchParams({ kind: input.kind });
  if (input.productSlug) params.set("product", input.productSlug);
  if (input.specKey) params.set("spec", input.specKey);
  if (input.groupKey) params.set("group", input.groupKey);
  return `/corrections?${params.toString()}`;
}
