/**
 * Moderation queue writes behind DB-14 / COMM-07. The spec-correction form needs no account;
 * a submission becomes one `pending` moderation item (PROMPT.md §5.16).
 *
 * The catalogue reader in `lib/db.ts` keeps a read-only connection; this writer opens its own
 * connection for the single insert and closes it, so a page render never holds a write lock.
 */
import { DatabaseSync } from "node:sqlite";
import { databasePath } from "./db";
import type { CorrectionKind } from "./corrections";

export type ModerationInput = {
  kind: CorrectionKind;
  productId: number | null;
  specKey: string | null;
  payload: Record<string, unknown>;
};

export function createModerationItem(input: ModerationInput): number {
  const db = new DatabaseSync(databasePath);
  try {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        "INSERT INTO moderation_item (kind, product_id, spec_key, payload, state, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
      )
      .run(
        input.kind,
        input.productId,
        input.specKey,
        JSON.stringify(input.payload),
        now,
        now,
      );
    return Number(result.lastInsertRowid);
  } finally {
    db.close();
  }
}
