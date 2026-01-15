"use client"

/**
 * =====================================================================
 * RESIZABLE - PANELS CÓ THỂ THAY ĐỔI KÍCH THƯỚC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Bộ components cho phép tạo layout với các panel có thể kéo thay đổi kích thước.
 * Dùng thư viện react-resizable-panels (đã được wrap lại).
 *
 * 1. CÁC COMPONENTS:
 *    - ResizablePanelGroup: Container chứa các panels
 *      Props: direction="horizontal" | "vertical"
 *
 *    - ResizablePanel: Mỗi panel trong group
 *      Props: defaultSize={50} (% của container)
 *
 *    - ResizableHandle: Thanh kéo giữa 2 panels
 *      Props: withHandle={true} để hiện icon grip
 *
 * 2. VÍ DỤ SỬ DỤNG:
 *    <ResizablePanelGroup direction="horizontal">
 *      <ResizablePanel defaultSize={30}>Sidebar</ResizablePanel>
 *      <ResizableHandle withHandle />
 *      <ResizablePanel defaultSize={70}>Content</ResizablePanel>
 *    </ResizablePanelGroup>
 *
 * 3. USE CASES:
 *    - Page Builder (sidebar + canvas)
 *    - Code editor layouts
 *    - Email client (folders + list + preview)
 *    - Admin dashboards *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import { GripVertical } from "lucide-react"
import * as React from "react"
import {
    Group,
    Panel,
    Separator,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

// Wrapper that translates "direction" to "orientation" for easier use
interface ResizablePanelGroupProps extends Omit<React.ComponentProps<typeof Group>, 'orientation'> {
  direction?: "horizontal" | "vertical"
}

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  ...props
}: ResizablePanelGroupProps) => (
  <Group
    orientation={direction}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
