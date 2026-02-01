/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { AdminConfig } from './admin.types';
// ❌ 已删除不兼容 Edge 环境的普通 Redis/Kvrocks 引用
import { DanmakuFilterConfig, Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

function createStorage(): IStorage {
  // ✅ 强制只返回 Upstash 实例
  // 这样 Vercel 构建时就不会去打包那些不兼容的 Redis 库
  return new UpstashRedisStorage();
}

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

export class DbManager {
  private storage: IStorage;

  constructor() {
    this.storage = getStorage();
  }

  // ================= 基础功能区域 =================

  async getPlayRecord(userName: string, source: string, id: string): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    return this.storage.getPlayRecord(userName, key);
  }

  async savePlayRecord(userName: string, source: string, id: string, record: PlayRecord): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.setPlayRecord(userName, key, record);
  }

  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    return this.storage.getAllPlayRecords(userName);
  }

  async deletePlayRecord(userName: string, source: string, id: string): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.deletePlayRecord(userName, key);
  }

  async getFavorite(userName: string, source: string, id: string): Promise<Favorite | null> {
    const key = generateStorageKey(source, id);
    return this.storage.getFavorite(userName, key);
  }

  async saveFavorite(userName: string, source: string, id: string, favorite: Favorite): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.setFavorite(userName, key, favorite);
  }

  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    return this.storage.getAllFavorites(userName);
  }

  async deleteFavorite(userName: string, source: string, id: string): Promise<void> {
    const key = generateStorageKey(source, id);
    await this.storage.deleteFavorite(userName, key);
  }

  async isFavorited(userName: string, source: string, id: string): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return this.storage.verifyUser(userName, password);
  }

  async checkUserExist(userName: string): Promise<boolean> {
    return this.storage.checkUserExist(userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    await this.storage.changePassword(userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    await this.storage.deleteUser(userName);
  }

  // ================= V2 用户系统区域 =================

  async createUserV2(userName: string, password: string, role: 'owner' | 'admin' | 'user' = 'user', tags?: string[], oidcSub?: string, enabledApis?: string[]): Promise<void> {
    if (typeof (this.storage as any).createUserV2 === 'function') {
      await (this.storage as any).createUserV2(userName, password, role, tags, oidcSub, enabledApis);
    }
  }

  async verifyUserV2(userName: string, password: string): Promise<boolean> {
    if (typeof (this.storage as any).verifyUserV2 === 'function') {
      return (this.storage as any).verifyUserV2(userName, password);
    }
    return false;
  }

  async getUserInfoV2(userName: string): Promise<any | null> {
    if (typeof (this.storage as any).getUserInfoV2 === 'function') {
      return (this.storage as any).getUserInfoV2(userName);
    }
    return null;
  }

  async updateUserInfoV2(userName: string, updates: any): Promise<void> {
    if (typeof (this.storage as any).updateUserInfoV2 === 'function') {
      await (this.storage as any).updateUserInfoV2(userName, updates);
    }
  }

  async changePasswordV2(userName: string, newPassword: string): Promise<void> {
    if (typeof (this.storage as any).changePasswordV2 === 'function') {
      await (this.storage as any).changePasswordV2(userName, newPassword);
    }
  }

  async checkUserExistV2(userName: string): Promise<boolean> {
    if (typeof (this.storage as any).checkUserExistV2 === 'function') {
      return (this.storage as any).checkUserExistV2(userName);
    }
    return false;
  }

  async getUserByOidcSub(oidcSub: string): Promise<string | null> {
    if (typeof (this.storage as any).getUserByOidcSub === 'function') {
      return (this.storage as any).getUserByOidcSub(oidcSub);
    }
    return null;
  }

  async getUserListV2(offset = 0, limit = 20, ownerUsername?: string): Promise<{ users: any[], total: number }> {
    if (typeof (this.storage as any).getUserListV2 === 'function') {
      return (this.storage as any).getUserListV2(offset, limit, ownerUsername);
    }
    return { users: [], total: 0 };
  }

  async deleteUserV2(userName: string): Promise<void> {
    if (typeof (this.storage as any).deleteUserV2 === 'function') {
      await (this.storage as any).deleteUserV2(userName);
    }
  }

  // ================= 迁移与配置区域 =================

  async migratePlayRecords(userName: string): Promise<void> {
    if (typeof (this.storage as any).migratePlayRecords === 'function') await (this.storage as any).migratePlayRecords(userName);
  }

  async migrateFavorites(userName: string): Promise<void> {
    if (typeof (this.storage as any).migrateFavorites === 'function') await (this.storage as any).migrateFavorites(userName);
  }

  async migrateSkipConfigs(userName: string): Promise<void> {
    if (typeof (this.storage as any).migrateSkipConfigs === 'function') await (this.storage as any).migrateSkipConfigs(userName);
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return this.storage.getSearchHistory(userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.storage.addSearchHistory(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await this.storage.deleteSearchHistory(userName, keyword);
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    if (typeof (this.storage as any).getAdminConfig === 'function') return (this.storage as any).getAdminConfig();
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    if (typeof (this.storage as any).setAdminConfig === 'function') await (this.storage as any).setAdminConfig(config);
  }

  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    if (typeof (this.storage as any).getSkipConfig === 'function') return (this.storage as any).getSkipConfig(userName, source, id);
    return null;
  }

  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    if (typeof (this.storage as any).setSkipConfig === 'function') await (this.storage as any).setSkipConfig(userName, source, id, config);
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    if (typeof (this.storage as any).deleteSkipConfig === 'function') await (this.storage as any).deleteSkipConfig(userName, source, id);
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    if (typeof (this.storage as any).getAllSkipConfigs === 'function') return (this.storage as any).getAllSkipConfigs(userName);
    return {};
  }

  async getDanmakuFilterConfig(userName: string): Promise<DanmakuFilterConfig | null> {
    if (typeof (this.storage as any).getDanmakuFilterConfig === 'function') return (this.storage as any).getDanmakuFilterConfig(userName);
    return null;
  }

  async setDanmakuFilterConfig(userName: string, config: DanmakuFilterConfig): Promise<void> {
    if (typeof (this.storage as any).setDanmakuFilterConfig === 'function') await (this.storage as any).setDanmakuFilterConfig(userName, config);
  }

  async deleteDanmakuFilterConfig(userName: string): Promise<void> {
    if (typeof (this.storage as any).deleteDanmakuFilterConfig === 'function') await (this.storage as any).deleteDanmakuFilterConfig(userName);
  }

  async clearAllData(): Promise<void> {
    if (typeof (this.storage as any).clearAllData === 'function') await (this.storage as any).clearAllData();
    else throw new Error('存储类型不支持清空数据操作');
  }

  async getGlobalValue(key: string): Promise<string | null> {
    if (typeof (this.storage as any).getGlobalValue === 'function') return (this.storage as any).getGlobalValue(key);
    return null;
  }

  async setGlobalValue(key: string, value: string): Promise<void> {
    if (typeof (this.storage as any).setGlobalValue === 'function') await (this.storage as any).setGlobalValue(key, value);
  }

  async deleteGlobalValue(key: string): Promise<void> {
    if (typeof (this.storage as any).deleteGlobalValue === 'function') await (this.storage as any).deleteGlobalValue(key);
  }

  // ================= 邮箱与找回密码 (完全可用版) =================

  async bindEmail(userName: string, email: string): Promise<void> {
    await this.updateUserInfoV2(userName, { email } as any);
    // 直接操作 client，避开类型推断
    const client = (this.storage as any).client;
    if (client) await client.set(`email_index:${email}`, userName);
  }

  async getUserByEmail(email: string): Promise<string | null> {
    const client = (this.storage as any).client;
    if (client) return await client.get(`email_index:${email}`);
    
    // 兜底逻辑
    try {
      const { users } = await this.getUserListV2(0, 1000); 
      const user = users.find((u: any) => u.email === email);
      return user ? user.username : null;
    } catch {
      return null;
    }
  }

  async setResetToken(token: string, userName: string): Promise<void> {
    const client = (this.storage as any).client;
    if (client) await client.set(`reset_token:${token}`, userName, { ex: 900 });
  }

  async verifyResetToken(token: string): Promise<string | null> {
    const client = (this.storage as any).client;
    if (client) return await client.get(`reset_token:${token}`);
  }

  async deleteResetToken(token: string): Promise<void> {
    const client = (this.storage as any).client;
    if (client) await client.del(`reset_token:${token}`);
  }
}

export const db = new DbManager();
