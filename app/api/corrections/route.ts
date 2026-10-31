import { isCorrectionKind } from "../../../lib/corrections";
import { createModerationItem } from "../../../lib/moderation";

export const dynamic = "force-dynamic";

/** POST target of the correction form (DB-14): one field-encoded submission per moderation item. */
export async function POST(request: Request) {
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const note = String(form.get("note") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const specKey = String(form.get("spec_key") ?? "").trim() || null;
  const groupKey = String(form.get("group_key") ?? "").trim() || null;
  const productSlug = String(form.get("product_slug") ?? "").trim() || null;
  const productIdRaw = String(form.get("product_id") ?? "").trim();
  const productId = /^\d+$/.test(productIdRaw) ? Number(productIdRaw) : null;

  const context = new URL("/corrections", request.url);
  if (productSlug) context.searchParams.set("product", productSlug);
  if (specKey) context.searchParams.set("spec", specKey);
  if (groupKey) context.searchParams.set("group", groupKey);

  if (!isCorrectionKind(kind)) {
    context.searchParams.set("error", "kind");
    return Response.redirect(context, 303);
  }
  context.searchParams.set("kind", kind);

  if (note.length < 10) {
    context.searchParams.set("error", "note");
    return Response.redirect(context, 303);
  }

  createModerationItem({
    kind,
    productId,
    specKey,
    payload: { note, email: email || null, groupKey, productSlug },
  });

  const done = new URL("/corrections", request.url);
  done.searchParams.set("submitted", "1");
  return Response.redirect(done, 303);
}
