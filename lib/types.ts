/** One catalogue row: the default variant of a product joined to its model, brand and lowest price. */
export type CatalogueRow = {
  productId: number;
  slug: string;
  modelCode: string;
  displayName: string;
  brandSlug: string;
  brandName: string;
  modelName: string;
  year: number;
  formFactor: string;
  releaseDate: string;
  cpuFamily: string;
  cpuModel: string;
  gpuFamily: string;
  gpuModel: string | null;
  ramGb: number;
  storageGb: number;
  storageType: string;
  os: string;
  screenSizeIn: number;
  touch: boolean;
  priceMinor: number | null;
  currency: string;
  popularity: number;
  updatedAt: string;
};
