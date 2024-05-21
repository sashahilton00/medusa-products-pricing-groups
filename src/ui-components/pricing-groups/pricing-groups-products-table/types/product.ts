import {Product} from "@medusajs/medusa";

// have to extend Product definition to pass group ID to make it available in row data
export class GroupProduct extends Product {
    group_id: string
    belongs_to_group: boolean
}