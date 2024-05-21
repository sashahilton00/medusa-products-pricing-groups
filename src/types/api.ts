import {Product} from "@medusajs/medusa";

export type PricingGroup = {
    id: string
    name: string
    products?: Product[]
    created_at: Date
    updated_at: Date
}

export type PricingGroupProductMutationRequest = {
    group_id: string
    product_ids: string[]
}

export type CreatePricingGroupRequest = {
    name: string
}

export type GetPricingGroupProductsResponse = {
    products: Product[]
}