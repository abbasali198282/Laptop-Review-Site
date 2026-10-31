import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { isCorrectionKind, type CorrectionKind } from "../../lib/corrections";
import { loadProductBySlug } from "../../lib/db";
import { specGroups, specKeyMap } from "../../lib/spec-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report a data problem",
  description:
    "Report a wrong or missing laptop specification. No account needed; reports go to a moderation queue.",
  robots: { index: false, follow: true },
};

type SearchParams = {
  kind?: string;
  product?: string;
  spec?: string;
  group?: string;
  submitted?: string;
  error?: string;
};

type PageProps = { searchParams: Promise<SearchParams> };

const kindCopy: Record<CorrectionKind, string> = {
  spec_correction: "Report a wrong specification",
  missing_spec: "Send a missing specification",
  missing_model: "Send a missing spec sheet",
};

function contextParams(params: SearchParams): Record<string, string> {
  const carried: Record<string, string> = {};
  if (params.product) carried.product = params.product;
  if (params.spec) carried.spec = params.spec;
  if (params.group) carried.group = params.group;
  return carried;
}

/**
 * Minimal correction form behind DB-14 / COMM-07. It is the destination of the conflicting-value
 * warning and of the empty spec groups; a submission is written to the moderation queue with no
 * account required.
 */
export default async function CorrectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const kind: CorrectionKind = isCorrectionKind(params.kind) ? params.kind : "spec_correction";
  const product = params.product ? loadProductBySlug(params.product) : null;
  const spec = params.spec ? specKeyMap.get(params.spec) : undefined;
  const group = params.group ? specGroups.find((item) => item.key === params.group) : undefined;
  const submitted = params.submitted === "1";
  const error = params.error;
  const carried = contextParams(params);
  const prefill = spec
    ? `The recorded ${spec.label.toLowerCase()} value looks wrong because `
    : group
      ? `The ${group.label.toLowerCase()} specification is missing because `
      : "";

  return (
    <div className="corrections">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Report a data problem", href: "/corrections" },
        ]}
      />

      <header className="list-header">
        <h1>{kindCopy[kind]}</h1>
        <p className="list-header__intro">
          Every spec value on this site comes from a vendor spec sheet or editorial entry. If a
          value is wrong or a specification is missing, tell us where you saw it and what it should
          be. No account is needed.
        </p>
      </header>

      {product ? (
        <p className="correction-context" data-testid="correction-context">
          Reporting on <strong>{product.brandName} {product.modelName}</strong> (model code{" "}
          <code>{product.modelCode}</code>)
          {spec ? <> — specification: <strong>{spec.label}</strong></> : null}
          {group ? <> — group: <strong>{group.label}</strong></> : null}.
        </p>
      ) : null}

      {submitted ? (
        <p className="notice notice--success" role="status" data-testid="correction-success">
          Thanks — your report is in the moderation queue. We use it to correct the spec sheet.
        </p>
      ) : null}

      {error ? (
        <p className="notice notice--error" role="alert" data-testid="correction-error">
          {error === "kind"
            ? "Choose what kind of report you are sending and try again."
            : "Add a short description of the problem (at least 10 characters) and try again."}
        </p>
      ) : null}

      <form className="correction-form" method="post" action="/api/corrections">
        <input type="hidden" name="kind" value={kind} />
        {product ? <input type="hidden" name="product_id" value={product.productId} /> : null}
        {params.product ? <input type="hidden" name="product_slug" value={params.product} /> : null}
        {spec ? <input type="hidden" name="spec_key" value={spec.key} /> : null}
        {group ? <input type="hidden" name="group_key" value={group.key} /> : null}

        <label htmlFor="note">What is wrong or missing?</label>
        <textarea
          id="note"
          name="note"
          required
          minLength={10}
          rows={5}
          defaultValue={prefill}
          aria-describedby="note-hint"
        />
        <p id="note-hint" className="muted">
          Describe the problem and, if you can, the correct value and where it is published.
        </p>

        <label htmlFor="email">Email (optional — only if we need to ask a follow-up)</label>
        <input id="email" name="email" type="email" autoComplete="email" />

        <p>
          <button className="button" type="submit">
            Send report
          </button>
        </p>
      </form>

      <p>
        <Link href={product ? `/laptop/${product.slug}` : "/laptops"}>
          {product ? "Back to the laptop" : "Back to the catalogue"}
        </Link>
      </p>
    </div>
  );
}
