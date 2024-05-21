import { Thumbnail } from "../../../../common/thumbnail"
import {Product} from "@medusajs/medusa";

type ProductCellProps = {
  product: Product
}

export const ProductCell = ({ product }: ProductCellProps) => {
  return (
    <div className="flex h-full w-full items-center gap-x-3 overflow-hidden">
      <div className="w-fit flex-shrink-0">
        <Thumbnail src={product.thumbnail} />
      </div>
      <span className="truncate">{product.title}</span>
    </div>
  )
}

export const ProductHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span>Product</span>
    </div>
  )
}
