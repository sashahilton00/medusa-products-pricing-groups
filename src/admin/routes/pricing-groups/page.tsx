import { RouteConfig } from "@medusajs/admin"
import {Container, Tabs, Text, Toaster} from "@medusajs/ui"
import { Channels } from "@medusajs/icons"
import {PricingGroupTable} from "../../../ui-components/pricing-groups/pricing-groups-table";

const PricingGroupsPage = () => {
    return (
        <div className="flex w-full flex-col gap-y-2">
            <Toaster />
            <PricingGroupTable />
        </div>
    )
}
export const config: RouteConfig = {
    link: {
        label: "Pricing Groups",
        icon: Channels,
    },
}

export default PricingGroupsPage