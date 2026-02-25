import {Pool, PoolClient} from 'pg'

export default class TransactionManager {
    constructor(private pool: Pool) {
    }

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