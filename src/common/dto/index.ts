// Type
export type Role = "GROWER" | "DISTRIBUTOR" | "RETAILER" | "ADMIN";
export type SupplyChainActivity = "HARVESTING" | "SHIPPING" | "RECEIVING" | "SELLING";

// Actors
export type CreateActorDTO = {
  blockchainAddress: string;
  name: string;
  role: Role;
};

export type ListActorsQueryDTO = {
  page?: number;
  limit?: number;
  role?: Role;
  search?: string;
};

export type EditActorDTO = {
  name: string;
  role: Role;
};

// Locations
export type CreateLocationDTO = {
  name: string;
  province: string;
  city: string;
  address: string;
};

export type ListLocationsQueryDTO = {
  page?: number;
  limit?: number;
  search?: string;
}

export type EditLocationDTO = {
  name: string;
  province: string;
  city: string;
  address: string;
};

// Trace Products
export type CreateTraceProductDTO = {
  gtin: string;
  gln: string;
  quantity: number;
};

export type ListTraceProductsQueryDTO = {
    page?: number;
    limit?: number;
};

// Trace Events
export type CreateTraceEventDTO = {
  traceProductId: string;
  sourceLocationGln: string;
  destinationLocationGln?: string;
};

export type SubmitTraceEventDTO = {
  signature: string;
};

// Products
export type ListProductsQueryDTO = {
  page?: number;
  limit?: number;
  search?: string;
}