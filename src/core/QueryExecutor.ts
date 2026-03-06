import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg'

interface ExecutorOptions extends PoolConfig {
    defaultQueryTimeoutMs?: number
    redactQueryParams?: boolean
    queryLogger?: {
        onQueryStart?: (meta: { query: string; params: readonly any[] }) => void
        onQueryEnd?: (meta: {
            query: string
            params: readonly any[]
            durationMs: number
            rowCount?: number | null
        }) => void
        onQueryError?: (meta: {
            query: string
            params: readonly any[]
            durationMs: number
            error: unknown
        }) => void
    }
}

/**
 * Executes database queries using a PostgreSQL pool or client.
 */
export default class QueryExecutor {
    private pool?: Pool
    private client?: PoolClient
    private defaultQueryTimeoutMs?: number
    private redactQueryParams: boolean = true
    private queryLogger?: ExecutorOptions['queryLogger']

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
            const {
                defaultQueryTimeoutMs,
                redactQueryParams,
                queryLogger,
                ...poolOptions
            } = options

            this.defaultQueryTimeoutMs = defaultQueryTimeoutMs
            this.redactQueryParams = redactQueryParams ?? true
            this.queryLogger = queryLogger

            this.pool = new Pool({
                ...poolOptions
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
        const observableParams = this.redactQueryParams
            ? normalized.map(() => '[REDACTED]')
            : normalized
        const startedAt = Date.now()
        this.queryLogger?.onQueryStart?.({
            query,
            params: observableParams
        })

        const queryConfig = this.defaultQueryTimeoutMs
            ? {
                text: query,
                values: normalized,
                query_timeout: this.defaultQueryTimeoutMs
            }
            : {
                text: query,
                values: normalized
            }

        try {
            if (this.client) {
                const result = await this.client.query(queryConfig)
                this.queryLogger?.onQueryEnd?.({
                    query,
                    params: observableParams,
                    durationMs: Date.now() - startedAt,
                    rowCount: result.rowCount
                })
                return result
            }

            if (this.pool) {
                const result = await this.pool.query(queryConfig)
                this.queryLogger?.onQueryEnd?.({
                    query,
                    params: observableParams,
                    durationMs: Date.now() - startedAt,
                    rowCount: result.rowCount
                })
                return result
            }
        } catch (error) {
            this.queryLogger?.onQueryError?.({
                query,
                params: observableParams,
                durationMs: Date.now() - startedAt,
                error
            })
            throw error
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
