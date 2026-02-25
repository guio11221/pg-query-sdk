import {Pool, PoolClient, QueryResult} from 'pg'

interface ExecutorOptions {
    connectionString: string
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

        if (options?.connectionString) {
            this.pool = new Pool({
                connectionString: options.connectionString
            })
            return
        }

        throw new Error('Invalid QueryExecutor initialization')
    }

    /**
     * Executes a SQL query.
     * @param query - The SQL query string.
     * @param params - An array of parameters for the query.
     * @param cacheTTL - Time-to-live for caching (not currently used in this implementation).
     * @returns A Promise that resolves to the QueryResult.
     */
    async execute(
        query: string, params: any[] = [], cacheTTL: number | undefined): Promise<QueryResult> {
        if (this.client) {
            return this.client.query(query, params)
        }

        if (this.pool) {
            return this.pool.query(query, params)
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