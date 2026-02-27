import ParamContext from '../core/ParamContext'
import ConditionBuilder from './ConditionBuilder'
import QueryExecutor from '../core/QueryExecutor'
import {Dialect} from '../dialects/Dialect'

type JoinType = 'INNER' | 'LEFT' | 'RIGHT'
type WhereInput<T> = | Partial<T> | Record<string, any> | Array<Record<string, any>>

/**
 * A fluent SQL query builder for constructing and executing database queries.
 * @template T The expected type of the results.
 */
export default class QueryBuilder<T = any> {
    /**
     * The fields to be selected in the query.
     */
    private fields: string[] = []
    /**
     * The join clauses for the query.
     */
    private joins: string[] = []
    /**
     * The fields to group by.
     */
    private groupByFields: string[] = []
    /**
     * The fields to order by.
     */
    private orderByFields: string[] = []
    /**
     * The maximum number of rows to return.
     */
    private limitCount?: number
    /**
     * The number of rows to skip.
     */
    private offsetCount?: number
    /**
     * Common Table Expressions (CTEs) defined for the query.
     */
    private ctes: {
        name: string
        query: QueryBuilder<any>
        recursive?: boolean
    }[] = []

    /**
     * The FROM clause of the query.
     */
    private fromClause: string
    /**
     * The parameter context for managing query parameters.
     */
    private ctx: ParamContext
    /**
     * The condition builder for WHERE clauses.
     */
    private condition: ConditionBuilder
    /**
     * The condition builder for HAVING clauses.
     */
    private havingCondition: ConditionBuilder

    /**
     * Creates an instance of QueryBuilder.
     * @param table - The name of the table to query from.
     * @param executor - The query executor to use.
     * @param dialect - The database dialect to use.
     * @param cacheTTL - Optional time-to-live for query caching.
     */
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

    /**
     * Specifies the fields to select.
     * @param fields - An array of field names or keys of T.
     * @returns The current QueryBuilder instance.
     */
    select(fields: (keyof T | string)[] | keyof T | string) {
        if(!fields) throw new Error('fields on select must be a string')

        const normalized = Array.isArray(fields) ? fields : [fields]
        this.fields = normalized.map(String)
        return this
    }
    /**
     * Adds a join clause to the query.
     * @param type - The type of join (INNER, LEFT, RIGHT).
     * @param table - The table to join.
     * @param localKey - The local key for the join condition.
     * @param foreignKey - The foreign key for the join condition.
     * @returns The current QueryBuilder instance.
     */
    private addJoin(type: JoinType, table: string, localKey: string, foreignKey: string) {
        this.joins.push(`${type} JOIN ${table} ON ${localKey} = ${foreignKey}`)
        return this
    }

    /**
     * Adds an INNER JOIN clause.
     * @param table - The table to join.
     * @param localKey - The local key for the join condition.
     * @param foreignKey - The foreign key for the join condition.
     * @returns The current QueryBuilder instance.
     */
    join(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('INNER', table, localKey, foreignKey)
    }

    /**
     * Adds a LEFT JOIN clause.
     * @param table - The table to join.
     * @param localKey - The local key for the join condition.
     * @param foreignKey - The foreign key for the join condition.
     * @returns The current QueryBuilder instance.
     */
    leftJoin(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('LEFT', table, localKey, foreignKey)
    }

    /**
     * Adds a RIGHT JOIN clause.
     * @param table - The table to join.
     * @param localKey - The local key for the join condition.
     * @param foreignKey - The foreign key for the join condition.
     * @returns The current QueryBuilder instance.
     */
    rightJoin(table: string, localKey: string, foreignKey: string) {
        return this.addJoin('RIGHT', table, localKey, foreignKey)
    }

    /**
     * Adds WHERE conditions based on an object.
     * @param obj - An object where keys are column names and values are the desired values.
     * @returns The current QueryBuilder instance.
     */
    where(obj: WhereInput<T>) {
        this.condition.where(obj as any)
        return this
    }

    /**
     * Adds a raw WHERE expression.
     * @param expression - The raw SQL expression for the WHERE clause.
     * @returns The current QueryBuilder instance.
     */
    whereRaw(expression: string) {
        this.condition.raw(expression)
        return this
    }

    /**
     * Adds an AND group of conditions.
     * @param cb - A callback function that receives a ConditionBuilder to define conditions within the group.
     * @returns The current QueryBuilder instance.
     */
    andGroup(cb: (qb: ConditionBuilder) => void) {
        this.condition.andGroup(cb)
        return this
    }

    /**
     * Adds an OR group of conditions.
     * @param cb - A callback function that receives a ConditionBuilder to define conditions within the group.
     * @returns The current QueryBuilder instance.
     */
    orGroup(cb: (qb: ConditionBuilder) => void) {
        this.condition.orGroup(cb)
        return this
    }

    /**
     * Specifies fields to group by.
     * @param fields - A single field name or an array of field names.
     * @returns The current QueryBuilder instance.
     */
    groupBy(fields: string | string[]) {
        if (Array.isArray(fields)) {
            this.groupByFields.push(...fields)
        } else {
            this.groupByFields.push(fields)
        }
        return this
    }

    /**
     * Adds HAVING conditions based on an object.
     * @param obj - An object where keys are column names and values are the desired values.
     * @returns The current QueryBuilder instance.
     */
    having(obj: Record<string, any>) {
        this.havingCondition.where(obj)
        return this
    }

    /**
     * Adds a raw HAVING expression.
     * @param expr - The raw SQL expression for the HAVING clause.
     * @returns The current QueryBuilder instance.
     */
    havingRaw(expr: string) {
        this.havingCondition.raw(expr)
        return this
    }

    /**
     * Specifies the order by clause.
     * @param column - The column to order by.
     * @param direction - The order direction ('ASC' or 'DESC'). Defaults to 'ASC'.
     * @returns The current QueryBuilder instance.
     */
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
        this.orderByFields.push(`${column} ${direction}`)
        return this
    }

    /**
     * Sets the LIMIT for the query.
     * @param value - The maximum number of rows to return.
     * @returns The current QueryBuilder instance.
     */
    limit(value: number) {
        this.limitCount = value
        return this
    }

    /**
     * Sets the OFFSET for the query.
     * @param value - The number of rows to skip.
     * @returns The current QueryBuilder instance.
     */
    offset(value: number) {
        this.offsetCount = value
        return this
    }

    /**
     * Adds a Common Table Expression (CTE) to the query.
     * @param name - The name of the CTE.
     * @param subQuery - The QueryBuilder instance representing the subquery for the CTE.
     * @param recursive - Whether the CTE is recursive. Defaults to false.
     * @returns The current QueryBuilder instance.
     */
    with(name: string, subQuery: QueryBuilder<any>, recursive = false) {
        this.ctes.push({name, query: subQuery, recursive})
        return this
    }

    /**
     * Sets the FROM clause to a subquery.
     * @param sub - The QueryBuilder instance representing the subquery.
     * @param alias - The alias for the subquery.
     * @returns The current QueryBuilder instance.
     */
    fromSubquery(sub: QueryBuilder<any>, alias: string) {
        const {query, params} = sub.build()
        params.forEach(p => this.ctx.add(p))
        this.fromClause = `(${query}) AS ${alias}`
        return this
    }

    /**
     * Creates a clone of the current QueryBuilder instance.
     * @returns A new QueryBuilder instance with the same state.
     */
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
        qb.condition = this.condition.clone()
        qb.havingCondition = this.havingCondition.clone()
        qb.ctx = this.ctx.clone()

        return qb
    }

    /**
     * Builds the SQL query string and its parameters without executing it.
     * @returns An object containing the SQL query string and an array of parameters.
     */
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

    /**
     * Returns the SQL query string without executing it.
     * @returns The SQL query string.
     */
    show(): string {
        return this.build().query
    }

    /**
     * Executes the built SQL query and returns the results.
     * @returns A Promise that resolves to an array of results of type T.
     */
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