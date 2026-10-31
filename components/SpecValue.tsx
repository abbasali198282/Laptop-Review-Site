import Link from "next/link";
import type { SpecValueRow } from "../lib/db";
import { describeSpecValue } from "../lib/specs";
import { correctionHref } from "../lib/corrections";

type SpecValueProps = {
  row: SpecValueRow;
  /** Product the row belongs to, used by the correction link behind a conflicting value. */
  productSlug: string;
};

const missingTooltipId = (specKey: string) => `spec-hint-${specKey.replace(/\./g, "-")}`;

/**
 * One spec value in whichever of the three renderings PROMPT.md §6.3 requires:
 * value + unit (with a metric/imperial pair and the editorial qualifier as a hint),
 * italic `Not disclosed` with a tooltip, or `No`/`—` with the "does not have it" tooltip.
 * A conflicting value keeps its value and adds a marker that links to the correction form.
 */
export function SpecValue({ row, productSlug }: SpecValueProps) {
  const described = describeSpecValue(row);
  const tooltipId = missingTooltipId(row.specKey);

  return (
    <span
      className="spec-value"
      data-testid={`spec-value-${row.specKey}`}
      data-state={described.missingKind ?? "present"}
      data-confidence={row.confidence}
    >
      {described.missingKind ? (
        <span
          className={`spec-value__missing spec-value__missing--${described.missingKind}`}
          tabIndex={0}
          aria-describedby={tooltipId}
        >
          {described.missingKind === "not_disclosed" ? <em>Not disclosed</em> : <span>{described.text}</span>}
          <span className="spec-value__tooltip" role="tooltip" id={tooltipId}>
            {described.tooltip}
          </span>
        </span>
      ) : (
        <>
          <span className="spec-value__primary">{described.text}</span>
          {described.secondary ? (
            <span className="spec-value__secondary"> ({described.secondary})</span>
          ) : null}
        </>
      )}

      {described.qualifier ? (
        <span className="spec-value__qualifier" data-testid="spec-qualifier">
          {" "}
          · {described.qualifier}
        </span>
      ) : null}

      {described.conflict ? (
        <span className="spec-value__conflict" data-testid="spec-conflict">
          <span aria-hidden="true">⚠</span>{" "}
          <span>Conflicting sources</span>{" "}
          <Link
            href={correctionHref({
              kind: "spec_correction",
              productSlug,
              specKey: row.specKey,
            })}
          >
            Report a correction
          </Link>
        </span>
      ) : null}
    </span>
  );
}
