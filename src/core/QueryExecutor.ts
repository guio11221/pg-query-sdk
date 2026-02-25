import { Pool, PoolClient, QueryResult } from 'pg'

interface ExecutorOptions {
    connectionString: string
}

export default class QueryExecutor {
    private pool?: Pool
    private client?: PoolClient

    constructor(
        options?: ExecutorOptions,
        client?: PoolClient
    ) {
        if (client) {
            this.client = client
            return
        }

        if (options?.connectionString) {
            this.pool = new Pool({
                connectionString: options.connectionString
            })
            return
        }

        throw new Error('Invalid QueryExecutor initialization')
    }

    async execute(
        query: string, params: any[] = [], cacheTTL: number | undefined    ): Promise<QueryResult> {
        if (this.client) {
            return this.client.query(query, params)
        }

        if (this.pool) {
            return this.pool.query(query, params)
        }

        throw new Error('Executor not initialized')
    }

    getPool(): Pool | undefined {
        return this.pool
    }

    getClient(): PoolClient | undefined {
        return this.client
    }

    async close() {
        if (this.pool) {
            await this.pool.end()
        }
    }
}