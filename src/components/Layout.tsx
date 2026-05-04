import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { name: 'プロジェクト', icon: Box, path: '/projects' },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#f1f5f9] font-sans">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-[#1e293b] border-r border-[#334155]">
        <div className="h-16 flex items-center px-6 border-b border-[#334155]">
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#0ea5e9] to-[#10b981] bg-clip-text text-transparent tracking-tight">
            Launchs
          </h1>
        </div>

        <nav className="flex-1 space-y-1 py-6 px-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 py-3 px-4 rounded-lg transition-all text-sm font-medium",
                location.pathname === item.path
                  ? "sidebar-item-active bg-[#0ea5e9]/10 text-[#0ea5e9]"
                  : "text-[#cbd5e1] hover:bg-[#334155] hover:text-[#f1f5f9]"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#334155] text-[11px] text-[#94a3b8]">
          <p>© 2024 Launchs</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-[#1e293b] border-b border-[#334155] flex items-center px-8 z-10">
          <h2 className="text-sm font-semibold text-[#cbd5e1]">
            {location.pathname === '/'
              ? 'ダッシュボード'
              : location.pathname === '/projects'
              ? 'プロジェクト'
              : 'Launchs'}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
