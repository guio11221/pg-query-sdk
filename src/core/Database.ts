import {Dialect} from '../dialects/Dialect'
import PostgresDialect from '../dialects/PostgresDialect'
import QueryExecutor from './QueryExecutor'
import QueryBuilder from '../query/QueryBuilder'
import TransactionManager from './TransactionManager'

interface DatabaseOptions {
    connectionString: string
    dialect?: Dialect
    defaultCacheTTL?: number
}

/**
 * Represents a database connection and provides methods for querying and managing transactions.
 */
export default class Database {
    private executor: QueryExecutor
    private dialect: Dialect
    private transactionManager: TransactionManager
    private defaultCacheTTL?: number

    /**
     * Creates an instance of the Database.
     * @param options - The options for the database connection.
     */
    constructor(options: DatabaseOptions) {
        this.dialect = options.dialect ?? new PostgresDialect()
        this.executor = new QueryExecutor(options)
        this.transactionManager = new TransactionManager(
            this.executor.getPool()!
        )
        this.defaultCacheTTL = options.defaultCacheTTL
    }

    /**
     * Creates a QueryBuilder for a specific table.
     * @param name - The name of the table.
     * @returns A QueryBuilder instance.
     */
    table<T = any>(name: string) {
        return new QueryBuilder<T>(
            name,
            this.executor,
            this.dialect,
            this.defaultCacheTTL
        )
    }

    /**
     * Executes a transaction.
     * @param callback - The function to execute within the transaction. It receives a transactional Database instance.
     * @returns The result of the callback function.
     */
    async transaction<T>(
        callback: (trxDb: Database) => Promise<T>
    ): Promise<T> {
        return this.transactionManager.transaction(async trxClient => {
            const trxExecutor = new QueryExecutor(
                undefined,
                trxClient
            )

            const trxDb = new Database({
                connectionString: '',
                dialect: this.dialect,
                defaultCacheTTL: this.defaultCacheTTL
            })

            trxDb.setExecutor(trxExecutor)

            return callback(trxDb)
        })
    }

    /**
     * Sets the query executor.
     * @param executor - The QueryExecutor instance to set.
     */
    setExecutor(executor: QueryExecutor) {
        this.executor = executor
    }

    /**
     * Creates a repository instance.
     * @param RepoClass - The constructor of the repository class.
     * @returns An instance of the repository.
     */
    repository<R>(
        RepoClass: new (
            executor: QueryExecutor,
            dialect: Dialect
        ) => R
    ): R {
        return new RepoClass(this.executor, this.dialect)
    }
}