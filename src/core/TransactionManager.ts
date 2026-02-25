import {Pool, PoolClient} from 'pg'

/**
 * Manages database transactions, providing a method to execute a callback within a transaction.
 */
export default class TransactionManager {
    /**
     * Creates an instance of TransactionManager.
     * @param pool - The PostgreSQL connection pool to use for transactions.
     */
    constructor(private pool: Pool) {
    }

    /**
     * Executes a given callback function within a database transaction.
     * The transaction is committed if the callback succeeds, and rolled back if an error occurs.
     * @param callback - The function to execute within the transaction. It receives a PoolClient instance.
     * @returns A Promise that resolves to the result of the callback function.
     */
    async transaction<T>(
        callback: (trxClient: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect()

        try {
            await client.query('BEGIN')

            const result = await callback(client)

            await client.query('COMMIT')
            return result
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    }
}