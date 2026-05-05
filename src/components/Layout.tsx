import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Initial width larger as requested
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Automatically collapse sidebar on project detail pages
  useEffect(() => {
    if (location.pathname.startsWith('/projects/') && location.pathname.split('/').length > 2) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 160 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        if (newWidth < 180) {
          setIsCollapsed(true);
        } else if (isCollapsed && newWidth >= 180) {
          setIsCollapsed(false);
        }
      }
    }
  }, [isResizing, isCollapsed]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { name: 'プロジェクト', icon: Box, path: '/projects' },
  ];

  // Try to find if there's any contextual menu (e.g. for a container)
  const isContainerPage = location.pathname.startsWith('/containers/');
  const containerId = isContainerPage ? location.pathname.split('/')[2] : null;

  return (
    <div className="flex h-screen bg-[#1a1b2e] text-[#e5e7eb] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "relative flex flex-col bg-[#252742] border-r border-[#404556] z-30",
          isResizing ? "transition-none" : "transition-all duration-300 ease-in-out"
        )}
        style={{ width: isCollapsed ? 80 : sidebarWidth }}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#404556] flex-shrink-0">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent tracking-tight whitespace-nowrap overflow-hidden">
              Launchs
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-[#3a3d52] rounded-lg text-[#9ca3af] transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 overflow-y-auto overflow-x-hidden space-y-8">
          <div className="space-y-2">
            {!isCollapsed && <p className="px-4 text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Main</p>}
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 py-3 px-4 rounded-lg transition-all text-sm font-medium",
                  location.pathname === item.path
                    ? "sidebar-item-active bg-[#6366f1]/10 text-[#6366f1]"
                    : "text-[#9ca3af] hover:bg-[#3a3d52]",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            ))}
          </div>

          {/* Contextual Menu Section - for Containers */}
          {isContainerPage && !isCollapsed && (
            <div className="space-y-4 pt-4 border-t border-[#404556]/50">
              <p className="px-4 text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Container Management</p>
              
              <div className="space-y-1">
                 {/* This will be handled by the page itself or we can hardcode common ones */}
                 <div className="px-4 py-2 text-xs text-[#6366f1] font-medium bg-[#6366f1]/5 rounded-lg border border-[#6366f1]/20 mb-4">
                    Active: {containerId?.slice(0,8)}
                 </div>
              </div>
            </div>
          )}
        </nav>

        <div className={cn(
          "p-4 border-t border-[#404556] text-[11px] text-[#9ca3af] flex-shrink-0",
          isCollapsed && "text-center"
        )}>
          {isCollapsed ? <p>©</p> : <p className="truncate">© 2024 Launchs</p>}
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#6366f1]/50 transition-colors"
          />
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {!location.pathname.startsWith('/projects/') || location.pathname.split('/').length <= 2 ? (
          <header className="h-16 bg-[#252742] border-b border-[#404556] flex items-center px-8 z-10 flex-shrink-0">
            <h2 className="text-lg font-medium text-[#e5e7eb]">
              {location.pathname === '/'
                ? 'ダッシュボード'
                : location.pathname === '/projects'
                ? 'プロジェクト'
                : 'Launchs'}
            </h2>
          </header>
        ) : null}

        <div className={cn(
          "flex-1 overflow-auto",
          (location.pathname.startsWith('/projects/') && location.pathname.split('/').length > 2) ? "p-0" : "p-8"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;


