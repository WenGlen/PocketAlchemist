import { NavLink, Outlet, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: '任務總覽', icon: '📋', end: true },
  { to: '/admin/maps', label: '地圖任務綁定', icon: '🗺️', end: false },
];

function NavItem({ to, label, icon, end }: { to: string; label: string; icon: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
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
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚗️</span>
            <div>
              <p className="text-sm font-bold text-gray-900">PA 後台</p>
              <p className="text-xs text-gray-400">任務設定管理</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Back to game */}
        <div className="absolute bottom-0 w-56 border-t border-gray-100 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <span>🎮</span>
            回到遊戲
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
