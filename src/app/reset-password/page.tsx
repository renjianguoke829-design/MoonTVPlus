'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) return <div className="text-red-500 text-center">无效的链接</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      alert('密码修改成功，请登录');
      router.push('/login');
    } else {
      alert('链接失效或重置失败');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">新密码</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="请输入新密码"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
      >
        {loading ? '提交中...' : '确认修改'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">设置新密码</h2>
        <Suspense fallback={<div>加载中...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
