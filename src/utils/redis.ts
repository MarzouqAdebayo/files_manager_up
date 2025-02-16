import {createClient} from 'redis';

class RedisClient {
  private _client: ReturnType<typeof createClient>;
  private isConnected: boolean;

  constructor() {
    this.isConnected = false;
    this._client = createClient()
      .on('connect', () => {
        console.log('Redis Client: Connected');
        this.isConnected = true;
      })
      .on('error', err => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      })
      .on('end', () => {
        console.log('Redis Client: Connection closed');
        this.isConnected = false;
      });
    void this.connect();
  }

  get client() {
    return this._client;
  }

  async connect(): Promise<void> {
    try {
      await this._client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  isAlive(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    await this._client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this._client.get(key);
  }

  async remove(key: string) {
    return this._client.del(key);
  }

  async set(
    key: string,
    value: number | string,
    duration: number,
  ): Promise<string | null> {
    return this._client.set(key, value.toString(), {EX: duration});
  }
}

export const redisClient = new RedisClient();
