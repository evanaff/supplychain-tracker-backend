import { Role, SupplyChainActivity } from "./types";

// Actors
export type CreateActorDTO = {
    blockchainAddress: string;
    locationGln: string;
    name: string;
    role: Role;
};

export type ListActorsQueryDTO = {
    page?: number;
    limit?: number;
    search?: string;
    filter?: Role;
};

export type EditActorDTO = {
    name: string;
    role: Role;
};

// Locations
export type CreateLocationDTO = {
    gln: string;
    name: string;
    province: string;
    city: string;
    address: string;
    allowedRole: Role;
};

export type ListLocationsQueryDTO = {
    page?: number;
    limit?: number;
    search?: string;
    filter?: Role;
}

export type EditLocationDTO = {
    name: string;
    province: string;
    city: string;
    address: string;
};

// Products
export type CreateProductDTO = {
    gtin: string;
    varietyName: string;
    unitOfMeasure: string;
}

// Product Lots
export type CreateProductLotDTO = {
    gtin: string;
    quantity: number;
};

export type ListProductLotsQueryDTO = {
    page?: number;
    limit?: number;
    search?: string;
    filter?: SupplyChainActivity | "CREATED"
};

// Product Events
export type CreateProductEventDTO = {
    productLotId: string;
    supplyChainActivity: SupplyChainActivity
    destinationLocationGln?: string;
};

export type SubmitProductEventDTO = {
    signature: string;
};

// Products
export type ListProductsQueryDTO = {
    page?: number;
    limit?: number;
    search?: string;
}