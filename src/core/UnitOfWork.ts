import Repository from "../orm/Repository";

export default class UnitOfWork {
    private newEntities: any[] = []
    private dirtyEntities: any[] = []
    private removedEntities: any[] = []

    registerNew(entity: any) {
        this.newEntities.push(entity)
    }

    registerDirty(entity: any) {
        this.dirtyEntities.push(entity)
    }

    registerRemoved(entity: any) {
        this.removedEntities.push(entity)
    }

    async commit(repository: Repository<any>) {
        for (const e of this.newEntities)
            await repository.insert(e)

        for (const e of this.dirtyEntities)
            await repository.update(e)

        for (const e of this.removedEntities)
            await repository.delete(e)
    }
}