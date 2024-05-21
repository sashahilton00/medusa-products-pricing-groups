import {
    AbstractPriceSelectionStrategy, Logger,
    PriceSelectionContext,
    PriceSelectionResult,
    PriceType,
} from "@medusajs/medusa"

import { PricingGroup } from "../models/pricing-group";
import { ProductVariant } from "@medusajs/medusa";

import { ICacheService } from "@medusajs/types"
import { FlagRouter, promiseAll } from "@medusajs/utils"
import { isDefined } from "medusa-core-utils"
import {EntityManager, In} from "typeorm"
import TaxInclusivePricingFeatureFlag from "@medusajs/medusa/dist/loaders/feature-flags/tax-inclusive-pricing"
import { MoneyAmountRepository } from "@medusajs/medusa/dist/repositories/money-amount"
import { TaxServiceRate } from "@medusajs/medusa/dist/types/tax-service"

class PriceSelectionStrategy extends AbstractPriceSelectionStrategy {
    protected manager_: EntityManager
    protected readonly featureFlagRouter_: FlagRouter
    protected moneyAmountRepository_: typeof MoneyAmountRepository

    protected cacheService_: ICacheService
    protected logger_: Logger
    constructor({
        manager,
        featureFlagRouter,
        moneyAmountRepository,
        cacheService,
        logger,
    }) {
        // @ts-ignore
        // eslint-disable-next-line prefer-rest-params
        super(...arguments)
        this.manager_ = manager
        this.moneyAmountRepository_ = moneyAmountRepository
        this.featureFlagRouter_ = featureFlagRouter
        this.cacheService_ = cacheService
        this.logger_ = logger
    }

    async calculateVariantPrice(
        data: {
            variantId: string
            quantity?: number
        }[],
        context: PriceSelectionContext
    ): Promise<Map<string, PriceSelectionResult>> {
        const dataMap = new Map(data.map((d) => [d.variantId, d]))

        const cacheKeysMap = new Map(
            data.map(({ variantId, quantity }) => [
                variantId,
                this.getCacheKey(variantId, { ...context, quantity }),
            ])
        )

        const nonCachedData: {
            variantId: string
            quantity?: number
        }[] = []

        const variantPricesMap = new Map<string, PriceSelectionResult>()

        if (!context.ignore_cache) {
            const cacheHits = await promiseAll(
                [...cacheKeysMap].map(async ([, cacheKey]) => {
                    return await this.cacheService_.get<PriceSelectionResult>(cacheKey)
                })
            )

            if (!cacheHits.length) {
                nonCachedData.push(...dataMap.values())
            }

            for (const [index, cacheHit] of cacheHits.entries()) {
                const variantId = data[index].variantId
                if (cacheHit) {
                    variantPricesMap.set(variantId, cacheHit)
                    continue
                }

                nonCachedData.push(dataMap.get(variantId)!)
            }
        } else {
            nonCachedData.push(...dataMap.values())
        }

        let results: Map<string, PriceSelectionResult> = new Map()

        if (
            this.featureFlagRouter_.isFeatureEnabled(
                TaxInclusivePricingFeatureFlag.key
            )
        ) {
            this.logger_.debug('calculating using custom strategy (new)')
            results = await this.calculateVariantPrice_new(nonCachedData, context)
        } else {
            this.logger_.debug('calculating using custom strategy (old)')
            results = await this.calculateVariantPrice_old(nonCachedData, context)
        }

        await promiseAll(
            [...results].map(async ([variantId, prices]) => {
                variantPricesMap.set(variantId, prices)
                // need to avoid caching due to variable nature of prices when products are grouped
                // if (!context.ignore_cache) {
                //     await this.cacheService_.set(cacheKeysMap.get(variantId)!, prices)
                // }
            })
        )

        return variantPricesMap
    }


    private async getPricingGroupsForVariants(
        data: {
            variantId: string
        }[]
    ): Promise<Map<string, string[]>> {
        const pricingGroupRepo = this.manager_.getRepository(PricingGroup)
        const productVariantRepo = this.manager_.getRepository(ProductVariant)

        const variants = await productVariantRepo.find({
            relations: {
                product: true
            },
            where: {
                id: In(data.map(val => val.variantId))
            }
        })

        if (!variants) {
            return null
        }

        const products = variants.map(v => v.product)

        let pricingGroups = new Array<PricingGroup>()

        // query would otherwise fail if product length is zero
        if (products.length > 0) {
            // queries for pricing groups that are associated with the product IDs of the variants
            const pricingGroupQuery = pricingGroupRepo
                .createQueryBuilder("pricing_group")
                // .distinctOn(["pricing_group.id"])
                .leftJoin('pricing_group.products', "product")
                .leftJoinAndSelect("pricing_group.products", "productSelect")
                .where("product.id IN (:...ids)", { ids: products.map(p => p.id) })

            pricingGroups = await pricingGroupQuery.getMany()
        }

        for (const pg of pricingGroups) {
            this.logger_.debug(`pricing group: ${pg}`)
        }

        if (!pricingGroups) {
            return null
        }

        // create a map of product IDs => group IDs. Initialise with just the product IDs from the provided variants
        // create a map of group IDs => calculated quantity
        // select group with highest calculated quantity for price calculation for given variant

        let productPricingGroupMap = new Map<string, string[]>()
        for (const product of products) {
            productPricingGroupMap[product.id] = []
        }

        for (const group of pricingGroups) {
            // associate pricing group with given products
            for (const product of group.products) {
                if (product.id in productPricingGroupMap) {
                    productPricingGroupMap[product.id].push(group.id)
                }
            }
        }

        // maps variant ID => pricing groups
        let variantsGroupMap = new Map<string, string[]>()
        for (const variant of variants) {
            if (variant.product_id in productPricingGroupMap) {
                variantsGroupMap[variant.id] = productPricingGroupMap[variant.product_id]
            }
        }

        return variantsGroupMap
    }

    private async calculateVariantPrice_new(
        data: {
            variantId: string
            quantity?: number
        }[],
        context: PriceSelectionContext
    ): Promise<Map<string, PriceSelectionResult>> {
        const moneyRepo = this.activeManager_.withRepository(
            this.moneyAmountRepository_
        )

        const [variantsPrices] = await moneyRepo.findManyForVariantsInRegion(
            data.map((d) => d.variantId),
            context.region_id,
            context.currency_code,
            context.customer_id,
            context.include_discount_prices,
            true
        )

        // retrieves a map of variant ID => pricing groups
        const variantPricingGroups= await this.getPricingGroupsForVariants(data)
        for await (const [k, v] of variantPricingGroups) {
            this.logger_.debug(`variant group map entry, variant ID: ${k}, group IDs: ${v}`)
        }

        let pricingGroupCalculatedQuantities = new Map<string, number>()

        for await (const item of data) {
            if (item.variantId in variantPricingGroups) {
                for (const groupId of variantPricingGroups[item.variantId]) {
                    // initialise quantity to zero if not already present
                    pricingGroupCalculatedQuantities[groupId] = groupId in pricingGroupCalculatedQuantities ? pricingGroupCalculatedQuantities[groupId] : 0
                    // update each groups calculated quantity with the variant quantity
                    pricingGroupCalculatedQuantities[groupId] += item.quantity
                }
            }
        }

        for await (const [k, v] of pricingGroupCalculatedQuantities) {
            this.logger_.debug(`pricing group calculated quantity, group ID: ${k}, quantity: ${v}`)
        }

        const variantPricesMap = new Map<string, PriceSelectionResult>()

        for (const [variantId, prices] of Object.entries(variantsPrices)) {
            const dataItem = data.find((d) => d.variantId === variantId)!

            // initialise calculation quantity with base variant quantity
            let priceCalculationQuantity = dataItem.quantity

            if (variantId in variantPricingGroups) {
                for await (const groupId of variantPricingGroups[variantId]) {
                    if (groupId in pricingGroupCalculatedQuantities) {
                        // if a group calculated quantity is greater than the base quantity we use that to select the price
                        // this is what allows for volume breaks across products
                        priceCalculationQuantity = pricingGroupCalculatedQuantities[groupId] > priceCalculationQuantity ? pricingGroupCalculatedQuantities[groupId] : priceCalculationQuantity
                    }
                }
            }

            const result: PriceSelectionResult = {
                originalPrice: null,
                calculatedPrice: null,
                prices,
                originalPriceIncludesTax: null,
                calculatedPriceIncludesTax: null,
            }

            if (!prices.length || !context) {
                variantPricesMap.set(variantId, result)
            }

            const taxRate = context.tax_rates?.reduce(
                (accRate: number, nextTaxRate: TaxServiceRate) => {
                    return accRate + (nextTaxRate.rate || 0) / 100
                },
                0
            )

            for (const ma of prices) {
                let isTaxInclusive = ma.currency?.includes_tax || false

                if (ma.price_list?.includes_tax) {
                    // PriceList specific price so use the PriceList tax setting
                    isTaxInclusive = ma.price_list.includes_tax
                } else if (ma.region?.includes_tax) {
                    // Region specific price so use the Region tax setting
                    isTaxInclusive = ma.region.includes_tax
                }

                delete ma.currency
                delete ma.region

                if (
                    context.region_id &&
                    ma.region_id === context.region_id &&
                    ma.price_list_id === null &&
                    ma.min_quantity === null &&
                    ma.max_quantity === null
                ) {
                    result.originalPriceIncludesTax = isTaxInclusive
                    result.originalPrice = ma.amount
                }

                if (
                    context.currency_code &&
                    ma.currency_code === context.currency_code &&
                    ma.price_list_id === null &&
                    ma.min_quantity === null &&
                    ma.max_quantity === null &&
                    result.originalPrice === null // region prices take precedence
                ) {
                    result.originalPriceIncludesTax = isTaxInclusive
                    result.originalPrice = ma.amount
                }

                if (
                    isValidQuantity(ma, priceCalculationQuantity) &&
                    isValidAmount(ma.amount, result, isTaxInclusive, taxRate) &&
                    ((context.currency_code &&
                            ma.currency_code === context.currency_code) ||
                        (context.region_id && ma.region_id === context.region_id))
                ) {
                    result.calculatedPrice = ma.amount
                    result.calculatedPriceType = ma.price_list?.type || PriceType.DEFAULT
                    result.calculatedPriceIncludesTax = isTaxInclusive
                }
            }

            this.logger_.debug(`variant ID: ${variantId}, calculation quantity: ${priceCalculationQuantity}, calculated price: ${result.calculatedPrice}, original price: ${result.originalPrice}`)

            variantPricesMap.set(variantId, result)
        }

        return variantPricesMap
    }

    private async calculateVariantPrice_old(
        data: {
            variantId: string
            quantity?: number
        }[],
        context: PriceSelectionContext
    ): Promise<Map<string, PriceSelectionResult>> {
        const moneyRepo = this.activeManager_.withRepository(
            this.moneyAmountRepository_
        )

        const [variantsPrices] = await moneyRepo.findManyForVariantsInRegion(
            data.map((d) => d.variantId),
            context.region_id,
            context.currency_code,
            context.customer_id,
            context.include_discount_prices
        )

        // retrieves a map of variant ID => pricing groups
        const variantPricingGroups = await this.getPricingGroupsForVariants(data)
        for await (const [k, v] of variantPricingGroups) {
            this.logger_.debug(`variant group map entry, variant ID: ${k}, group IDs: ${v}`)
        }

        let pricingGroupCalculatedQuantities = new Map<string, number>()

        for await (const item of data) {
            if (item.variantId in variantPricingGroups) {
                for (const groupId of variantPricingGroups[item.variantId]) {
                    // initialise quantity to zero if not already present
                    pricingGroupCalculatedQuantities[groupId] = groupId in pricingGroupCalculatedQuantities ? pricingGroupCalculatedQuantities[groupId] : 0
                    // update each groups calculated quantity with the variant quantity
                    pricingGroupCalculatedQuantities[groupId] += item.quantity
                }
            }
        }

        for await (const [k, v] of pricingGroupCalculatedQuantities) {
            this.logger_.debug(`pricing group calculated quantity, group ID: ${k}, quantity: ${v}`)
        }

        const variantPricesMap = new Map<string, PriceSelectionResult>()

        for await (const [variantId, prices] of Object.entries(variantsPrices)) {
            const dataItem = data.find((d) => d.variantId === variantId)!

            // initialise calculation quantity with base variant quantity
            let priceCalculationQuantity = dataItem.quantity

            if (variantId in variantPricingGroups) {
                for await (const groupId of variantPricingGroups[variantId]) {
                    if (groupId in pricingGroupCalculatedQuantities) {
                        // if a group calculated quantity is greater than the base quantity we use that to select the price
                        // this is what allows for volume breaks across products
                        priceCalculationQuantity = pricingGroupCalculatedQuantities[groupId] > priceCalculationQuantity ? pricingGroupCalculatedQuantities[groupId] : priceCalculationQuantity
                    }
                }
            }

            const result: PriceSelectionResult = {
                originalPrice: null,
                calculatedPrice: null,
                prices,
            }

            if (!prices.length || !context) {
                variantPricesMap.set(variantId, result)
            }

            for (const ma of prices) {
                delete ma.currency
                delete ma.region

                if (
                    context.region_id &&
                    ma.region_id === context.region_id &&
                    ma.price_list_id === null &&
                    ma.min_quantity === null &&
                    ma.max_quantity === null
                ) {
                    result.originalPrice = ma.amount
                }

                if (
                    context.currency_code &&
                    ma.currency_code === context.currency_code &&
                    ma.price_list_id === null &&
                    ma.min_quantity === null &&
                    ma.max_quantity === null &&
                    result.originalPrice === null // region prices take precedence
                ) {
                    result.originalPrice = ma.amount
                }

                if (
                    isValidQuantity(ma, priceCalculationQuantity) &&
                    (result.calculatedPrice === null ||
                        ma.amount < result.calculatedPrice) &&
                    ((context.currency_code &&
                            ma.currency_code === context.currency_code) ||
                        (context.region_id && ma.region_id === context.region_id))
                ) {
                    result.calculatedPrice = ma.amount
                    result.calculatedPriceType = ma.price_list?.type || PriceType.DEFAULT
                }
            }

            this.logger_.debug(`variant ID: ${variantId}, calculation quantity: ${priceCalculationQuantity}, calculated price: ${result.calculatedPrice}, original price: ${result.originalPrice}`)

            variantPricesMap.set(variantId, result)
        }

        return variantPricesMap
    }

    public async onVariantsPricesUpdate(variantIds: string[]): Promise<void> {
        await promiseAll(
            variantIds.map(
                async (id: string) => await this.cacheService_.invalidate(`ps:${id}:*`)
            )
        )
    }

    private getCacheKey(
        variantId: string,
        context: PriceSelectionContext
    ): string {
        const taxRate =
            context.tax_rates?.reduce(
                (accRate: number, nextTaxRate: TaxServiceRate) => {
                    return accRate + (nextTaxRate.rate || 0) / 100
                },
                0
            ) || 0

        return `ps:${variantId}:${context.region_id}:${context.currency_code}:${context.customer_id}:${context.quantity}:${context.include_discount_prices}:${taxRate}`
    }
}

const isValidAmount = (
    amount: number,
    result: PriceSelectionResult,
    isTaxInclusive: boolean,
    taxRate?: number
): boolean => {
    if (result.calculatedPrice === null) {
        return true
    }

    if (isTaxInclusive === result.calculatedPriceIncludesTax) {
        // if both or neither are tax inclusive compare equally
        return amount < result.calculatedPrice
    }

    if (typeof taxRate !== "undefined") {
        return isTaxInclusive
            ? amount < (1 + taxRate) * result.calculatedPrice
            : (1 + taxRate) * amount < result.calculatedPrice
    }

    // if we dont have a taxrate we can't compare mixed prices
    return false
}

const isValidQuantity = (price, quantity?: number): boolean =>
    (isDefined(quantity) && isValidPriceWithQuantity(price, quantity)) ||
    (typeof quantity === "undefined" && isValidPriceWithoutQuantity(price))

const isValidPriceWithoutQuantity = (price): boolean =>
    (!price.max_quantity && !price.min_quantity) ||
    ((!price.min_quantity || price.min_quantity === 0) && price.max_quantity)

const isValidPriceWithQuantity = (price, quantity): boolean =>
    (!price.min_quantity || price.min_quantity <= quantity) &&
    (!price.max_quantity || price.max_quantity >= quantity)

export default PriceSelectionStrategy
