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

// Trace Products
export type CreateTraceProductDTO = {
    gtin: string;
    quantity: number;
};

export type ListTraceProductsQueryDTO = {
    page?: number;
    limit?: number;
    search?: string;
    filter?: SupplyChainActivity | "CREATED"
};

// Trace Events
export type CreateTraceEventDTO = {
    traceProductId: string;
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