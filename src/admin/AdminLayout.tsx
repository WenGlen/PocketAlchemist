import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: '任務總覽', icon: '📋', end: true },
  { to: '/admin/maps', label: '地圖任務綁定', icon: '🗺️', end: false },
  { to: '/admin/sync', label: '同步到 Sheet', icon: '📤', end: false },
];

function NavItem({
  to, label, icon, end, onClick,
}: { to: string; label: string; icon: string; end: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      {label}
    </NavLink>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeOnNav = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚗️</span>
            <div>
              <p className="text-sm font-bold text-gray-900">PA 後台</p>
              <p className="text-xs text-gray-400">任務設定管理</p>
            </div>
          </div>
          {/* 手機版關閉按鈕 */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeOnNav} />
        ))}
      </nav>

      {/* Back to game */}
      <div className="border-t border-gray-100 p-3">
        <Link
          to="/"
          onClick={closeOnNav}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <span>🎮</span>
          回到遊戲
        </Link>
      </div>
    </>
  );

  return (
    <div className="admin-selectable flex min-h-screen bg-gray-50">
      {/* ── 手機版遮罩 ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar（桌面常駐 / 手機滑出） ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-gray-200 bg-white transition-transform duration-200
          md:static md:translate-x-0 md:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 手機頂部導覽列 */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="開啟選單"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            {/* 漢堡 icon */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="4" width="16" height="2" rx="1" />
              <rect x="2" y="9" width="16" height="2" rx="1" />
              <rect x="2" y="14" width="16" height="2" rx="1" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">⚗️ PA 後台</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
