import {
    dataSource,
} from "@medusajs/medusa/dist/loaders/database"
import { PricingGroup } from "../models/pricing-group"

const PricingGroupRepository = dataSource.getRepository(
    PricingGroup
)

export default PricingGroupRepository