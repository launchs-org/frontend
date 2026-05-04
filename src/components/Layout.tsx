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
    <div className="flex h-screen bg-[#f8f9fa] text-[#202124] font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r border-[#dadce0]">
        <div className="h-16 flex items-center px-6 border-b border-[#dadce0]">
          <h1 className="text-xl font-bold text-[#1a73e8] tracking-tight">Launchs</h1>
        </div>

        <nav className="flex-1 space-y-1 py-6 px-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 py-3 px-4 rounded-r-full transition-all text-sm font-medium",
                location.pathname === item.path
                  ? "sidebar-item-active"
                  : "text-[#5f6368] hover:bg-[#f1f3f4]"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#dadce0] text-[11px] text-[#5f6368]">
          <p>© 2024 Launchs</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[#dadce0] flex items-center px-8 z-10">
          <h2 className="text-lg font-medium text-[#202124]">
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
