import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  History, 
  Settings, 
  ChevronRight, 
  Plus,
  Terminal,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Projects', icon: Box, path: '/projects' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Monitoring', icon: Activity, path: '/monitoring' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-white text-black font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-black flex flex-col">
        <div className="p-6 border-b border-black">
          <h1 className="text-2xl font-black tracking-tighter italic">LAUNCHS.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-none transition-all duration-200",
                location.pathname === item.path 
                  ? "bg-black text-white" 
                  : "hover:bg-gray-100"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
              {location.pathname === item.path && <ChevronRight size={16} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-black bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full" />
            <div>
              <p className="text-xs font-bold">Admin User</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-black flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Home</span>
            {location.pathname !== '/' && (
              <>
                <ChevronRight size={14} />
                <span className="text-black font-bold capitalize">
                  {location.pathname.split('/')[1]}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Plus size={20} />
            </button>
            <div className="h-4 w-[1px] bg-gray-300" />
            <button className="flex items-center space-x-2 px-3 py-1 bg-black text-white text-xs font-bold rounded-none hover:bg-gray-800 transition-colors">
              <Terminal size={14} />
              <span>CLI</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
