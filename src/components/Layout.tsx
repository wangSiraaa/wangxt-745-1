import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, roleNames } from '@/store/authStore';
import {
  FileText,
  ClipboardCheck,
  Truck,
  Award,
  Package,
  AlertTriangle,
  LogOut,
  Home,
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '首页', icon: Home, roles: ['declarant', 'inspector', 'driver', 'reviewer'] },
  { path: '/declarations', label: '检疫申报', icon: FileText, roles: ['declarant', 'inspector'] },
  { path: '/batches', label: '猪群批次', icon: Package, roles: ['declarant', 'inspector'] },
  { path: '/vehicles', label: '运输车辆', icon: Truck, roles: ['declarant', 'driver', 'inspector'] },
  { path: '/certificates', label: '检疫出证', icon: Award, roles: ['inspector'] },
  { path: '/receipts', label: '到场签收', icon: ClipboardCheck, roles: ['driver', 'inspector'] },
  { path: '/reviews', label: '异常复核', icon: AlertTriangle, roles: ['reviewer', 'inspector'] },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  declared: { label: '已申报', color: 'bg-blue-100 text-blue-700' },
  immune_checked: { label: '免疫校验通过', color: 'bg-green-100 text-green-700' },
  vehicle_bound: { label: '车辆已绑定', color: 'bg-purple-100 text-purple-700' },
  certificate_issued: { label: '已出证', color: 'bg-emerald-100 text-emerald-700' },
  in_transit: { label: '运输中', color: 'bg-orange-100 text-orange-700' },
  received: { label: '已签收', color: 'bg-teal-100 text-teal-700' },
  exception: { label: '异常', color: 'bg-red-100 text-red-700' },
  reviewed: { label: '已复核', color: 'bg-gray-100 text-gray-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const info = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenu = menuItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-green-700">生猪产地检疫</h1>
          <p className="text-sm text-gray-500 mt-1">申报管理系统</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500">{user && roleNames[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
