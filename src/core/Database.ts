import { Dialect } from '../dialects/Dialect'
import PostgresDialect from '../dialects/PostgresDialect'
import QueryExecutor from './QueryExecutor'
import QueryBuilder from '../query/QueryBuilder'
import TransactionManager from './TransactionManager'

interface DatabaseOptions {
    connectionString: string
    dialect?: Dialect
    defaultCacheTTL?: number
}

export default class Database {
    private executor: QueryExecutor
    private dialect: Dialect
    private transactionManager: TransactionManager
    private defaultCacheTTL?: number

    constructor(options: DatabaseOptions) {
        this.dialect = options.dialect ?? new PostgresDialect()
        this.executor = new QueryExecutor(options)
        this.transactionManager = new TransactionManager(
            this.executor.getPool()!
        )
        this.defaultCacheTTL = options.defaultCacheTTL
    }

    /* ========================
       QueryBuilder Direct
    ========================= */

    table<T = any>(name: string) {
        return new QueryBuilder<T>(
            name,
            this.executor,
            this.dialect,
            this.defaultCacheTTL
        )
    }

    /* ========================
       Transaction Scope
    ========================= */

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

    setExecutor(executor: QueryExecutor) {
        this.executor = executor
    }
    /* ========================
       Repository Factory
    ========================= */

    repository<R>(
        RepoClass: new (
            executor: QueryExecutor,
            dialect: Dialect
        ) => R
    ): R {
        return new RepoClass(this.executor, this.dialect)
    }
}