import { ProductStatus } from "@medusajs/types"

import { StatusCell } from "../../common/status-cell"

type ProductStatusCellProps = {
  status: ProductStatus
}

export const ProductStatusCell = ({ status }: ProductStatusCellProps) => {

  const [color, text] = {
    draft: ["grey", 'Draft'],
    proposed: ["orange", 'Proposed'],
    published: ["green", 'Published'],
    rejected: ["red", 'Rejected'],
  }[status] as ["grey" | "orange" | "green" | "red", string]

  return <StatusCell color={color}>{text}</StatusCell>
}

export const ProductStatusHeader = () => {

  return (
    <div className="flex h-full w-full items-center">
      <span>Status</span>
    </div>
  )
}
