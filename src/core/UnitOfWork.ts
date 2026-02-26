import Repository from "../orm/Repository"

/**
 * Implements the Unit of Work pattern.
 *
 * Responsibilities:
 * - Track new entities (to be inserted)
 * - Track modified entities (to be updated)
 * - Track removed entities (to be deleted)
 * - Coordinate persistence operations in a single commit phase
 *
 * @remarks
 * This implementation assumes:
 * - A single repository instance handles all tracked entities
 * - The repository methods are idempotent and transactional-safe
 *
 * It does not automatically clear state after commit.
 */
export default class UnitOfWork<T = any> {

    /**
     * Entities scheduled for insertion.
     */
    private newEntities: T[] = []

    /**
     * Entities scheduled for update.
     */
    private dirtyEntities: T[] = []

    /**
     * Entities scheduled for deletion.
     */
    private removedEntities: T[] = []

    /**
     * Registers an entity for insertion.
     *
     * @param entity - The entity instance to persist.
     *
     * @remarks
     * Should be called when an entity is newly created.
     */
    registerNew(entity: T): void {
        this.newEntities.push(entity)
    }

    /**
     * Registers an entity for update.
     *
     * @param entity - The entity instance to update.
     *
     * @remarks
     * Should be called when an existing entity state changes.
     */
    registerDirty(entity: T): void {
        this.dirtyEntities.push(entity)
    }

    /**
     * Registers an entity for deletion.
     *
     * @param entity - The entity instance to remove.
     *
     * @remarks
     * Should be called when an entity is marked for removal.
     */
    registerRemoved(entity: T): void {
        this.removedEntities.push(entity)
    }

    /**
     * Persists all tracked changes using the provided repository.
     *
     * Execution order:
     * 1. Inserts
     * 2. Updates
     * 3. Deletes
     *
     * @param repository - Repository responsible for persistence operations.
     *
     * @returns Promise that resolves when all operations complete.
     *
     * @remarks
     * - Operations are executed sequentially.
     * - Does not automatically wrap execution in a transaction.
     * - Does not clear internal state after commit.
     *
     * For atomic consistency, this method should be executed
     * inside a transaction boundary.
     */
    async commit(repository: Repository<T>): Promise<void> {

        for (const entity of this.newEntities)
            await repository.insert(entity)

        for (const entity of this.dirtyEntities)
            await repository.update(entity)

        for (const entity of this.removedEntities)
            await repository.delete(entity)
    }

    /**
     * Clears all tracked entities.
     *
     * @remarks
     * Useful after a successful commit.
     */
    clear(): void {
        this.newEntities = []
        this.dirtyEntities = []
        this.removedEntities = []
    }
}