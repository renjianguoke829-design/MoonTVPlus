'use client';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <a href="/login" className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回登录
        </a>
        
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">忘记密码？</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">输入您绑定的邮箱，我们将发送重置链接给您。</p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
            <p className="font-bold">✅ 邮件已发送！</p>
            <p className="text-sm mt-1">请查收邮件并点击链接重置密码。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">邮箱地址</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? '发送中...' : '发送重置邮件'}
            </button>
            {status === 'error' && <p className="text-red-500 text-sm text-center">发送失败，请稍后重试</p>}
          </form>
        )}
      </div>
    </div>
  );
}
