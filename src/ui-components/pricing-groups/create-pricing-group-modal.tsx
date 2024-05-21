import {Alert, Button, FocusModal, Heading, Input, Label, Text, toast} from "@medusajs/ui"
import {PlusMini} from "@medusajs/icons";
import {useAdminCustomPost} from "medusa-react";
import {CreatePricingGroupRequest, PricingGroup} from "../../types/api";
import React, {ChangeEvent, useState} from "react";

export function CreatePricingGroupModal() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(null)
    const [inputInvalid, setInputInvalid] = useState(false)

    const customPost = useAdminCustomPost<CreatePricingGroupRequest, PricingGroup>(
        '/pricing-groups',
        ['pricing-groups']
    )

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        // reset any input errors thus far
        setInputInvalid(false)

        setName(event.target.value)
    }

    const handleSubmit = () => {
        if (!name) {
            setInputInvalid(true)
            return
        }

        customPost.mutate({
            name: name
        }, {
            onSuccess: (res) => {
                setOpen(false)
                toast.success("Pricing Group created", {
                    description: `The group '${name}' was created successfully.`
                })
            },
            onError: () => {
                setOpen(false)
                toast.error("Creation Failed", {
                    description: `Failed to create pricing group '${name}', an unknown error occurred.`
                })
            }
        })
    }

    return (
        <FocusModal
            open={open}
            onOpenChange={setOpen}
        >
            <FocusModal.Trigger asChild>
                <Button><PlusMini /> New Group</Button>
            </FocusModal.Trigger>
            <FocusModal.Content>
                <FocusModal.Header>
                    <Button onClick={handleSubmit}>Create Pricing Group</Button>
                </FocusModal.Header>
                <FocusModal.Body className="flex flex-col items-center py-16">
                    <div className="flex w-full max-w-2xl flex-col gap-y-8">
                        <div className="flex flex-col gap-y-2">
                            <Heading>Create Pricing Group</Heading>
                            <Text className="mt-6 text-ui-fg-subtle">
                                Create a new pricing group. Pricing groups can be used to group products such that
                                price selection for each product in the cart accounts for other items in the cart
                                belonging to the same group.
                            </Text>
                            <Text className="text-ui-fg-subtle">
                                This allows price lists to be used to set prices for each product, and for customers
                                to benefit from volume breaks when one or more grouped products are present.
                            </Text>
                            <div className="flex flex-col gap-y-4">
                                <Text className="text-ui-fg-subtle">
                                    For example, assume we have the following grouped products:
                                </Text>
                                <Text className="text-ui-fg-subtle">
                                    <ul className="mx-6 flex flex-col list-disc gap-y-2">
                                        <li>Product 1 - Default Price: £20, Price for quantities of 5 or more: £15</li>
                                        <li>Product 2 - Default Price: £30, Price for quantities of 5 or more: £25</li>
                                    </ul>
                                </Text>
                                <Text className="text-ui-fg-subtle">
                                    The process is then as follows:
                                </Text>
                                <Text className="text-ui-fg-subtle">
                                    <ul className="mx-6 flex flex-col list-decimal gap-y-2">
                                        <li>If a customer adds <i>2 x Product 1</i> and <i>2 x Product 2</i> to cart, the cart
                                            total is <i>£100 ((2 x £20) + (2 x £30))</i></li>
                                        <li>Now normally, if the customer adds another <i>2 x Product 1</i>, bringing the <i>Product
                                            1</i> quantity to <i>4</i>, the cart total would be <i>£140 (£100 + £40)</i></li>
                                        <li>Because both products are in the same product group however, the quantity used for
                                            price selection of each product is <i>6 (4 + 2)</i>.</li>
                                        <li>This results in the price for <i>Product 1</i> being <i>£15</i>, and the price
                                            for <i>Product 2</i> being <i>£25</i>, for a cart total of <i>£110 ((£15 x 4) + (£25
                                                x 2))</i></li>
                                    </ul>
                                </Text>
                            </div>
                        </div>
                        <div className="flex flex-col gap-y-2">
                            <Alert variant="error" className={inputInvalid ? "visible" : "hidden"}>The name parameter is required.</Alert>
                            <Label htmlFor="name" className="text-ui-fg-subtle">
                                Name
                            </Label>
                            <Input id="name" placeholder="Cotton T-Shirts" onInput={handleInputChange}/>
                        </div>
                    </div>
                </FocusModal.Body>
            </FocusModal.Content>
        </FocusModal>
    )
}