import ParamContext from '../core/ParamContext'
import ConditionBuilder from './ConditionBuilder'
import QueryExecutor from '../core/QueryExecutor'
import {Dialect} from '../dialects/Dialect'

type JoinType = 'INNER' | 'LEFT' | 'RIGHT'

export default class QueryBuilder<T = any> {
    private fields: string[] = []
    private joins: string[] = []
    private groupByFields: string[] = []
    private orderByFields: string[] = []
    private limitCount?: number
    private offsetCount?: number
    private ctes: {
        name: string
        query: QueryBuilder<any>
        recursive?: boolean
    }[] = []

    private fromClause: string
    private ctx: ParamContext
    private condition: ConditionBuilder
    private havingCondition: ConditionBuilder

    constructor(
        table: string,
        private executor: QueryExecutor,
        private dialect: Dialect,
        private cacheTTL?: number | 0
    ) {
        this.fromClause = table
        this.ctx = new ParamContext(this.dialect)
        this.condition = new ConditionBuilder(this.ctx)
        this.havingCondition = new ConditionBuilder(this.ctx)
    }

    select(fields: (keyof T | string)[]) {
        this.fields = fields.map(String)
        return this
    }

    private addJoin(type: JoinType, table: string, localKey: string, foreignKey: string) {
        this.joins.push(`${type} JOIN ${table} ON ${localKey} = ${foreignKey}`)
        return this
    }

    join(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('INNER', table, localKey, foreignKey)
    }

    leftJoin(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('LEFT', table, localKey, foreignKey)
    }

    rightJoin(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('RIGHT', table, localKey, foreignKey)
    }

    where(obj: Partial<T>) {
        this.condition.where(obj as any)
        return this
    }

    whereRaw(expression: string) {
        this.condition.raw(expression)
        return this
    }

    andGroup(cb: (qb: ConditionBuilder) => void) {
        this.condition.andGroup(cb)
        return this
    }

    orGroup(cb: (qb: ConditionBuilder) => void) {
        this.condition.orGroup(cb)
        return this
    }

    groupBy(fields: string | string[]) {
        if (Array.isArray(fields)) {
            this.groupByFields.push(...fields)
        } else {
            this.groupByFields.push(fields)
        }
        return this
    }

    having(obj: Record<string, any>) {
        this.havingCondition.where(obj)
        return this
    }

    havingRaw(expr: string) {
        this.havingCondition.raw(expr)
        return this
    }

    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
        this.orderByFields.push(`${column} ${direction}`)
        return this
    }

    limit(value: number) {
        this.limitCount = value
        return this
    }

    offset(value: number) {
        this.offsetCount = value
        return this
    }

    with(name: string, subQuery: QueryBuilder<any>, recursive = false) {
        this.ctes.push({name, query: subQuery, recursive})
        return this
    }

    fromSubquery(sub: QueryBuilder<any>, alias: string) {
        const {query, params} = sub.build()
        params.forEach(p => this.ctx.add(p))
        this.fromClause = `(${query}) AS ${alias}`
        return this
    }

    clone(): QueryBuilder<T> {
        const qb = new QueryBuilder<T>(
            this.fromClause,
            this.executor,
            this.dialect,
            this.cacheTTL
        )

        qb.fields = [...this.fields]
        qb.joins = [...this.joins]
        qb.groupByFields = [...this.groupByFields]
        qb.orderByFields = [...this.orderByFields]
        qb.limitCount = this.limitCount
        qb.offsetCount = this.offsetCount
        qb.ctes = [...this.ctes]

        return qb
    }

    build() {
        let query = ''

        if (this.ctes.length) {
            const recursive = this.ctes.some(c => c.recursive)
            query += `WITH ${recursive ? 'RECURSIVE ' : ''}`

            const parts = this.ctes.map(cte => {
                const {query: q, params} = cte.query.build()
                params.forEach(p => this.ctx.add(p))
                return `${cte.name} AS (${q})`
            })

            query += parts.join(', ') + ' '
        }

        const select = this.fields.length ? this.fields.join(', ') : '*'

        query += `SELECT ${select} FROM ${this.fromClause}`

        if (this.joins.length) {
            query += ' ' + this.joins.join(' ')
        }

        const where = this.condition.build()
        if (where) query += ' ' + where

        if (this.groupByFields.length) {
            query += ` GROUP BY ${this.groupByFields.join(', ')}`
        }

        const having = this.havingCondition.build('HAVING')
        if (having) query += ' ' + having

        if (this.orderByFields.length) {
            query += ` ORDER BY ${this.orderByFields.join(', ')}`
        }

        if (this.limitCount) {
            query += ` LIMIT ${this.limitCount}`
        }

        if (this.offsetCount) {
            query += ` OFFSET ${this.offsetCount}`
        }

        return {
            query,
            params: this.ctx.getParams()
        }
    }

    async execute(): Promise<T[]> {
        const {query, params} = this.build()
        const result = await this.executor.execute(
            query,
            params,
            this.cacheTTL
        )
        return result.rows
    }
}