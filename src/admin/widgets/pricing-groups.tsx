import type {ProductDetailsWidgetProps, WidgetConfig} from "@medusajs/admin"
import {Button, Container, Table, Text} from "@medusajs/ui"
import {PricingGroup, PricingGroupProductMutationRequest} from "../../types/api";
import { useAdminCustomPost, useAdminCustomQuery} from "medusa-react";
import {DateCell} from "../../ui-components/table/table-cells/common/date-cell";

import { useNavigate } from "react-router-dom"
import React, {useState} from "react";

const PricingGroupWidget = ({ product }: ProductDetailsWidgetProps) => {
    const navigate = useNavigate()

    type ResponseData = {
        pricing_groups: PricingGroup[]
    }

    const { data, isLoading } = useAdminCustomQuery <null, ResponseData>(
        `/products/${product.id}/pricing-groups`,
        [],
        null,
        {
            refetchOnMount: "always",
            cacheTime: 0
        }
    )

    type ProductDeleteResponse = {}

    const customPost = useAdminCustomPost <PricingGroupProductMutationRequest, ProductDeleteResponse>(
        `/pricing-groups/products/remove`,
        [],
        null,
    )

    const handleRemoveProductFromGroup = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        const groupId = e.currentTarget.getAttribute('data-pricing-group-id')
        const productId = e.currentTarget.getAttribute('data-product-id')

        if (groupId && productId) {
            customPost.mutate({
                group_id: groupId,
                product_ids: [productId]
            }, {
                onSuccess: () => {
                    data.pricing_groups = data.pricing_groups.filter(pg => pg.id !== groupId)
                }
            })
        }
    }

    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

    return (
        <Container className="flex flex-col gap-y-8">
            <h1 className="text-grey-90 inter-xlarge-semibold">Pricing Groups</h1>
            {(data && data.pricing_groups && data.pricing_groups.length > 0) &&
              <Table>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Name</Table.HeaderCell>
                        <Table.HeaderCell>Created At</Table.HeaderCell>
                        <Table.HeaderCell>Updated At</Table.HeaderCell>
                        <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {(data && data.pricing_groups) && data.pricing_groups.map((pg) => {

                        return (
                            <Table.Row
                                key={pg.id}
                                className="[&_td:last-child]:w-[1%] [&_td:last-child]:whitespace-nowrap"
                                onClick={() => {navigate(`/a/pricing-groups/${pg.id}`)}}
                                onMouseEnter={(e) => {setHoveredRow(pg.id)}}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                <Table.Cell>{pg.name}</Table.Cell>
                                <Table.Cell><DateCell date={pg.created_at} /></Table.Cell>
                                <Table.Cell><DateCell date={pg.updated_at} /></Table.Cell>
                                <Table.Cell>
                                    <div className={hoveredRow && hoveredRow == pg.id ? "w-full" : "w-full invisible"}>
                                        <Button variant="danger" data-product-id={product.id} data-pricing-group-id={pg.id} onClick={handleRemoveProductFromGroup}>Remove from Group</Button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        )
                    })}
                </Table.Body>
            </Table>}
            {(!data || !data.pricing_groups || data.pricing_groups.length == 0) &&
              <Text>Product does not belong to any pricing groups.</Text>
            }
        </Container>
    )
}

export const config: WidgetConfig = {
    zone: [
        "product.details.after"
    ],
}

export default PricingGroupWidget