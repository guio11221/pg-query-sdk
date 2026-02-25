import {QueryBuilder, QueryExecutor} from "../index";
import {Dialect} from "../dialects/Dialect";

/**
 * Abstract base class for repositories, providing common database operations.
 * @template T The type of the entity managed by the repository.
 */
export default abstract class Repository<T> {
    /**
     * Creates an instance of Repository.
     * @param table - The name of the database table associated with this repository.
     * @param executor - The QueryExecutor instance for executing queries.
     * @param dialect - The Dialect instance for database-specific syntax.
     */
    constructor(
        protected table: string,
        protected executor: QueryExecutor,
        protected dialect: Dialect
    ) {
    }

    /**
     * Returns a new QueryBuilder instance for the repository's table.
     * @returns A QueryBuilder instance.
     */
    qb() {
        return new QueryBuilder<T>(
            this.table,
            this.executor,
            this.dialect
        )
    }

    /**
     * Finds an entity by its ID.
     * @param id - The ID of the entity to find.
     * @returns A Promise that resolves to the found entity or null if not found.
     */
    async findById(id: number): Promise<T | null> {
        const rows = await this.qb()
            .where({id})
            .limit(1)
            .execute()

        return rows[0] ?? null
    }

    /**
     * Inserts a new entity into the database.
     * This method should be implemented by concrete repository classes.
     * @param data - The partial entity data to insert.
     */
    async insert(data: Partial<T>) {
        // implementação insert segura
    }

    /**
     * Updates an existing entity in the database.
     * This method should be implemented by concrete repository classes.
     * @param data - The partial entity data to update.
     */
    async update(data: Partial<T>) {
        // implementação update segura
    }

    /**
     * Deletes an entity from the database.
     * This method should be implemented by concrete repository classes.
     * @param data - The partial entity data to delete (e.g., containing the ID).
     */
    async delete(data: Partial<T>) {
        // soft delete opcional
    }
}