import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import PricingGroupService from "../../../../services/pricing-group";
import { PricingGroup } from "../../../../models/pricing-group";

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');
    const id = req.params.id

    try {
        const pricingGroup: PricingGroup = await pricingGroupService.getPricingGroup({ id });
        res.status(200).json(pricingGroup);

    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}

export const PATCH = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');
    const id = req.params.id

    try {
        const body: any = req.body as any;

        if (!body.name) {
            res.status(400).json({
                message: "the 'name' parameter is required"
            })
        }

        const name = body.name

        const pricingGroup: PricingGroup = await pricingGroupService.updatePricingGroup({ id, name });
        res.status(200).json(pricingGroup);
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}

export const DELETE = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');
    const id = req.params.id

    try {
        const result = await pricingGroupService.deletePricingGroup({ id });
        if (result && result.affected > 0) {
            res.status(204).json({})
        } else {
            res.status(404).json({
                message: `unable to locate pricing group with id: ${id}`
            })
        }
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}