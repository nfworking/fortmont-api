import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { ThemeToggle } from "@/components/theme-toggle"
import {NotificationPanel} from "@/components/notificationUi"
import { NavUser } from "@/components/nav-user"
import { CommandDemo } from "@/components/dashboard_res/command"

type SiteHeaderProps = {
  title?: string
}

export function SiteHeader({ title = "LXC and registry information" }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b">
  <div className="flex w-full items-center px-4 lg:px-6">

    {/* Left */}
    <div className="flex items-center gap-2">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mx-2 data-[orientation=vertical]:h-4"
      />
      <h1 className="text-base font-medium">{title}</h1>
    </div>

    {/* Center */}
    <div className="flex-1 flex justify-center">
      <CommandDemo />
    </div>

    {/* Right */}
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <NotificationPanel />
      <NavUser />
    </div>

  </div>
</header>
  )
}
