import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// 辅助函数：从 Cookie 获取当前用户
// 这一步替代了原来的 auth.ts 调用，避免修改 auth.ts 导致更多错误
function getSessionUser() {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth'); 
  if (!auth) return null;
  try {
    const data = JSON.parse(auth.value);
    // 兼容旧版 cookie 结构 (name 或 username)
    const username = data.username || data.name;
    return username ? { username } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  // 获取最新用户信息
  const userInfo = await db.getUserInfoV2(user.username);
  
  // 即使没查到（可能是旧版用户），也返回空默认值，防止前端报错
  return NextResponse.json({
    email: (userInfo as any)?.email || '',
    emailNotifications: (userInfo as any)?.emailNotifications || false,
  });
}

export async function POST(req: Request) {
  try {
    const user = getSessionUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { email, emailNotifications } = await req.json();

    // 1. 处理邮箱绑定
    if (email) {
      // 检查邮箱是否已被其他人占用
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser !== user.username) {
        return NextResponse.json({ error: '该邮箱已被其他账号绑定' }, { status: 400 });
      }
      // 执行绑定（写入数据库）
      await db.bindEmail(user.username, email);
    }

    // 2. 处理通知设置
    if (typeof emailNotifications === 'boolean') {
      await db.updateUserInfoV2(user.username, { emailNotifications } as any);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
