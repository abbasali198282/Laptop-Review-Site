/**
 * Spec taxonomy for the MVP laptop catalogue (PROMPT.md §5.5, DB-02, DB-08).
 *
 * This is the versioned source of the vendor spec groups and of every spec key the catalogue
 * records: display label, value type, unit, unit family, help copy and the editorial qualifier
 * buckets from §6/DB-03. `scripts/seed.ts` writes these rows into `spec_group` and `spec_key`;
 * pages read the recorded rows, so editorial copy can change without touching templates.
 */

export type SpecGroupDef = {
  key: string;
  label: string;
};

/** Vendor spec groups in the order DB-02 requires them on the specs tab. */
export const specGroups: SpecGroupDef[] = [
  { key: "general", label: "General" },
  { key: "display", label: "Display" },
  { key: "processor", label: "Processor" },
  { key: "graphics", label: "Graphics" },
  { key: "memory", label: "Memory" },
  { key: "storage", label: "Storage" },
  { key: "battery", label: "Battery" },
  { key: "connectivity", label: "Connectivity" },
  { key: "input", label: "Input" },
  { key: "audio", label: "Audio" },
  { key: "software", label: "Software" },
  { key: "warranty", label: "Warranty" },
];

export type SpecValueType = "number" | "text" | "bool" | "enum";

/** Editorial thresholds behind DB-03's plain-language hint; `max` is inclusive. */
export type QualifierBucket = {
  max?: number;
  label: string;
};

export type SpecKeyDef = {
  key: string;
  group: string;
  label: string;
  valueType: SpecValueType;
  unit: string | null;
  unitFamily: string | null;
  direction?: "higher_better" | "lower_better" | "neutral";
  comparable?: boolean;
  helpText: string;
  qualifierBuckets?: QualifierBucket[];
};

export const specKeys: SpecKeyDef[] = [
  {
    key: "general.model_code",
    group: "general",
    label: "Model code",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The manufacturer's own part number for this exact configuration. Quote it to a retailer or support agent; it identifies the SKU, not the whole product line.",
  },
  {
    key: "general.release_date",
    group: "general",
    label: "Release date",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "When the manufacturer released this model in the market. Later revisions can ship with different parts, so check the code before buying.",
  },
  {
    key: "general.form_factor",
    group: "general",
    label: "Form factor",
    valueType: "enum",
    unit: null,
    unitFamily: null,
    helpText:
      "The physical shape of the machine: a plain clamshell, a 360° convertible, a detachable tablet, a Chromebook or a gaming chassis.",
  },
  {
    key: "general.weight_kg",
    group: "general",
    label: "Weight",
    valueType: "number",
    unit: "kg",
    unitFamily: "mass",
    helpText:
      "Weight of the laptop without its charger. Lighter machines are easier to carry, but often trade battery capacity and ports for it.",
    qualifierBuckets: [
      { max: 1.3, label: "Very light" },
      { max: 1.7, label: "Light" },
      { max: 2.2, label: "Average" },
      { label: "Heavy" },
    ],
  },
  {
    key: "general.thickness_mm",
    group: "general",
    label: "Thickness",
    valueType: "number",
    unit: "mm",
    unitFamily: "length",
    helpText:
      "How thick the closed laptop is at its thickest point. Below 18 mm a laptop slips easily into a sleeve; above 22 mm it feels bulky.",
    qualifierBuckets: [
      { max: 15, label: "Very thin" },
      { max: 19, label: "Thin" },
      { max: 23, label: "Average" },
      { label: "Thick" },
    ],
  },
  {
    key: "display.screen_size_in",
    group: "display",
    label: "Screen size",
    valueType: "number",
    unit: "inches",
    unitFamily: "length",
    helpText:
      "Diagonal size of the display, shown in inches and centimetres. Bigger screens are easier to work on; 13–14 inches travels better than 15.6 inches or more.",
    qualifierBuckets: [
      { max: 13.5, label: "Small" },
      { max: 14.6, label: "Standard" },
      { max: 15.7, label: "Large" },
      { label: "Desktop replacement" },
    ],
  },
  {
    key: "display.resolution",
    group: "display",
    label: "Resolution",
    valueType: "text",
    unit: null,
    unitFamily: "resolution",
    helpText:
      "Pixels across and down. More pixels give sharper text and more usable desktop space; 1920 × 1080 is the baseline, 2560 × 1600 is noticeably crisper.",
  },
  {
    key: "display.panel_type",
    group: "display",
    label: "Panel type",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The display technology. IPS offers wide viewing angles, OLED deep contrast and fast response, and TN fast response at the cost of colour and angles.",
  },
  {
    key: "display.touchscreen",
    group: "display",
    label: "Touchscreen",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether the screen accepts touch input. Useful on convertibles and detachables; on a clamshell it adds weight and gloss.",
  },
  {
    key: "display.refresh_rate_hz",
    group: "display",
    label: "Refresh rate",
    valueType: "number",
    unit: "Hz",
    unitFamily: "frequency",
    helpText:
      "How many times per second the display redraws. 60 Hz is the standard; 90 Hz and above make scrolling and fast games look smoother.",
  },
  {
    key: "display.brightness_max",
    group: "display",
    label: "Max brightness",
    valueType: "number",
    unit: "nits",
    unitFamily: "brightness",
    helpText:
      "The brightest the panel can go. Around 300 nits is comfortable indoors; 400 nits and above stays readable near a window or outdoors.",
    qualifierBuckets: [
      { max: 300, label: "Dim" },
      { max: 400, label: "Average" },
      { label: "Bright" },
    ],
  },
  {
    key: "processor.cpu_family",
    group: "processor",
    label: "Processor family",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The product family of the CPU. It groups chips of the same generation and tier, which matters more than the brand name for everyday speed.",
  },
  {
    key: "processor.cpu_model",
    group: "processor",
    label: "Processor model",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The exact processor part number. Two laptops can share a model name and still ship with different CPUs, so compare this row, not the marketing name.",
  },
  {
    key: "processor.cores",
    group: "processor",
    label: "Cores",
    valueType: "number",
    unit: null,
    unitFamily: "count",
    helpText:
      "Number of physical CPU cores. More cores help heavy multitasking and exports, while single-core speed matters more for browsing and office work.",
  },
  {
    key: "graphics.gpu_model",
    group: "graphics",
    label: "Graphics model",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The graphics processor. Integrated graphics share system memory and suit video and light games; a discrete GPU has its own memory for gaming and 3D work.",
  },
  {
    key: "memory.ram_gb",
    group: "memory",
    label: "Installed RAM",
    valueType: "number",
    unit: "GB",
    unitFamily: "storage",
    helpText:
      "RAM fitted as sold. 8 GB is enough for browsing and documents, 16 GB is the comfortable baseline for many tabs and apps, 32 GB suits heavy workloads.",
    qualifierBuckets: [
      { max: 8, label: "Minimal" },
      { max: 16, label: "Standard" },
      { label: "Generous" },
    ],
  },
  {
    key: "memory.memory_type",
    group: "memory",
    label: "Memory type",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "RAM generation and speed, for example LPDDR5-5200. Faster memory helps integrated graphics more than it helps everyday office work.",
  },
  {
    key: "memory.max_ram_gb",
    group: "memory",
    label: "Maximum RAM",
    valueType: "number",
    unit: "GB",
    unitFamily: "storage",
    helpText:
      "The most RAM the manufacturer supports. Soldered memory cannot be upgraded at all, so this row is the upgrade ceiling.",
  },
  {
    key: "storage.capacity_gb",
    group: "storage",
    label: "Storage",
    valueType: "number",
    unit: "GB",
    unitFamily: "storage",
    helpText:
      "Drive capacity as sold, before formatting and the operating system. 512 GB is the current baseline; 1 TB leaves room for games and media.",
  },
  {
    key: "storage.type",
    group: "storage",
    label: "Storage type",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The kind of drive: an SSD is fast and quiet, eMMC is slow and found on the cheapest machines, and an HDD is rare in new laptops.",
  },
  {
    key: "storage.expandable",
    group: "storage",
    label: "Expandable storage",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether there is a free M.2 slot or memory-card reader for adding storage later. Many thin laptops have neither.",
  },
  {
    key: "battery.capacity_wh",
    group: "battery",
    label: "Battery capacity",
    valueType: "number",
    unit: "Wh",
    unitFamily: "volume_energy",
    helpText:
      "Battery energy in watt-hours, the honest way to compare batteries across voltages. Larger capacity usually means longer runtime at the same screen and chip.",
    qualifierBuckets: [
      { max: 45, label: "Small" },
      { max: 60, label: "Average" },
      { label: "Large" },
    ],
  },
  {
    key: "battery.rated_life",
    group: "battery",
    label: "Rated battery life",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The vendor's own battery-life claim, copied verbatim. Real runtime depends on workload, brightness and whether the laptop is on Wi-Fi.",
  },
  {
    key: "battery.cells",
    group: "battery",
    label: "Battery cells",
    valueType: "number",
    unit: null,
    unitFamily: "count",
    helpText:
      "Number of battery cells. More cells usually mean more energy inside the same chassis; a laptop without a user-replaceable battery may not publish this.",
  },
  {
    key: "battery.fast_charging",
    group: "battery",
    label: "Fast charging",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether the bundled charger can top the battery up quickly. The exact claim is a vendor figure and usually needs its own footnote.",
  },
  {
    key: "connectivity.wifi",
    group: "connectivity",
    label: "Wi-Fi",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The Wi-Fi generation and standard. Wi-Fi 6 and newer handle crowded networks better; Wi-Fi 5 is still common on budget machines.",
  },
  {
    key: "connectivity.bluetooth",
    group: "connectivity",
    label: "Bluetooth",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The Bluetooth version the wireless card supports. Newer versions improve accessory pairing and range, but most peripherals work with older ones.",
  },
  {
    key: "connectivity.usb_ports",
    group: "connectivity",
    label: "USB ports",
    valueType: "number",
    unit: null,
    unitFamily: "count",
    helpText:
      "Total USB ports, whatever their shape. Check the individual port types before relying on a USB-C dock or display output.",
  },
  {
    key: "connectivity.ethernet",
    group: "connectivity",
    label: "Ethernet port",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether the chassis has a wired network port. Thin laptops usually drop it; a USB adapter is the workaround.",
  },
  {
    key: "input.keyboard",
    group: "input",
    label: "Keyboard",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "Keyboard type, backlight and layout as the vendor describes it. A backlit keyboard and a full number pad are the differences most people notice.",
  },
  {
    key: "input.fingerprint_reader",
    group: "input",
    label: "Fingerprint reader",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether the laptop has a fingerprint sensor for signing in. Some models offer face recognition instead, which is a different row.",
  },
  {
    key: "input.numeric_keypad",
    group: "input",
    label: "Numeric keypad",
    valueType: "bool",
    unit: null,
    unitFamily: null,
    helpText:
      "Whether the keyboard has a separate number pad. It speeds up spreadsheets but pushes the main keys off-centre.",
  },
  {
    key: "audio.speakers",
    group: "audio",
    label: "Speakers",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The speaker setup as the vendor describes it. Driver count and tuning matter more than the marketing label.",
  },
  {
    key: "audio.microphone",
    group: "audio",
    label: "Microphone",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The built-in microphone array. More microphones usually mean clearer calls and better noise rejection, but the vendor does not always publish the detail.",
  },
  {
    key: "software.os",
    group: "software",
    label: "Operating system",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The operating system the laptop ships with. It decides which apps run and how long the vendor keeps sending updates.",
  },
  {
    key: "warranty.cover",
    group: "warranty",
    label: "Warranty",
    valueType: "text",
    unit: null,
    unitFamily: null,
    helpText:
      "The manufacturer warranty in this market. Check what it covers and where service is handled, because retailer and manufacturer terms can differ.",
  },
];

export const specKeyMap: ReadonlyMap<string, SpecKeyDef> = new Map(
  specKeys.map((key) => [key.key, key]),
);

export function specGroupOrder(key: string): number {
  return specGroups.findIndex((group) => group.key === key);
}
