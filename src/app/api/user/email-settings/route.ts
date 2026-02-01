import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// 辅助函数：从 Cookie 获取当前用户
function getSessionUser() {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth'); // 注意：这里假设 Cookie 名为 auth
  if (!auth) return null;
  try {
    const data = JSON.parse(auth.value);
    return data.username ? { username: data.username } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const userInfo = await db.getUserInfoV2(user.username);
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

    // 绑定邮箱
    if (email) {
      // 检查是否被占用
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser !== user.username) {
        return NextResponse.json({ error: '该邮箱已被其他账号绑定' }, { status: 400 });
      }
      await db.bindEmail(user.username, email);
    }

    // 更新通知设置
    if (typeof emailNotifications === 'boolean') {
      await db.updateUserInfoV2(user.username, { emailNotifications } as any);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
