import {Product, ProductService, TransactionBaseService} from "@medusajs/medusa"
import {PricingGroup} from "../models/pricing-group";
import {FindManyOptions} from "typeorm";

class PricingGroupService extends TransactionBaseService {
    protected productService_: ProductService
    constructor({
        productService
    }) {
        // @ts-ignore
        super(...arguments)

        this.productService_ = productService
    }
    async listPricingGroups({
        limit = 10,
        offset = 0,
        include_products = false
    }: {
        limit?: number,
        offset?: number,
        include_products?: boolean
    }): Promise<PricingGroup[]> {
        const pricingGroupRepository = this.activeManager_.getRepository(PricingGroup)

        let queryOpts: FindManyOptions = {
            take: (limit > 0 && limit <= 100) ? limit : 10,
            skip: offset
        }

        if (include_products) {
            queryOpts.relations = {
                products: true
            }
        }

        return await pricingGroupRepository.find(queryOpts)
    }

    async getPricingGroup({ id }: {
        id: string
    }){
        const pricingGroupRepository = this.activeManager_.getRepository(PricingGroup)
        const pricingGroups = await pricingGroupRepository.find({
            where: {
                id: id
            },
            relations: {
                products: true
            }
        })

        if (pricingGroups && pricingGroups.length > 0) {
            return pricingGroups[0]
        }
    }

    async getPricingGroupsForProduct({ productId }: {
        productId: string
    }){
        const pricingGroupRepository = this.activeManager_.getRepository(PricingGroup)
        return await pricingGroupRepository
            .createQueryBuilder("pricing_group")
            .distinctOn(["pricing_group.id"])
            .leftJoin('pricing_group.products', "product")
            .where("product.id = :id", {id: productId})
            .getMany()
    }

    async createPricingGroup({ name }: {
        name: string,
    }) {
        return this.atomicPhase_(async (manager) => {
            const pricingGroupRepository = manager.getRepository(PricingGroup)

            const pricingGroup = pricingGroupRepository.create()
            pricingGroup.name = name

            return await pricingGroupRepository.save(pricingGroup)
        })
    }

    async updatePricingGroup({ id, name }: {
        id: string,
        name: string
    }){
        return this.atomicPhase_(async (manager) => {
            const pricingGroupRepository = manager.getRepository(PricingGroup)

            const pricingGroup = await this.getPricingGroup({ id })

            if (!pricingGroup) {
                return null
            }

            if (name) {
                pricingGroup.name = name
            }

            return await pricingGroupRepository.save(pricingGroup)
        })
    }

    async deletePricingGroup({ id }: {
        id: string,
    }) {
        return this.atomicPhase_(async (manager) => {
            const pricingGroupRepository = manager.getRepository(PricingGroup)

            const pricingGroup = await this.getPricingGroup({ id })
            if (!pricingGroup) {
                return null
            }

            return await pricingGroupRepository.delete(pricingGroup.id)
        })
    }

    async listProductsForPricingGroup({
        id,
        limit = 10,
        offset = 0,
    }: {
        id: string
        limit?: number,
        offset?: number,
    }): Promise<Product[]> {
        const pricingGroup = await this.getPricingGroup({ id })
        if (!pricingGroup) {
            return null
        }

        const products = pricingGroup.products
        console.log(products)

        return this._limitOffset(products, limit, offset)
    }

    async addProductToPricingGroup({ groupId, productIds }: {
        groupId: string,
        productIds: string[]
    }) {
        return this.atomicPhase_(async (manager) => {
            const pricingGroupRepository = manager.getRepository(PricingGroup)

            const pricingGroup = await this.getPricingGroup({ id: groupId })
            if (!pricingGroup) {
                throw new Error(`unable to locate pricing group with ID: ${groupId}`)
            }

            for (const productId of productIds) {
                const product =  await this.productService_.retrieve(productId)
                if (!product) {
                    throw new Error(`unable to locate product with ID: ${productId}`)
                }

                pricingGroup.products.push(product)
            }

            return await pricingGroupRepository.save(pricingGroup)
        })
    }

    async removeProductFromPricingGroup({ groupId, productIds }: {
        groupId: string,
        productIds: string[]
    }) {
        return this.atomicPhase_(async (manager) => {
            const pricingGroupRepository = manager.getRepository(PricingGroup)

            const pricingGroup = await this.getPricingGroup({ id: groupId })
            if (!pricingGroup) {
                throw new Error(`unable to locate pricing group with ID: ${groupId}`)
            }

            for (const productId of productIds) {
                if (!pricingGroup.products.find(p => p.id === productId)) {
                    throw new Error(`pricing group is not linked to product ID: ${productId}`)
                }

                pricingGroup.products = pricingGroup.products.filter((p) => {
                    return p.id !== productId
                })
            }

            return await pricingGroupRepository.save(pricingGroup)
        })
    }

    private _limitOffset<T>(array: T[], limit: number, offset: number): T[] {
        if (!array) return [];

        const length = array.length;

        if (!length) {
            return [];
        }
        if (offset > length - 1) {
            return [];
        }

        const start = Math.min(length - 1, offset);
        const end = Math.min(length, offset + limit);

        return array.slice(start, end);
    }
}

export default PricingGroupService