import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import PricingGroupService from "../../../services/pricing-group";
import { PricingGroup } from "../../../models/pricing-group";

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');

    try {
        let limit = parseInt(req.query.limit as string || '10')
        let offset = parseInt(req.query.offset as string || '0')
        let include_products = (req.query.include_products as string || "").toLowerCase() == 'true'

        const pricingGroups: PricingGroup[] = await pricingGroupService.listPricingGroups({ limit, offset, include_products });
        res.status(200).json({
            pricing_groups: pricingGroups
        });

    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {

    const pricingGroupService: PricingGroupService = req.scope.resolve('pricingGroupService');

    try {
        const body: any = req.body as any;

        if (!body.name) {
            res.status(400).json({
                message: "the 'name' parameter is required"
            })
            return
        }

        const pricingGroup: PricingGroup = await pricingGroupService.createPricingGroup({ name: body.name });
        res.status(201).json(pricingGroup);
    } catch (e) {
        res.status(400).json({
            message: e.message
        })
    }
}