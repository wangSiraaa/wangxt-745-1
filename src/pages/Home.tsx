import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, roleNames } from '@/store/authStore';
import { StatusBadge } from '@/components/Layout';
import {
  FileText,
  ClipboardCheck,
  Truck,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    exception: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.declarations.list();
      setDeclarations(result.data.slice(0, 5));
      
      const total = result.data.length;
      const pending = result.data.filter((d: any) => 
        ['declared', 'immune_checked', 'vehicle_bound'].includes(d.current_status)
      ).length;
      const inTransit = result.data.filter((d: any) => d.current_status === 'in_transit').length;
      const exception = result.data.filter((d: any) => d.current_status === 'exception').length;
      
      setStats({ total, pending, inTransit, exception });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          欢迎回来，{user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          当前角色：{user && roleNames[user.role]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="申报总数"
          value={stats.total}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="待处理"
          value={stats.pending}
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title="运输中"
          value={stats.inTransit}
          icon={Truck}
          color="bg-green-500"
        />
        <StatCard
          title="异常"
          value={stats.exception}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近申报</h2>
          <div className="space-y-3">
            {declarations.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">暂无申报记录</p>
            ) : (
              declarations.map((decl) => (
                <div
                  key={decl.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{decl.declaration_no}</p>
                    <p className="text-sm text-gray-500">目的地：{decl.destination}</p>
                  </div>
                  <StatusBadge status={decl.current_status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">业务流程</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: '检疫申报', desc: '申报员提交猪群检疫申报' },
              { step: 2, title: '免疫校验', desc: '校验免疫记录是否满足间隔要求' },
              { step: 3, title: '车辆绑定', desc: '绑定备案运输车辆' },
              { step: 4, title: '检疫出证', desc: '检疫员出具检疫证明' },
              { step: 5, title: '运输签收', desc: '运输到达后签收确认' },
              { step: 6, title: '异常复核', desc: '异常情况复核处理' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
