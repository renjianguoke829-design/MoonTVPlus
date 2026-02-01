'use client';

export default function MonitorPage() {
  // 1. 尝试从环境变量读取链接
  // 如果你不想配环境变量，也可以直接把引号里换成你的链接，但推荐用变量
  const shareUrl = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
          {/* 绿灯闪烁动画 */}
          <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
          流量监控面板
        </h1>
        <a 
          href="/" 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700"
        >
          返回首页
        </a>
      </div>
      
      <div className="w-full max-w-7xl h-[80vh] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
        {/* 加载提示文字 (在 iframe 加载出来前显示) */}
        <div className="absolute inset-0 flex items-center justify-center z-0 text-gray-600">
          <p>正在加载数据大屏...</p>
        </div>

        {shareUrl ? (
          <iframe 
            src={shareUrl} 
            className="w-full h-full relative z-10 bg-gray-900" // 加个背景色防止闪白
            frameBorder="0"
            allowFullScreen
            title="Umami Analytics"
          ></iframe>
        ) : (
          // 如果忘了填环境变量，显示这个提示
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 text-gray-400">
            <p className="text-lg mb-2">⚠️ 未配置监控链接</p>
            <p className="text-sm">请在 Vercel 环境变量中添加 NEXT_PUBLIC_UMAMI_SHARE_URL</p>
          </div>
        )}
      </div>
      
      <p className="mt-6 text-xs text-gray-600 font-mono">
        Monitor System v1.0 • Powered by Umami
      </p>
    </div>
  );
}
