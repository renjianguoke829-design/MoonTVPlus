// ================= 邮箱与找回密码 (新增) =================

  async bindEmail(userName: string, email: string): Promise<void> {
    // 1. 更新用户信息
    await this.updateUserInfoV2(userName, { email } as any);
    
    // 2. 建立索引 (仅支持 Redis/Upstash)
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) await client.set(`email_index:${email}`, userName);
    }
  }

  async getUserByEmail(email: string): Promise<string | null> {
    // 1. 尝试从索引查
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) return await client.get(`email_index:${email}`);
    }
    
    // 2. 兜底：如果不是 Redis，或者索引不存在，遍历查找 (兼容性)
    try {
      const { users } = await this.getUserListV2(0, 1000); 
      const user = users.find((u: any) => u.email === email);
      return user ? user.username : null;
    } catch {
      return null;
    }
  }

  async setResetToken(token: string, userName: string): Promise<void> {
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) await client.set(`reset_token:${token}`, userName, { ex: 900 });
    }
  }

  async verifyResetToken(token: string): Promise<string | null> {
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) return await client.get(`reset_token:${token}`);
    }
    return null;
  }

  async deleteResetToken(token: string): Promise<void> {
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) await client.del(`reset_token:${token}`);
    }
  }
