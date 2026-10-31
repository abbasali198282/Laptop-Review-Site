import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalogueRows, loadProductBySlug, loadSpecValues } from "../../lib/db";
import {
  describeSpecValue,
  pairedUnit,
  pickQuickSpecs,
  qualifierFor,
  quickSpecKeys,
  type SpecValueInput,
} from "../../lib/specs";
import { specGroups, specKeyMap, specKeys } from "../../lib/spec-taxonomy";

const screenBuckets = [
  { max: 13.5, label: "Small" },
  { max: 14.6, label: "Standard" },
  { max: 15.7, label: "Large" },
  { label: "Desktop replacement" },
];

const weightBuckets = [
  { max: 1.3, label: "Very light" },
  { max: 1.7, label: "Light" },
  { max: 2.2, label: "Average" },
  { label: "Heavy" },
];

function value(overrides: Partial<SpecValueInput> = {}): SpecValueInput {
  return {
    specKey: "display.screen_size_in",
    label: "Screen size",
    valueType: "number",
    unit: "inches",
    state: "present",
    valueNumber: 15.6,
    valueText: null,
    valueBool: null,
    qualifierBuckets: screenBuckets,
    confidence: "verified",
    ...overrides,
  };
}

test("a present number renders value + unit, a metric/imperial pair and the editorial qualifier", () => {
  const described = describeSpecValue(value());
  assert.equal(described.text, "15.6 inches");
  assert.equal(described.secondary, "39.6 cm");
  assert.equal(described.qualifier, "Large");
  assert.equal(described.missingKind, undefined);

  const weight = describeSpecValue(
    value({
      specKey: "general.weight_kg",
      label: "Weight",
      unit: "kg",
      valueNumber: 1.7,
      qualifierBuckets: weightBuckets,
    }),
  );
  assert.equal(weight.text, "1.7 kg");
  assert.equal(weight.secondary, "3.7 lb");
  assert.equal(weight.qualifier, "Light");
});

test("a millimetre value pairs with inches and a unit without a family has no pair", () => {
  assert.deepEqual(pairedUnit(19.9, "mm"), { value: 0.78, unit: "inches" });
  assert.equal(pairedUnit(16, "GB"), null);
  assert.equal(pairedUnit(42, "Wh"), null);

  const ram = describeSpecValue(
    value({
      specKey: "memory.ram_gb",
      label: "Installed RAM",
      unit: "GB",
      valueNumber: 16,
      qualifierBuckets: [{ max: 8, label: "Minimal" }, { max: 16, label: "Standard" }, { label: "Generous" }],
    }),
  );
  assert.equal(ram.text, "16 GB");
  assert.equal(ram.secondary, undefined);
  assert.equal(ram.qualifier, "Standard");
});

test("the three missing-value states are distinct renderings, never one bare dash", () => {
  const notDisclosed = describeSpecValue(value({ state: "not_disclosed", valueNumber: null }));
  const absentNumber = describeSpecValue(value({ state: "absent", valueNumber: null }));
  const absentBool = describeSpecValue(
    value({ specKey: "connectivity.ethernet", valueType: "bool", unit: null, state: "absent", valueNumber: null }),
  );
  const presentBool = describeSpecValue(
    value({ specKey: "display.touchscreen", valueType: "bool", unit: null, valueNumber: null, valueBool: false }),
  );

  assert.equal(notDisclosed.text, "Not disclosed");
  assert.equal(notDisclosed.missingKind, "not_disclosed");
  assert.match(notDisclosed.tooltip ?? "", /vendor does not publish/i);

  assert.equal(absentNumber.text, "—");
  assert.equal(absentNumber.missingKind, "absent");
  assert.match(absentNumber.tooltip ?? "", /does not have it/i);

  assert.equal(absentBool.text, "No");
  assert.equal(absentBool.missingKind, "absent");

  assert.equal(presentBool.text, "No");
  assert.equal(presentBool.missingKind, undefined);
  assert.notEqual(notDisclosed.tooltip, absentNumber.tooltip);
});

test("a conflicting confidence value is flagged for the correction form", () => {
  const described = describeSpecValue(value({ confidence: "conflicting" }));
  assert.equal(described.conflict, true);
  assert.equal(describeSpecValue(value()).conflict, false);
});

test("qualifier buckets are inclusive upper bounds with a catch-all", () => {
  assert.equal(qualifierFor(13.5, screenBuckets), "Small");
  assert.equal(qualifierFor(13.51, screenBuckets), "Standard");
  assert.equal(qualifierFor(15.6, screenBuckets), "Large");
  assert.equal(qualifierFor(17, screenBuckets), "Desktop replacement");
  assert.equal(qualifierFor(15.6, []), null);
});

test("the taxonomy covers the vendor spec groups in PROMPT.md §5.5 order", () => {
  assert.deepEqual(
    specGroups.map((group) => group.label),
    [
      "General",
      "Display",
      "Processor",
      "Graphics",
      "Memory",
      "Storage",
      "Battery",
      "Connectivity",
      "Input",
      "Audio",
      "Software",
      "Warranty",
    ],
  );
  assert.equal(new Set(specKeys.map((key) => key.key)).size, specKeys.length);
  for (const key of specKeys) {
    assert.ok(specKeyMap.has(key.key), `${key.key} is not in the lookup map`);
    assert.ok(key.helpText.trim().length > 20, `${key.key} needs editorially useful help text`);
    assert.ok(specGroups.some((group) => group.key === key.group), `${key.key} has an unknown group`);
  }
  assert.ok(quickSpecKeys.length >= 4);
  assert.ok(quickSpecKeys.every((key) => specKeyMap.has(key)));
});

test("quick specs keep taxonomy priority and stop at the limit", () => {
  const values = quickSpecKeys
    .slice(1)
    .map((key) =>
      value({
        specKey: key,
        label: specKeyMap.get(key)!.label,
        valueType: specKeyMap.get(key)!.valueType,
        unit: specKeyMap.get(key)!.unit,
        valueText: "recorded",
        valueNumber: null,
      }),
    );
  const picked = pickQuickSpecs(values);
  assert.equal(picked[0].specKey, quickSpecKeys[1]);
  assert.ok(picked.length <= 6);
});

test("the seeded demo sheet records every vendor group plus all three states and a conflict", () => {
  const row = loadCatalogueRows().find((candidate) => candidate.modelCode === "X1504VA-NJ521WS");
  assert.ok(row, "the seeded demo product X1504VA-NJ521WS is missing");

  const product = loadProductBySlug(row.slug);
  assert.ok(product, `no product loaded for ${row.slug}`);
  assert.equal(product.modelCode, "X1504VA-NJ521WS");
  assert.equal(product.brandName, "ASUS");
  assert.equal(product.variants.length, 3, "the demo model is seeded with three variants");
  assert.equal(product.variants.filter((variant) => variant.isCurrent).length, 1);
  assert.ok(product.variants.some((variant) => variant.modelCode === "X1504VA-NJ321WS"));
  assert.ok(product.lowestPriceMinor !== null);

  const specs = loadSpecValues(product.productId);
  const recordedGroups = new Set(specs.map((spec) => spec.groupKey));
  for (const group of specGroups) {
    assert.ok(recordedGroups.has(group.key), `the complete sheet has nothing recorded for ${group.key}`);
  }

  const states = new Set(specs.map((spec) => spec.state));
  assert.ok(states.has("present") && states.has("not_disclosed") && states.has("absent"));

  const conflicting = specs.filter((spec) => spec.confidence === "conflicting");
  assert.ok(conflicting.length >= 1, "the demo sheet needs a conflicting value");
  assert.ok(conflicting.every((spec) => spec.state === "present"));

  const brightness = specs.find((spec) => spec.specKey === "display.brightness_max");
  assert.ok(brightness, "the demo sheet records max brightness");
  assert.ok(brightness.helpText.length > 0, "spec help comes from the recorded taxonomy row");
  assert.deepEqual(brightness.qualifierBuckets.map((bucket) => bucket.label), ["Dim", "Average", "Bright"]);

  const weight = specs.find((spec) => spec.specKey === "general.weight_kg");
  assert.ok(weight && weight.valueNumber !== null);
  const describedWeight = describeSpecValue(weight);
  assert.match(describedWeight.secondary ?? "", /lb$/);

  // Groups are ordered by the vendor taxonomy, not by insertion order.
  const groupOrder = specs.map((spec) => spec.groupOrder);
  assert.deepEqual(groupOrder, [...groupOrder].sort((a, b) => a - b));
});

test("a sparse seeded sheet leaves vendor groups empty so the specs tab can ask for feedback", () => {
  const row = loadCatalogueRows().find((candidate) => candidate.modelCode === "X1504VA-NJ321WS");
  assert.ok(row);
  const product = loadProductBySlug(row.slug);
  assert.ok(product);
  const specs = loadSpecValues(product.productId);
  const recordedGroups = new Set(specs.map((spec) => spec.groupKey));
  assert.ok(specs.length > 0);
  assert.ok(!recordedGroups.has("warranty"), "sparse sheet should leave warranty empty");
  assert.ok(!recordedGroups.has("battery"), "sparse sheet should leave battery empty");
});

test("an unknown product slug resolves to no product (the route renders a 404)", () => {
  assert.equal(loadProductBySlug("not-a-real-laptop-xyz"), null);
});
