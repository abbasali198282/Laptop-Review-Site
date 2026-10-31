import { defaultSort } from "./config";
import { hasActiveFilters, parseFilters } from "./facets";

/** Next.js hands `searchParams` as a plain object; the query layer wants URLSearchParams. */
export type NextSearchParams = Record<string, string | string[] | undefined>;

export function toUrlSearchParams(input: NextSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }
  return params;
}

/** True when the request carries facets or a non-default sort (i.e. the URL is a variant). */
export function requestIsFiltered(input: NextSearchParams): boolean {
  const params = toUrlSearchParams(input);
  const sort = params.get("sort");
  return hasActiveFilters(parseFilters(params)) || (sort !== null && sort !== defaultSort);
}
