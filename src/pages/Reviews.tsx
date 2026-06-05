import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Reviews() {
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [formData, setFormData] = useState({
    review_comment: '',
    review_result: 'resolved',
    handling_measures: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const result = await api.reviews.list();
      setReviews(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (review: any) => {
    setSelectedReview(review);
    setFormData({
      review_comment: '',
      review_result: 'resolved',
      handling_measures: '',
    });
    setShowReviewModal(true);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.reviews.review(selectedReview.id, {
        ...formData,
        reviewer_id: user!.id,
      });
      setShowReviewModal(false);
      alert('复核完成');
      loadReviews();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const getResultBadge = (result: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: '待复核', color: 'bg-yellow-100 text-yellow-700' },
      approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
      rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
      resolved: { label: '已处理', color: 'bg-blue-100 text-blue-700' },
    };
    const badge = badges[result] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">异常复核</h1>
        <p className="text-gray-500 mt-1">处理运输和签收中的异常情况</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertTriangle className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">暂无异常复核记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">{review.exception_type}</h3>
                    {getResultBadge(review.review_result || 'pending')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    申报单ID：{review.declaration_id} | 上报时间：{review.report_time}
                  </p>
                </div>
                {user?.role === 'reviewer' && (!review.review_result || review.review_result === 'pending') && (
                  <button
                    onClick={() => openReviewModal(review)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    处理复核
                  </button>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">异常描述：</p>
                <p className="text-gray-600">{review.exception_description}</p>
              </div>
              
              {review.review_comment && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">复核意见：</p>
                  <p className="text-gray-600">{review.review_comment}</p>
                  {review.handling_measures && (
                    <p className="text-sm text-gray-500 mt-2">
                      处理措施：{review.handling_measures}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">异常复核</h2>
            
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">复核意见</label>
                <textarea
                  value={formData.review_comment}
                  onChange={(e) => setFormData({ ...formData, review_comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="请输入复核意见..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理措施</label>
                <textarea
                  value={formData.handling_measures}
                  onChange={(e) => setFormData({ ...formData, handling_measures: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="请输入处理措施..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">复核结果</label>
                <select
                  value={formData.review_result}
                  onChange={(e) => setFormData({ ...formData, review_result: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="resolved">已处理</option>
                  <option value="approved">通过</option>
                  <option value="rejected">驳回</option>
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
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  提交复核
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
