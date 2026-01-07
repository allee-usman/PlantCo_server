import Redis from 'ioredis';
import 'dotenv/config';

class RedisManager {
	static instance;
	constructor() {
		if (RedisManager.instance) return RedisManager.instance;

		const url = process.env.REDIS_URL;
		if (!url) throw new Error('REDIS_URL is required');

		this.client = new Redis(url, {
			enableOfflineQueue: true, // queue commands until ready
			// Disable per-command retry limit to avoid MaxRetriesPerRequestError noise
			maxRetriesPerRequest: null,
			// Keep ready check so we don't send commands before AUTH/HELLO etc.
			enableReadyCheck: true,
			// Reasonable connect/reconnect timeouts
			connectTimeout: 10000,
			keepAlive: 30000,
			// Exponential-ish backoff, capped
			retryStrategy: (times) => Math.min(1000 * Math.pow(1.5, times), 15000),
			// Reconnect on common transient server states
			reconnectOnError: (err) => {
				const msg = err?.message || '';
				if (msg.includes('READONLY')) return true; // failover
				if (msg.includes('ETIMEDOUT') || msg.includes('EPIPE')) return true;
				return false;
			},
			// Helps identify this connection on the server
			connectionName: 'plantco-backend',
		});

		this._wireLogs();
		RedisManager.instance = this;
	}

	_wireLogs() {
		this.client.on('ready', () =>
			console.log('✅ Connected to Redis successfully')
		);
		this.client.on('error', (err) =>
			console.error('Failed to connect to Redis DB:', err.message)
		);
		this.client.on('end', () => console.warn('Redis DB connection ended'));
	}

	getClient() {
		return this.client;
	}

	async connect() {
		if (this.client.status === 'ready' || this.client.status === 'connecting')
			return;
		await this.client.connect();
	}

	async quit() {
		try {
			await this.client.quit();
		} catch {
			await this.client.disconnect();
		}
	}
}

const redisManager = new RedisManager();
export default redisManager.getClient();

// Convenience for startup health check
export const ensureRedisConnection = async () => {
	const c = redisManager.getClient();
	if (c.status !== 'ready') {
		await redisManager.connect();
	}
	// verify with a ping
	const pong = await c.ping();
	if (pong !== 'PONG') throw new Error('Redis ping failed');
	return c;
};
