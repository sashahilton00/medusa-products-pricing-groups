import {
    ColumnDef,
    ColumnDefBase,
    createColumnHelper,
} from "@tanstack/react-table"
import { useMemo } from "react"
import {
    DateCell,
    DateHeader,
} from "../../table/table-cells/common/date-cell"
import {
    TextCell,
    TextHeader
} from "../../table/table-cells/common/text-cell";
import {PricingGroup} from "../../../types/api";

// We have to use any here, as the type of Order is so complex that it lags the TS server
const columnHelper = createColumnHelper<PricingGroup>()

type UsePricingGroupTableColumnsProps = {
    exclude?: string[]
}

export const useColumns = (props: UsePricingGroupTableColumnsProps) => {
    const { exclude = [] } = props ?? {}

    const columns = useMemo(
        () => [
            columnHelper.accessor("name", {
                header: () => <TextHeader text="Name" />,
                cell: ({ getValue }) => {
                    const name = getValue()

                    return <TextCell text={name} />
                },
            }),
            columnHelper.accessor("created_at", {
                header: () => <DateHeader text="Created At" />,
                cell: ({ getValue }) => {
                    const date = new Date(getValue())

                    return <DateCell date={date} />
                },
            }),
            columnHelper.accessor("updated_at", {
                header: () => <DateHeader text="Updated At" />,
                cell: ({ getValue }) => {
                    const date = new Date(getValue())

                    return <DateCell date={date} />
                },
            }),
        ],
        []
    )

    const isAccessorColumnDef = (
        c: any
    ): c is ColumnDef<PricingGroup> & { accessorKey: string } => {
        return c.accessorKey !== undefined
    }

    const isDisplayColumnDef = (
        c: any
    ): c is ColumnDef<PricingGroup> & { id: string } => {
        return c.id !== undefined
    }

    const shouldExclude = <TDef extends ColumnDefBase<PricingGroup, any>>(c: TDef) => {
        if (isAccessorColumnDef(c)) {
            return exclude.includes(c.accessorKey)
        } else if (isDisplayColumnDef(c)) {
            return exclude.includes(c.id)
        }

        return false
    }

    return columns.filter((c) => !shouldExclude(c)) as ColumnDef<PricingGroup>[]
}
