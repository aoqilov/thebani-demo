import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LuChevronRight } from 'react-icons/lu'
import { CusBreadCrumb, type BreadCrumbItem } from '@/components/ui/bread-crumb/CusBreadCrumb'
import { useTranslation } from '@/i18n/languageConfig'
import Header from './header/Header'
import Sidebar from './sidebar/Sidebar'

// pathname'ning birinchi segmenti -> sidebar tarjima kaliti
const SECTION_MAP: Record<string, { key: string; parentPath?: string }> = {
  ops: { key: 'ops' },
  warehouse: { key: 'warehouse' },
  live: { key: 'live' },
  'live-monitor': { key: 'liveMonitor' },
  employees: { key: 'employees' },
  employee: { key: 'employees', parentPath: '/employees' },
  attractions: { key: 'attractions' },
  attraction: { key: 'attractions', parentPath: '/attractions' },
  kassa: { key: 'kassa', parentPath: '/kassa' },
  reports: { key: 'reportsKassa' },
  camera: { key: 'camera' },
  marketing: { key: 'marketingNews' },
  'nfc-cards': { key: 'nfcCards' },
  'sos-in': { key: 'kassaSosIn' },
  'activity-log': { key: 'activityLog' },
  'rolekassa-main': { key: 'kassaZReport' },
  'roleoperator-main': { key: 'operatorZReport' },
  'rolebux-main': { key: 'buxZReport' },
  settings: { key: 'settings' },
  support: { key: 'support' },
}

function useBreadcrumbs(): BreadCrumbItem[] {
  const { pathname } = useLocation()
  const { t } = useTranslation('sidebar.')

  if (pathname === '/') return [{ label: t('dashboard') }]

  const [section, id] = pathname.split('/').filter(Boolean)
  const mapped = SECTION_MAP[section]
  const label = mapped ? t(mapped.key) : section
  const items: BreadCrumbItem[] = [{ label: t('dashboard'), to: '/' }]

  if (id && mapped?.parentPath) {
    items.push({ label, to: mapped.parentPath }, { label: `#${id}` })
  } else {
    items.push({ label })
  }
  return items
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  )
}

export default function AppLayout() {
  // Desktop'da (1020px+) sidebar ochiq; undan torida kontent ustidan chiqadigan drawer.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1020)
  const breadcrumbs = useBreadcrumbs()

  return (
    <div className="min-h-screen desktop:flex">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 desktop:hidden" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavClick={() => { if (window.innerWidth < 1020) setSidebarOpen(false) }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main>
          <div className="px-4 py-2 tablet:px-6">
            <CusBreadCrumb items={breadcrumbs} separator={<LuChevronRight size={10} />} />
          </div>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
