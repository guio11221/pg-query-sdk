import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg'

interface ExecutorOptions extends PoolConfig {

}

/**
 * Executes database queries using a PostgreSQL pool or client.
 */
export default class QueryExecutor {
    private pool?: Pool
    private client?: PoolClient

    /**
     * Creates an instance of QueryExecutor.
     * @param options - Options for the executor, including the connection string.
     * @param client - An optional PoolClient to use for queries (for transactions).
     */
    constructor(
        options?: ExecutorOptions,
        client?: PoolClient
    ) {
        if (client) {
            this.client = client
            return
        }

        if (options) {
            this.pool = new Pool({
                ...options
            })
            return
        }

        throw new Error('QueryExecutor requires either PoolConfig or PoolClient')
    }

    /**
     * Executes a SQL query.
     * @param query - The SQL query string.
     * @param params - An array of parameters for the query.
     * @returns A Promise that resolves to the QueryResult.
     */
    async execute(
        query: string,
        params: readonly any[] = [],
        cacheTTL?: number
    ): Promise<QueryResult> {

        const normalized = [...params]

        if (this.client) {
            return this.client.query(query, normalized)
        }

        if (this.pool) {
            return this.pool.query(query, normalized)
        }

        throw new Error('Executor not initialized')
    }

    /**
     * Returns the underlying PostgreSQL Pool instance.
     * @returns The Pool instance or undefined if not initialized with a connection string.
     */
    getPool(): Pool | undefined {
        return this.pool
    }

    /**
     * Returns the underlying PostgreSQL PoolClient instance.
     * @returns The PoolClient instance or undefined if not initialized with a client.
     */
    getClient(): PoolClient | undefined {
        return this.client
    }

    /**
     * Closes the database connection pool.
     */
    async close() {
        if (this.pool) {
            await this.pool.end()
        }
    }
}