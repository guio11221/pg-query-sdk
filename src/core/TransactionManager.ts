import { Pool, PoolClient } from 'pg'

/**
 * Handles transactional control flow using a PostgreSQL connection pool.
 *
 * Responsibilities:
 * - Acquiring a dedicated PoolClient
 * - Starting a transaction (BEGIN)
 * - Committing on success
 * - Rolling back on failure
 * - Ensuring proper client release
 *
 * @remarks
 * This class centralizes transaction lifecycle management,
 * preventing resource leaks and guaranteeing atomic execution.
 *
 * It assumes the underlying driver follows standard SQL
 * transactional semantics.
 */
export default class TransactionManager {

    /**
     * Creates a TransactionManager instance.
     *
     * @param pool - PostgreSQL connection pool used to acquire clients.
     *
     * @remarks
     * The provided pool should be a long-lived singleton instance.
     */
    constructor(private pool: Pool) {}

    /**
     * Executes an asynchronous operation within a database transaction.
     *
     * Transaction flow:
     * 1. Acquire client from pool
     * 2. BEGIN
     * 3. Execute callback
     * 4. COMMIT (if successful)
     * 5. ROLLBACK (if error occurs)
     * 6. Release client (always)
     *
     * @template T - Return type of the callback.
     *
     * @param callback - Async function executed inside the transaction.
     * Receives a transaction-scoped PoolClient.
     *
     * @returns The resolved value returned by the callback.
     *
     * @throws Rethrows any error produced by the callback
     * after performing ROLLBACK.
     *
     * @example
     * await transactionManager.transaction(async client => {
     *   await client.query('INSERT INTO users(name) VALUES($1)', ['John'])
     * })
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

            try {
                await client.query('ROLLBACK')
            } catch {
                await client.query('ROLLBACK')
                throw error
            }

            throw error

        } finally {
            client.release()
        }
    }
}