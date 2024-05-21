# Medusa Pricing Groups

## What is it?

Medusa Pricing Groups is a plugin for the [Medusa](https://medusajs.com/) headless commerce system that enables one to group products together
for the purposes of price calculation.

## Quick Start

1. Install the plugin by running `npm i -S medusa-products-pricing-groups`.
2. Add the following to `medusa-config.js` to the `plugins` array:
    ```javascript
    {
        resolve: `medusa-products-pricing-groups`,
        options: {
            enableUI: true
        }
    }
   ```
3. Run `npx medusa migrations run`
4. Start the medusa backend

Once installed, you will see a new entry , `Pricing Groups` in the sidebar. From here you can create pricing groups, 
add and remove products (click on the newly created group to manage the products).

The plugin will also add an [admin widget](https://docs.medusajs.com/admin/widgets) to the product details view. This 
widget will show which pricing groups a product is currently associated with.

## What problem does it solve?

Out of the box, Medusa has the capability of creating prices for variants of a product in multiple currencies, at 
multiple different levels, through the use of `min_quantity` & `max_quantity` (only possible via API requests currently,  
fingers crossed it appears in the dashboard UI soon).

Pricing flexibility is further enabled by [price lists](https://docs.medusajs.com/modules/price-lists), which allow one
to set custom prices depending on the audience.

The problem arises when one has a set of products that when purchased together should each contribute towards the
volume discounts of the other products in the cart.

## Use Case & Example

### Criteria

Let's say we have 10 different t-shirts, in varying colours and sizes. 

We have a storefront, which retail customers can access and purchase from. We also have two other audiences 
that will be using the storefront; small quantity resellers, and high volume resellers. 

Each of these audiences have their own terms and price lists respectively.

Each variant of t-shirt has volume price breaks. 

Each t-shirt variant can have different prices.

For the sake of the example we will assume the following prices apply: 

For retail customers:

- 1-3 t-shirts: **20**
- 3+ t-shirts: **18**

For the small quantity & high volume reseller audiences:

- 1-5 t-shirts: **20**
- 5-10 t-shirts: **15**
- 10+ shirts: **12**

All t-shirts cost the same in the example, though in practice the prices can differ, and be set as normal.

### Requirements

What we are looking to achieve is the following criteria:

- Each product variant can have its prices set independently in all supported currencies
- Products can easily be grouped and ungrouped
- Products can have different volume breakpoints (i.e. `min_quantity`/`max_quantity` thresholds can differ between grouped products)
- Any applicable volume discounts should be automatically applied
- If multiple discounts are available for a set of products in the cart the best discount should be chosen.

### The Example

We have our example case & criteria set out above.

The following are the expected cart totals:

- A retail customer adds `1 x red` & `1 x blue` to their cart. 
  - Pricing tier: `1-3 t-shirts`
  - Cart total: **40** (20 + 20)
- A retail customer adds `1 x red`, `1 x green` & `2 x purple` to their cart. 
  - Pricing tier: `3+ t-shirts`
  - Cart total: **72** (18 + 18 + 36)
- A small reseller adds `1 x red`, `1 x green` & `2 x purple` to their cart.
  - Pricing tier: `1-5 t-shirts`
  - Cart total: **80** (20 + 20 + 40)
- A small reseller adds `4 x blue`, `4 x green`, `3 x purple` to their cart.
  - Pricing tier: `10+ t-shirts`
  - Cart total: **132** (48 + 48 + 36)

The problem can be partially solved with promotional codes, though this becomes a complexity nightmare, in terms of 
tracking active codes, calculating fixed/percentage discounts, monitoring edge cases, and so on. It quickly becomes
impossible to achieve pricing structures due to the rigidity of fixed/percentage discounts, whilst also being a
poor user experience in terms of the user having to choose & manually apply one of potentially many codes.

## How this plugin solves it

The concept of a _pricing group_ is introduced. A pricing group is a very simple structure, comprised of an identifier 
and a name, along with a set of products tagged with the identifier.

The plugin implements a pricing group [service](https://docs.medusajs.com/development/services/overview) that retrieves 
these linkages between the pricing group and products.

The plugin implements a pricing [strategy](https://docs.medusajs.com/development/strategies/overview) that calculates
and returns the best price for the variant in question.

In simple terms we do the following:

1. Retrieve all variants in the cart.
2. Iterate all variants, and retrieve associated groups for each variant.
3. Create a map of `Variant ID => [Group IDs]`
4. Create a map of `Group ID => Calculated Quantity`
5. Iterate variants in cart, increment `Calculated Quantity` for each `Group ID` associated with current `Variant ID` by `Variant Quantity`
6. Use `Calculated Quantity` to retrieve the `Best Price` available.
7. Calculate line item total as `Variant Quantity x Best Price`.

N.B. If the cart is undefined for the request, we fall back to retrieving the price for the variant as if it were a 
standalone product rather than a grouped one.

## Development Notes

When developing the package, attempting to run this plugin on a medusa backend will cause issues if you install 
`@medusajs/medusa` into the `node_modules` folder of the plugin directory, due to dependency conflicts with the medusa 
backend.

To workaround this:

1. `cd` into `node_modules/@medusajs/medusa` from the root of the medusa backend directory, and run 
`yarn link`.
2. `cd` into the plugin directory, then run `yarn link @medusajs/medusa`. The plugin will now build using the `@medusajs/medusa` dependency from the backend.
3. Run `yarn link` in the root of the plugin directory.
4. `cd` into the backend directory again, and run `yarn link medusa-products-pricing-groups`.
5. You can now run `yarn dev` to start the backend, make some changes to the plugin, and run `yarn build` in the plugin directory to see the changes live reloaded on the backend dashboard UI.

### Afterthought / Disclaimer

I am fully aware the code quality isn't perfect as things currently stand - this was somewhat of a proof-of-concept 
project to familiarise myself with Medusa and see if it would suit our needs.

_There may be bugs, I haven't fully tested this plugin in production._

Also, the data table elements were lifted from the core admin dashboard and modified, as they more or less suited my needs
and I wasn't about to write them from scratch.