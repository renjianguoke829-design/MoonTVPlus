import React from 'react';

// Vercel 部署使用默认 runtime 即可，不需要强制 edge
// export const runtime = 'edge'; 

export default function MonitorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
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
        {/* 加载提示 */}
        <div className="absolute inset-0 flex items-center justify-center z-0 text-gray-600">
          <p>正在加载数据大屏...</p>
        </div>

        {/* 🔴 请将下面的 src 换成你自己的 Umami 分享链接 (Share URL) */}
        {/* 如果还没有 Umami，去 cloud.umami.is 注册一个，把它的 Share URL 填在这里 */}
        <iframe 
          src="https://cloud.umami.is/share/你的代码/你的网站名?theme=dark" 
          className="w-full h-full relative z-10"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
      
      <p className="mt-6 text-xs text-gray-600 font-mono">
        Monitor System v1.0 • Powered by Umami
      </p>
    </div>
  );
}
