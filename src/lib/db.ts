/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { AdminConfig } from './admin.types';
import { KvrocksStorage } from './kvrocks.db';
import { RedisStorage } from './redis.db';
import { DanmakuFilterConfig, Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | 'd1'
    | undefined) || 'localstorage';

function createStorage(): IStorage {
  switch (STORAGE_TYPE) {
    case 'redis':
      return new RedisStorage();
    case 'upstash':
      return new UpstashRedisStorage();
    case 'kvrocks':
      return new KvrocksStorage();
    case 'd1':
      if (typeof window !== 'undefined') {
        throw new Error('D1Storage can only be used on the server side');
      }
      const adapter = getD1Adapter();
      const { D1Storage } = require('./d1.db');
      return new D1Storage(adapter);
    case 'localstorage':
    default:
      return null as unknown as IStorage;
  }
}

function getD1Adapter(): any {
  const { CloudflareD1Adapter, SQLiteAdapter } = require('./d1-adapter');
  const isCloudflare = process.env.CF_PAGES === '1' || process.env.BUILD_TARGET === 'cloudflare';

  if (isCloudflare) {
    let cachedAdapter: any = null;
    return new Proxy({}, {
      get(target, prop) {
        if (!cachedAdapter) {
          try {
            const { getCloudflareContext } = require('@opennextjs/cloudflare');
            const { env } = getCloudflareContext();
            if (!env.DB) throw new Error('D1 binding not found');
            console.log('Using Cloudflare D1 database');
            cachedAdapter = new CloudflareD1Adapter(env.DB);
          } catch (error) {
            console.error('Failed to initialize Cloudflare D1:', error);
            throw error;
          }
        }
        return cachedAdapter[prop];
      }
    });
  }

  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(process.cwd(), '.data', 'moontv.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return new SQLiteAdapter(db);
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

  // ================= 邮箱与找回密码 (新增) =================

  async bindEmail(userName: string, email: string): Promise<void> {
    // 存到用户信息
    await this.updateUserInfoV2(userName, { email } as any);
    
    // 建立索引 (仅 Redis/Upstash 有效)
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) await client.set(`email_index:${email}`, userName);
    }
  }

  async getUserByEmail(email: string): Promise<string | null> {
    // 优先查索引
    if (this.storage.type === 'upstash' || this.storage.type === 'redis') {
      const client = (this.storage as any).client;
      if (client) return await client.get(`email_index:${email}`);
    }
    return null;
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
}

export const db = new DbManager();
