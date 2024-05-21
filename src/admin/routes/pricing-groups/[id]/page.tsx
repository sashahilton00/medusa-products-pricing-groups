import {Button, Container, Text, toast, Toaster, usePrompt} from "@medusajs/ui"
import { ArrowLeftMini } from "@medusajs/icons"
import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAdminCustomDelete, useAdminCustomQuery} from "medusa-react";
import {PricingGroup} from "../../../../types/api";
import {PricingGroupProductsTable} from "../../../../ui-components/pricing-groups/pricing-group-products-table";

const PricingGroupsPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const dialog = usePrompt()

    const { data, isLoading } = useAdminCustomQuery <null, PricingGroup>(
        `/pricing-groups/${id}`,
        [],
        null,
        {
            refetchOnMount: "always",
            cacheTime: 0
        }
    )

    const customDelete = useAdminCustomDelete <null>(
        `/pricing-groups/${id}`,
        [],
        null
    )

    const handleDeleteGroup = async () => {
        let confirmed = await dialog({
            title: `Delete ${data && data.name ? data.name : `pricing group ${id}`}`,
            description: "Confirm that you would like to delete the pricing group. Products currently associated with the pricing group will be disassociated."
        })

        if (confirmed) {
            customDelete.mutate(null, {
                onSuccess: () => {
                    toast.success("Deleted Pricing Group", {
                        description: `The group '${data && data.name ? data.name : id}' was deleted successfully.`
                    })
                    navigate('/a/pricing-groups')
                },
                onError: () => {
                    toast.warning("Deleted Pricing Group", {
                        description: `The group '${data && data.name ? data.name : id}' could not be deleted, an unknown error occurred.`
                    })
                }
            })
        }
    }

    return (
        <div className="flex w-full flex-col gap-y-4">
            <Toaster />
            <Button size="small" variant="transparent">
                <div
                    className="gap-x-xsmall text-grey-50 inter-grey-40 inter-small-semibold flex items-center"
                    onClick={() => navigate('/a/pricing-groups')}
                >
                    <ArrowLeftMini/>
                    <Text size="xsmall" weight="plus" as="span" className="ml-1">Back to Pricing Groups</Text>
                </div>
            </Button>
            <Container className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between py-4">
                    <h1 className="text-grey-90 inter-xlarge-semibold">{isLoading || !data || !data.name ? `Pricing Group: ${id}` : data.name}</h1>
                    <Button variant="danger" onClick={handleDeleteGroup}>Delete Group</Button>
                </div>
                <Text>Use the table below to search and add or remove products from the pricing group. Any products belonging to the same group will be used to calculate volume pricing.</Text>
                <Text className="mb-4">Products can belong to multiple pricing groups.</Text>
                <PricingGroupProductsTable groupId={id}/>
            </Container>
        </div>
    )
}

export default PricingGroupsPage