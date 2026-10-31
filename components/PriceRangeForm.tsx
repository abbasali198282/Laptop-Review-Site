import { toSearchParams, type Filters } from "../lib/facets";
import type { SortKey } from "../lib/config";

type PriceRangeFormProps = {
  basePath: string;
  filters: Filters;
  sort: SortKey;
};

/**
 * Custom min/max price (SRCH-04) as a plain GET form: the current facets, sort and page are
 * carried as hidden fields, so the browser URL stays the whole state.
 */
export function PriceRangeForm({ basePath, filters, sort }: PriceRangeFormProps) {
  const carried = toSearchParams(filters, { sort });
  carried.delete("min_price");
  carried.delete("max_price");

  return (
    <form className="price-range" action={basePath} method="get">
      {[...carried.entries()].map(([name, value]) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}
      <fieldset>
        <legend>Custom price (₹)</legend>
        <div className="price-range__inputs">
          <label>
            <span>Min</span>
            <input
              type="number"
              name="min_price"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={filters.minPriceMinor === null ? "" : filters.minPriceMinor / 100}
            />
          </label>
          <label>
            <span>Max</span>
            <input
              type="number"
              name="max_price"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={filters.maxPriceMinor === null ? "" : filters.maxPriceMinor / 100}
            />
          </label>
        </div>
        <button type="submit">Apply price</button>
      </fieldset>
    </form>
  );
}
