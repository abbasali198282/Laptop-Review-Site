import type { CatalogueRow } from "../../lib/types";

export function makeRow(overrides: Partial<CatalogueRow> = {}): CatalogueRow {
  return {
    productId: 1,
    slug: "asus-vivobook-15-x1504va-nj521ws",
    modelCode: "X1504VA-NJ521WS",
    displayName: "ASUS Vivobook 15 X1504VA (Core i5-1335U/16GB/512GB SSD)",
    brandSlug: "asus",
    brandName: "ASUS",
    modelName: "Vivobook 15 X1504VA",
    year: 2024,
    formFactor: "clamshell",
    releaseDate: "2024-03-15",
    cpuFamily: "Intel Core i5",
    cpuModel: "Core i5-1335U",
    gpuFamily: "integrated",
    gpuModel: "Intel Iris Xe",
    ramGb: 16,
    storageGb: 512,
    storageType: "ssd",
    os: "windows-11-home",
    screenSizeIn: 15.6,
    touch: false,
    priceMinor: 6299000,
    currency: "INR",
    popularity: 480,
    updatedAt: "2026-10-30T06:00:00Z",
    ...overrides,
  };
}

/**
 * Small hand-built catalogue used by the query-layer tests: two brands, two price bands,
 * two RAM sizes, two form factors and a null-price row.
 */
export const sampleRows: CatalogueRow[] = [
  makeRow({ productId: 1, modelCode: "A-1", brandSlug: "asus", brandName: "ASUS", priceMinor: 3999000, ramGb: 8, cpuFamily: "Intel Core i3", screenSizeIn: 14.0, popularity: 490, releaseDate: "2024-03-15" }),
  makeRow({ productId: 2, modelCode: "A-2", brandSlug: "asus", brandName: "ASUS", priceMinor: 6299000, ramGb: 16, screenSizeIn: 15.6, popularity: 485, releaseDate: "2024-05-10" }),
  makeRow({ productId: 3, modelCode: "A-3", brandSlug: "asus", brandName: "ASUS", priceMinor: 15499000, ramGb: 32, cpuFamily: "AMD Ryzen 9", gpuFamily: "nvidia", formFactor: "gaming", screenSizeIn: 14.0, popularity: 470, releaseDate: "2024-06-01" }),
  makeRow({ productId: 4, modelCode: "L-1", brandSlug: "lenovo", brandName: "Lenovo", priceMinor: 4699000, ramGb: 8, cpuFamily: "Intel Core i3", screenSizeIn: 15.6, popularity: 475, releaseDate: "2024-02-08" }),
  makeRow({ productId: 5, modelCode: "L-2", brandSlug: "lenovo", brandName: "Lenovo", priceMinor: 10499000, ramGb: 32, cpuFamily: "Intel Core i7", gpuFamily: "nvidia", formFactor: "gaming", screenSizeIn: 15.6, touch: true, popularity: 460, releaseDate: "2023-04-01" }),
  makeRow({ productId: 6, modelCode: "L-3", brandSlug: "lenovo", brandName: "Lenovo", priceMinor: null, ramGb: 16, cpuFamily: "Intel Core i5", screenSizeIn: 14.0, popularity: 450, releaseDate: "2022-01-01" }),
];
