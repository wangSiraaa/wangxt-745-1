import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/Layout';
import { Plus, Eye, Check, Truck, Award, AlertCircle } from 'lucide-react';

export default function Declarations() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    destination: '',
    receiver: '',
    receiver_phone: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [declResult, batchResult, vehicleResult] = await Promise.all([
        api.declarations.list(),
        api.batches.list(),
        api.vehicles.list(),
      ]);
      setDeclarations(declResult.data);
      setBatches(batchResult.data);
      setVehicles(vehicleResult.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.declarations.create({
        ...formData,
        declarant_id: user?.id,
      });
      setShowCreateModal(false);
      setFormData({ batch_id: '', destination: '', receiver: '', receiver_phone: '' });
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleImmuneCheck = async (id: string) => {
    try {
      await api.declarations.checkImmune(id);
      alert('免疫校验通过');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleBindVehicle = async (id: string) => {
    const vehicleId = prompt('请输入车辆ID:');
    if (!vehicleId) return;
    
    try {
      await api.declarations.bindVehicle(id, vehicleId);
      alert('车辆绑定成功');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleIssueCertificate = async (id: string) => {
    try {
      await api.declarations.issueCertificate(id, user!.id);
      alert('检疫出证成功');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleStartTransport = async (id: string) => {
    try {
      await api.declarations.startTransport(id);
      alert('开始运输');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleReportException = async (id: string) => {
    const reason = prompt('请输入异常原因:');
    if (!reason) return;
    
    try {
      await api.declarations.reportException(id, {
        exception_type: '运输异常',
        exception_description: reason,
        reporter_id: user!.id,
      });
      alert('异常已上报');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">检疫申报</h1>
        {user?.role === 'declarant' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            新增申报
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申报编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目的地</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申报时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {declarations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  暂无申报记录
                </td>
              </tr>
            ) : (
              declarations.map((decl) => (
                <tr key={decl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{decl.declaration_no}</td>
                  <td className="px-6 py-4 text-gray-600">{decl.destination}</td>
                  <td className="px-6 py-4"><StatusBadge status={decl.current_status} /></td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{decl.created_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {decl.current_status === 'declared' && user?.role === 'inspector' && (
                        <button
                          onClick={() => handleImmuneCheck(decl.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="免疫校验"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {['declared', 'immune_checked'].includes(decl.current_status) && user?.role === 'declarant' && (
                        <button
                          onClick={() => handleBindVehicle(decl.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="绑定车辆"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {decl.current_status === 'vehicle_bound' && user?.role === 'inspector' && (
                        <button
                          onClick={() => handleIssueCertificate(decl.id)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="检疫出证"
                        >
                          <Award size={18} />
                        </button>
                      )}
                      {decl.current_status === 'certificate_issued' && user?.role === 'driver' && (
                        <button
                          onClick={() => handleStartTransport(decl.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                          title="开始运输"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {decl.current_status === 'in_transit' && (
                        <button
                          onClick={() => handleReportException(decl.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="上报异常"
                        >
                          <AlertCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">新增检疫申报</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">猪群批次</label>
                <select
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择批次</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_no} - {batch.farm_name} ({batch.pig_count}头)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目的地</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="请输入目的地"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">收货方</label>
                <input
                  type="text"
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="请输入收货方名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="text"
                  value={formData.receiver_phone}
                  onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="请输入联系电话"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  提交申报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
