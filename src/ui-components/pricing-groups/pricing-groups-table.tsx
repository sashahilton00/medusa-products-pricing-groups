import { Container, Heading } from "@medusajs/ui"
import { useColumns } from "./pricing-groups-table/use-columns";
import {DataTable} from "../table/data-table";
import {useDataTable} from "../common/data-table/use-data-table";

import { useAdminCustomQuery } from "medusa-react"
import {PricingGroup} from "../../types/api";
import {CreatePricingGroupModal} from "./create-pricing-group-modal";

const PAGE_SIZE = 10

export const PricingGroupTable = () => {
    type RequestQuery = {
        limit?: number,
        offset?: number,
    }

    type ResponseData = {
        pricing_groups: PricingGroup[]
    }

    const { data, isLoading } = useAdminCustomQuery <RequestQuery, ResponseData>(
        "/pricing-groups",
            [],
            {},
        {
            refetchOnMount: "always",
            cacheTime: 0
        }
    )

    const columns = useColumns({})
    const count = data && data.pricing_groups ? data.pricing_groups.length : 0

    const { table } = useDataTable({
        data: data && data.pricing_groups ? data.pricing_groups : [],
        columns,
        enablePagination: true,
        count,
        pageSize: PAGE_SIZE,
    })

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading>Pricing Groups</Heading>
                <CreatePricingGroupModal />
            </div>
            <DataTable
                columns={columns}
                table={table}
                pagination
                navigateTo={(row) => `/a/pricing-groups/${row.original.id}`}
                count={count}
                isLoading={isLoading}
                pageSize={PAGE_SIZE}
                // queryObject={raw}
            />
        </Container>
    )
}