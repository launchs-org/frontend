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
    <div className="flex h-screen bg-[#1a1b2e] text-[#e5e7eb] font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-[#252742] border-r border-[#404556]">
        <div className="h-16 flex items-center px-6 border-b border-[#404556]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent tracking-tight">
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
                  ? "sidebar-item-active bg-[#6366f1]/10 text-[#6366f1]"
                  : "text-[#9ca3af] hover:bg-[#3a3d52]"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#404556] text-[11px] text-[#9ca3af]">
          <p>© 2024 Launchs</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#252742] border-b border-[#404556] flex items-center px-8 z-10">
          <h2 className="text-lg font-medium text-[#e5e7eb]">
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
