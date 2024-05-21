import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import PricingGroupService from "../../../../../services/pricing-group";
import { PricingGroup } from "../../../../../models/pricing-group";

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');

    try {
        const productId = req.params.id

        const pricingGroups: PricingGroup[] = await pricingGroupService.getPricingGroupsForProduct({ productId });
        res.status(200).json({
            pricing_groups: pricingGroups
        });
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}