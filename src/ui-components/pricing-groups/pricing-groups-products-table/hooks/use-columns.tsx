import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import {
  CollectionCell,
  CollectionHeader,
} from "../../../table/table-cells/product/collection-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../table/table-cells/product/product-status-cell"
import {
  SalesChannelHeader,
  SalesChannelsCell,
} from "../../../table/table-cells/product/sales-channels-cell"
import {GroupProduct} from "../types/product";

const columnHelper = createColumnHelper<GroupProduct>()

export const useProductTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => <ProductCell product={row.original} />,
      }),
      columnHelper.accessor("collection", {
        header: () => <CollectionHeader />,
        cell: ({ row }) => (
          <CollectionCell collection={row.original.collection} />
        ),
      }),
      columnHelper.accessor("sales_channels", {
        header: () => <SalesChannelHeader />,
        cell: ({ row }) => (
          <SalesChannelsCell salesChannels={row.original.sales_channels} />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => <ProductStatusCell status={row.original.status} />,
      }),
    ],
    []
  )
}
