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
  Activity,
  Search,
  HelpCircle,
  Menu,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { name: 'プロジェクト', icon: Box, path: '/projects' },
    { name: '履歴・ロールバック', icon: History, path: '/history', disabled: true },
    { name: 'モニタリング', icon: Activity, path: '/monitoring', disabled: true },
    { name: '設定', icon: Settings, path: '/settings', disabled: true },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-[#3c4043] font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r border-[#dadce0]">
        <div className="h-16 flex items-center px-6">
          <Menu className="mr-4 text-gray-500 cursor-pointer" size={20} />
          <h1 className="text-xl font-medium text-[#5f6368] tracking-tight">Launchs</h1>
        </div>
        
        <div className="p-4">
          <button className="flex items-center space-x-3 px-4 py-3 bg-white border border-[#dadce0] rounded-full shadow-sm hover:shadow-md transition-shadow text-sm font-medium mb-6">
            <Plus className="text-[#1a73e8]" size={24} />
            <span>作成</span>
          </button>
        </div>

        <nav className="flex-1 pr-4 space-y-1">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={cn(
                "flex items-center justify-between py-3 pl-6 pr-2 transition-colors text-sm font-medium relative group",
                location.pathname === item.path && !item.disabled
                  ? "sidebar-item-active" 
                  : "text-[#5f6368] hover:bg-gray-100 rounded-r-full",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center space-x-4">
                <item.icon size={20} className={(location.pathname === item.path && !item.disabled) ? "text-[#1a73e8]" : "text-gray-500"} />
                {!item.disabled ? (
                  <Link to={item.path} className="stretched-link">{item.name}</Link>
                ) : (
                  <span>{item.name}</span>
                )}
              </div>
              {item.disabled && (
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Soon</span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#dadce0] text-[11px] text-gray-500 flex justify-between">
          <span>プライバシー • 利用規約</span>
          <span>ヘルプ</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[#dadce0] flex items-center justify-between px-8 z-10">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="リソース、ドキュメントを検索" 
                className="w-full pl-12 pr-4 py-2 bg-[#f1f3f4] border-transparent rounded-lg focus:bg-white focus:ring-0 focus:border-transparent focus:shadow-md transition-all text-sm outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-8">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle size={22} />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-not-allowed opacity-50">
              <Settings size={22} />
            </button>
            <div className="h-8 w-8 bg-[#1a73e8] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer">
              A
            </div>
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
