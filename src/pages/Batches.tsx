import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Plus, Syringe } from 'lucide-react';

export default function Batches() {
  const user = useAuthStore((state) => state.user);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImmuneModal, setShowImmuneModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [immuneRecords, setImmuneRecords] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    batch_no: '',
    farm_name: '',
    pig_count: '',
    breed: '',
    birth_date: '',
    source: '',
  });
  const [immuneForm, setImmuneForm] = useState({
    vaccine_type: '',
    vaccine_date: '',
    vaccine_batch: '',
    manufacturer: '',
    vaccinated_by: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const result = await api.batches.list();
      setBatches(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadImmuneRecords = async (batchId: string) => {
    try {
      const result = await api.batches.getImmune(batchId);
      setImmuneRecords(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.batches.create({
        ...formData,
        pig_count: parseInt(formData.pig_count),
        created_by: user!.id,
      });
      setShowCreateModal(false);
      setFormData({ batch_no: '', farm_name: '', pig_count: '', breed: '', birth_date: '', source: '' });
      loadBatches();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddImmune = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.batches.addImmune(selectedBatch.id, immuneForm);
      setShowImmuneModal(false);
      setImmuneForm({ vaccine_type: '', vaccine_date: '', vaccine_batch: '', manufacturer: '', vaccinated_by: '' });
      loadImmuneRecords(selectedBatch.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openImmuneModal = async (batch: any) => {
    setSelectedBatch(batch);
    setShowImmuneModal(true);
    await loadImmuneRecords(batch.id);
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">猪群批次</h1>
        {user?.role === 'declarant' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            新增批次
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">批次编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">养殖场</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量(头)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">品种</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{batch.batch_no}</td>
                <td className="px-6 py-4 text-gray-600">{batch.farm_name}</td>
                <td className="px-6 py-4 text-gray-600">{batch.pig_count}</td>
                <td className="px-6 py-4 text-gray-600">{batch.breed || '-'}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {batch.status === 'active' ? '活跃' : batch.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openImmuneModal(batch)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="免疫记录"
                  >
                    <Syringe size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">新增猪群批次</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">批次编号</label>
                <input
                  type="text"
                  value={formData.batch_no}
                  onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：BATCH202401001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">养殖场</label>
                <input
                  type="text"
                  value={formData.farm_name}
                  onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量(头)</label>
                  <input
                    type="number"
                    value={formData.pig_count}
                    onChange={(e) => setFormData({ ...formData, pig_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImmuneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-2">免疫记录</h2>
            <p className="text-sm text-gray-500 mb-6">批次：{selectedBatch?.batch_no}</p>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">历史记录</h3>
              {immuneRecords.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">暂无免疫记录</p>
              ) : (
                <div className="space-y-2">
                  {immuneRecords.map((record) => (
                    <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{record.vaccine_type}</span>
                        <span className="text-sm text-gray-500">{record.vaccine_date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        疫苗批次：{record.vaccine_batch || '-'} | 生产厂家：{record.manufacturer || '-'} | 接种人：{record.vaccinated_by || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {user?.role === 'declarant' && (
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-700 mb-4">新增免疫记录</h3>
                <form onSubmit={handleAddImmune} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">疫苗类型</label>
                      <input
                        type="text"
                        value={immuneForm.vaccine_type}
                        onChange={(e) => setImmuneForm({ ...immuneForm, vaccine_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="例如：猪瘟疫苗"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">接种日期</label>
                      <input
                        type="date"
                        value={immuneForm.vaccine_date}
                        onChange={(e) => setImmuneForm({ ...immuneForm, vaccine_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">疫苗批次</label>
                      <input
                        type="text"
                        value={immuneForm.vaccine_batch}
                        onChange={(e) => setImmuneForm({ ...immuneForm, vaccine_batch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">接种人</label>
                      <input
                        type="text"
                        value={immuneForm.vaccinated_by}
                        onChange={(e) => setImmuneForm({ ...immuneForm, vaccinated_by: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowImmuneModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      关闭
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加记录
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
