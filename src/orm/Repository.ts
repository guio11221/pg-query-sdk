import {QueryBuilder, QueryExecutor} from "../index";
import {Dialect} from "../dialects/Dialect";

export default abstract class Repository<T> {
    constructor(
        protected table: string,
        protected executor: QueryExecutor,
        protected dialect: Dialect
    ) {}

    qb() {
        return new QueryBuilder<T>(
            this.table,
            this.executor,
            this.dialect
        )
    }

    async findById(id: number): Promise<T | null> {
        const rows = await this.qb()
            .where({ id })
            .limit(1)
            .execute()

        return rows[0] ?? null
    }

    async insert(data: Partial<T>) {
        // implementação insert segura
    }

    async update(data: Partial<T>) {
        // implementação update segura
    }

    async delete(data: Partial<T>) {
        // soft delete opcional
    }
}