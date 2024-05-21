import type {MedusaRequest, MedusaResponse} from "@medusajs/medusa";
import PricingGroupService from "../../../../../services/pricing-group";
import {PricingGroupProductMutationRequest} from "../../../../../types/api";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');

    try {
        const body = req.body as PricingGroupProductMutationRequest;

        if (!body.group_id) {
            res.status(400).json({
                message: "request must contain the 'group_id' parameter"
            })
            return
        }

        if (!body.product_ids) {
            res.status(400).json({
                message: "request must contain the 'product_ids' parameter with an array of product IDs"
            })
            return
        }

        await pricingGroupService.addProductToPricingGroup({ groupId: body.group_id, productIds: body.product_ids });
        res.status(200).json({});
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}