import Repository from "../orm/Repository";

/**
 * Manages a list of new, dirty, and removed entities for transactional operations.
 */
export default class UnitOfWork {
    private newEntities: any[] = []
    private dirtyEntities: any[] = []
    private removedEntities: any[] = []

    /**
     * Registers an entity as new, to be inserted on commit.
     * @param entity - The entity to register.
     */
    registerNew(entity: any) {
        this.newEntities.push(entity)
    }

    /**
     * Registers an entity as dirty, to be updated on commit.
     * @param entity - The entity to register.
     */
    registerDirty(entity: any) {
        this.dirtyEntities.push(entity)
    }

    /**
     * Registers an entity as removed, to be deleted on commit.
     * @param entity - The entity to register.
     */
    registerRemoved(entity: any) {
        this.removedEntities.push(entity)
    }

    /**
     * Commits all registered changes (insertions, updates, deletions) using the provided repository.
     * @param repository - The repository to use for committing changes.
     */
    async commit(repository: Repository<any>) {
        for (const e of this.newEntities)
            await repository.insert(e)

        for (const e of this.dirtyEntities)
            await repository.update(e)

        for (const e of this.removedEntities)
            await repository.delete(e)
    }
}