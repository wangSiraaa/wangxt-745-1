import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/Layout';
import { Package, CheckCircle } from 'lucide-react';

export default function Receipts() {
  const user = useAuthStore((state) => state.user);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDecl, setSelectedDecl] = useState<any>(null);
  const [formData, setFormData] = useState({
    receiver_name: '',
    pig_count: '',
    abnormal_count: '0',
    abnormal_description: '',
    receipt_status: 'received',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.declarations.list();
      const inTransit = result.data.filter((d: any) => d.current_status === 'in_transit');
      setDeclarations(inTransit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReceiptModal = (decl: any) => {
    setSelectedDecl(decl);
    setFormData({
      receiver_name: user?.name || '',
      pig_count: '',
      abnormal_count: '0',
      abnormal_description: '',
      receipt_status: 'received',
    });
    setShowReceiptModal(true);
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.declarations.receive(selectedDecl.id, {
        ...formData,
        pig_count: parseInt(formData.pig_count),
        abnormal_count: parseInt(formData.abnormal_count) || 0,
      });
      setShowReceiptModal(false);
      alert('签收成功');
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">到场签收</h1>
        <p className="text-gray-500 mt-1">待运输到达的申报单列表</p>
      </div>

      {declarations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">暂无待签收的运输单</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {declarations.map((decl) => (
            <div key={decl.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{decl.declaration_no}</h3>
                <StatusBadge status={decl.current_status} />
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p>目的地：{decl.destination}</p>
                <p>收货方：{decl.receiver || '-'}</p>
                <p>联系电话：{decl.receiver_phone || '-'}</p>
                <p>申报时间：{decl.created_at}</p>
              </div>
              
              {['driver', 'inspector'].includes(user?.role || '') && (
                <button
                  onClick={() => openReceiptModal(decl)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={18} />
                  到场签收
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">到场签收</h2>
            <p className="text-sm text-gray-500 mb-4">申报单：{selectedDecl?.declaration_no}</p>
            
            <form onSubmit={handleReceive} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签收人</label>
                <input
                  type="text"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">实收数量(头)</label>
                  <input
                    type="number"
                    value={formData.pig_count}
                    onChange={(e) => setFormData({ ...formData, pig_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">异常数量(头)</label>
                  <input
                    type="number"
                    value={formData.abnormal_count}
                    onChange={(e) => setFormData({ ...formData, abnormal_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常说明</label>
                <textarea
                  value={formData.abnormal_description}
                  onChange={(e) => setFormData({ ...formData, abnormal_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="如有异常请描述..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签收状态</label>
                <select
                  value={formData.receipt_status}
                  onChange={(e) => setFormData({ ...formData, receipt_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="received">正常签收</option>
                  <option value="partial">部分签收</option>
                  <option value="rejected">拒收</option>
                </select>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  确认签收
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
