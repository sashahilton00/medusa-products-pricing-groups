import { Button, Container, Heading } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import React, {useMemo, useState} from "react"
import { Outlet } from "react-router-dom"

import { DataTable } from "../table/data-table"
import { useProductTableColumns } from "./pricing-groups-products-table/hooks/use-columns"
import { useProductTableFilters } from "./pricing-groups-products-table/hooks/use-filters"
import { useProductTableQuery } from "./pricing-groups-products-table/hooks/use-query"
import { useDataTable } from "../common/data-table/use-data-table"
import {useAdminCustomPost, useAdminCustomQuery, useAdminProducts} from "medusa-react";
import {GetPricingGroupProductsResponse, PricingGroupProductMutationRequest} from "../../types/api";
import {GroupProduct} from "./pricing-groups-products-table/types/product";

const PAGE_SIZE = 20

export const PricingGroupProductsTable = ({ groupId }: {
    groupId: string
}) => {
    const { searchParams, raw } = useProductTableQuery({ pageSize: PAGE_SIZE })

    const {
        products,
        isLoading: productDataLoading,
        count
    } = useAdminProducts({
        expand: "categories,collection,sales_channels,variants",
        ...searchParams
    })

    const { data, isLoading: groupProductDataLoading } = useAdminCustomQuery <null, GetPricingGroupProductsResponse>(
        `/pricing-groups/${groupId}/products`,
        ["pricing-groups"],
        null,
        {
            refetchOnMount: "always",
        }
    )

    const filters = useProductTableFilters()
    const columns = useColumns()

    const groupProducts = products && data ? products.map((p) => {
        let gp = p as GroupProduct

        // add the group ID to each product to make it accessible to the action widget
        gp.group_id = groupId

        // mark products that belong to the group if loaded
        if (((products && data && data.products) && !productDataLoading && !groupProductDataLoading)) {
            gp.belongs_to_group = Boolean(data.products.find(gp => gp.id == p.id))
        } else {
            gp.belongs_to_group = false
        }
        return gp
    }) : []

    const { table } = useDataTable({
        data: (groupProducts ?? []) as GroupProduct[],
        columns,
        count,
        enablePagination: true,
        pageSize: PAGE_SIZE,
        getRowId: (row) => row.id,
    })

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Select Products for Pricing Group</Heading>
            </div>
            <DataTable
                table={table}
                columns={columns}
                count={count}
                pageSize={PAGE_SIZE}
                filters={filters}
                search
                pagination
                isLoading={productDataLoading || groupProductDataLoading}
                queryObject={raw}
                navigateTo={(row) => `/a/products/${row.original.id}`}
                orderBy={["title", "created_at", "updated_at"]}
            />
            <Outlet />
        </Container>
    )
}

const ProductActions = ({ product }: { product: GroupProduct }) => {
    const [belongsToGroup, setBelongsToGroup] = useState(Boolean(product.belongs_to_group))

    const customPostAdd = useAdminCustomPost <PricingGroupProductMutationRequest, null>(
        `/pricing-groups/products/add`,
        [],
        null,
    )

    const customPostRemove = useAdminCustomPost <PricingGroupProductMutationRequest, null>(
        `/pricing-groups/products/remove`,
        [],
        null,
    )

    const handleProductButtonClick = (e) => {
        e.stopPropagation()
        if (belongsToGroup) {
            customPostRemove.mutate({
                group_id: product.group_id,
                product_ids: [product.id]
            }, {
                onSuccess: () => {
                    // need to change product button to reflect the fact that it's been removed
                    setBelongsToGroup(false)
                }
            })
        } else {
            customPostAdd.mutate({
                group_id: product.group_id,
                product_ids: [product.id]
            }, {
                onSuccess: () => {
                    // need to change product button to reflect the fact that it's been added
                    setBelongsToGroup(true)
                }
            })
        }
    }

    return (
        <div className="w-full text-right">
            <Button variant={ belongsToGroup ? "danger" : "primary" } onClick={handleProductButtonClick}>{ belongsToGroup ? 'Remove from group' : 'Add to group' }</Button>
        </div>
    )
}

const columnHelper = createColumnHelper<GroupProduct>()

const useColumns = () => {
    const base = useProductTableColumns()

    return useMemo(
        () => [
            ...base,
            columnHelper.display({
                id: "actions",
                cell: ({ row }) => {
                    return <ProductActions product={row.original} />
                },
            }),
        ],
        [base]
    )
}
