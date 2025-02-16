import {Db, MongoClient} from 'mongodb';

class DBClient {
  private isConnected: boolean;
  private _client: MongoClient;
  private _db: Db;

  constructor(
    private readonly host = process.env.DB_HOST || 'localhost',
    private readonly port = process.env.DB_PORT || '27017',
    private readonly database = process.env.DB_DATABASE || 'files_manager',
  ) {
    this.isConnected = false;
    this._client = new MongoClient(`mongodb://${this.host}:${this.port}`);
    this._db = this._client.db(this.database);
    void this.connect();
  }

  async connect() {
    try {
      await this._client.connect();
      this.isConnected = true;
      console.log('MongoDB Client: Connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('MongoDB Connection Error:', error);
    }
  }

  isAlive() {
    return this.isConnected;
  }

  async close() {
    await this._client.close();
    this.isConnected = false;
    console.log('MongoDB Client: Connection closed');
  }

  async nbUsers() {
    return this._db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this._db.collection('files').countDocuments();
  }

  get userCollection() {
    return this._db.collection('users');
  }

  get fileCollection() {
    return this._db.collection('files');
  }
}

export const dbClient = new DBClient();
