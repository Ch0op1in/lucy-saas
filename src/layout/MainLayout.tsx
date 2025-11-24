import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Moon, PlusCircle, Settings, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-provider'
import type { FC } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', exact: true },
  { label: 'Paramètres', icon: Settings, href: '/settings' },
]

export const MainLayout: FC = () => {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar collapsible="icon">
          <SidebarHeader className="px-4 py-6">
            <p className="text-sm font-semibold tracking-tight text-muted-foreground">
              Lucy AI
            </p>
            <h1 className="text-xl font-bold">Votre portefeuille</h1>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.href
                      : location.pathname.startsWith(item.href)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.href} className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 py-6">
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm">
              <p className="font-medium">Version beta</p>
              <Button size="sm" variant="secondary">
                Rejoindre Discord
              </Button>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-2 border-b bg-background px-6 py-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Lucy AI</h2>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sun
                  className={cn(
                    'size-4 transition-colors',
                    theme === 'light' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <Switch
                  aria-label="Basculer en mode sombre"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon
                  className={cn(
                    'size-4 transition-colors',
                    theme === 'dark' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer bg-green-500 text-white hover:bg-green-600 hover:text-white">
                <PlusCircle className="size-4" />
                Ajouter un actif
              </Button>
            </div>
          </header>
          <div className="flex-1 px-6 py-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}