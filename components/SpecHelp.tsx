/**
 * Per-spec-key help (DB-08) with the WAI tooltip's keyboard requirement met without hover:
 * native `<details>/<summary>` is focusable, opens with Enter/Space and on tap, and needs no
 * client JavaScript. Help copy is editorial content stored per spec key, never per product.
 */
export function SpecHelp({
  specKey,
  label,
  helpText,
}: {
  specKey: string;
  label: string;
  helpText: string;
}) {
  return (
    <details className="spec-help" data-testid={`spec-help-${specKey}`} data-spec-key={specKey}>
      <summary className="spec-help__trigger">
        <span className="spec-help__label">{label}</span>
        <span className="spec-help__mark" aria-hidden="true">
          ?
        </span>
        <span className="visually-hidden"> — what this specification means</span>
      </summary>
      <p className="spec-help__text">{helpText}</p>
    </details>
  );
}
