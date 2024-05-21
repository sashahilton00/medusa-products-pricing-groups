import { Tooltip } from "@medusajs/ui"

import { PlaceholderCell } from "../../common/placeholder-cell"
import {SalesChannel} from "@medusajs/medusa";

type SalesChannelsCellProps = {
  salesChannels?: SalesChannel[] | null
}

export const SalesChannelsCell = ({
  salesChannels,
}: SalesChannelsCellProps) => {

  if (!salesChannels || !salesChannels.length) {
    return <PlaceholderCell />
  }

  if (salesChannels.length > 2) {
    return (
      <div className="flex h-full w-full items-center gap-x-1 overflow-hidden">
        <span className="truncate">
          {salesChannels
            .slice(0, 2)
            .map((sc) => sc.name)
            .join(", ")}
        </span>
        <Tooltip
          content={
            <ul>
              {salesChannels.slice(2).map((sc) => (
                <li key={sc.id}>{sc.name}</li>
              ))}
            </ul>
          }
        >
          <span className="text-xs">
              {`plus ${salesChannels.length - 2} more`}
          </span>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">
        {salesChannels.map((sc) => sc.name).join(", ")}
      </span>
    </div>
  )
}

export const SalesChannelHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span>Sales Channels</span>
    </div>
  )
}
