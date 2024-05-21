import type {MedusaRequest, MedusaResponse, Product} from "@medusajs/medusa";
import PricingGroupService from "../../../../../services/pricing-group";
import {PricingGroup} from "../../../../../models/pricing-group";

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');

    try {
        const id = req.params.id;

        let limit = parseInt(req.query.limit as string || '10')
        let offset = parseInt(req.query.offset as string || '0')

        const products: Product[] = await pricingGroupService.listProductsForPricingGroup({ id, limit, offset });
        res.status(200).json({
            products: products
        });

    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}