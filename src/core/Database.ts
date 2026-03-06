import { Dialect } from '../dialects/Dialect'
import PostgresDialect from '../dialects/PostgresDialect'
import QueryExecutor from './QueryExecutor'
import QueryBuilder from '../query/QueryBuilder'
import TransactionManager from './TransactionManager'
import { PoolConfig, PoolClient } from 'pg'

/**
 * Configuration object for Database initialization.
 *
 * Extends the native PostgreSQL {@link PoolConfig}.
 *
 * @property dialect - SQL dialect strategy implementation.
 * @property defaultCacheTTL - Default cache time-to-live in seconds for queries (optional).
 */
interface DatabaseOptions extends PoolConfig {
    dialect?: Dialect
    defaultCacheTTL?: number
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
 * High-level database facade responsible for:
 *
 * - Managing the query executor lifecycle
 * - Providing a QueryBuilder entrypoint
 * - Handling transactions
 * - Creating repository instances
 *
 * This class acts as the primary integration boundary between
 * the infrastructure layer and the application layer.
 *
 * @remarks
 * By default, it uses PostgresDialect when no dialect is provided.
 * The underlying connection pool is managed by QueryExecutor.
 */
export default class Database {
    private executor: QueryExecutor
    private dialect: Dialect
    private transactionManager?: TransactionManager
    private defaultCacheTTL?: number

    /**
     * Creates a new Database instance.
     *
     * @param options - Database configuration options.
     * Must include valid PostgreSQL PoolConfig properties.
     *
     * @throws Error if QueryExecutor fails initialization.
     */
    constructor(options: DatabaseOptions) {
        this.dialect = options.dialect ?? new PostgresDialect()

        this.executor = new QueryExecutor({
            ...options,
            defaultQueryTimeoutMs: options.defaultQueryTimeoutMs,
            redactQueryParams: options.redactQueryParams,
            queryLogger: options.queryLogger
        })

        const pool = this.executor.getPool()
        if (pool) {
            this.transactionManager = new TransactionManager(pool)
        }

        this.defaultCacheTTL = options.defaultCacheTTL
    }

    /**
     * Creates a transaction-scoped Database instance that reuses the existing
     * dialect and cache settings without creating a new connection pool.
     */
    private static createTransactionScope(
        trxClient: PoolClient,
        dialect: Dialect,
        defaultCacheTTL?: number
    ): Database {
        const scoped = Object.create(Database.prototype) as Database
        scoped.dialect = dialect
        scoped.defaultCacheTTL = defaultCacheTTL
        scoped.executor = new QueryExecutor(undefined, trxClient)
        scoped.transactionManager = undefined
        return scoped
    }

    /**
     * Creates a new QueryBuilder bound to a specific table.
     *
     * @template T - Expected row return type.
     *
     * @param name - Database table name.
     * @returns A strongly-typed QueryBuilder instance.
     *
     * @example
     * db.table<User>('users').where('id', 1).first()
     */
    table<T = any>(name: string): QueryBuilder<T> {
        if(!name) throw new Error('name on table must be a string')
        return new QueryBuilder<T>(
            name,
            this.executor,
            this.dialect,
            this.defaultCacheTTL
        )
    }

    /**
     * Executes a transactional operation.
     *
     * A new transactional Database instance is created internally
     * using a dedicated PoolClient. All operations inside the callback
     * are executed within the same transaction scope.
     *
     * @template T - Return type of the transactional callback.
     *
     * @param callback - Async function receiving a transactional Database instance.
     * @returns The resolved value returned by the callback.
     *
     * @remarks
     * - Automatically commits on success.
     * - Automatically rolls back on error.
     *
     * @example
     * await db.transaction(async trx => {
     *   await trx.table('users').insert({...})
     * })
     */
    async transaction<T>(
        callback: (trxDb: Database) => Promise<T>
    ): Promise<T> {
        if (!this.transactionManager) {
            throw new Error('Transactions require a pool-backed Database instance')
        }

        return this.transactionManager.transaction(async trxClient => {
            const trxDb = Database.createTransactionScope(
                trxClient,
                this.dialect,
                this.defaultCacheTTL
            )
            return callback(trxDb)
        })
    }

    /**
     * Overrides the current QueryExecutor instance.
     *
     * Primarily used internally for transaction-scoped Database instances.
     *
     * @param executor - QueryExecutor to be injected.
     */
    setExecutor(executor: QueryExecutor): void {
        this.executor = executor
    }

    /**
     * Instantiates a repository bound to the current executor and dialect.
     *
     * @template R - Repository type.
     *
     * @param RepoClass - Repository constructor.
     * Must accept (executor, dialect) as parameters.
     *
     * @returns A new repository instance.
     *
     * @example
     * const userRepo = db.repository(UserRepository)
     */
    repository<R>(
        RepoClass: new (
            executor: QueryExecutor,
            dialect: Dialect
        ) => R
    ): R {
        return new RepoClass(this.executor, this.dialect)
    }

    /**
     * Closes the underlying connection pool if this instance is pool-backed.
     */
    async close(): Promise<void> {
        await this.executor.close()
    }
}
