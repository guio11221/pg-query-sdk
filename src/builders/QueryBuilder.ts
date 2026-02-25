import ParamContext from '../core/ParamContext'
import ConditionBuilder from './ConditionBuilder'
import QueryExecutor from '../core/QueryExecutor'
import {Dialect} from "../dialects/Dialect";

type JoinType = 'INNER' | 'LEFT' | 'RIGHT'

/**
 * A fluent SQL query builder for constructing and executing database queries.
 * This builder is specifically designed for the `builders` directory and might have a different scope or feature set
 * compared to other QueryBuilder implementations in the project.
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
    private ctes: any[] = [] // TODO: Define a proper type for CTEs
    /**
     * The FROM clause of the query.
     */
    private fromClause: string
    /**
     * The condition builder for WHERE clauses.
     */
    private condition: ConditionBuilder
    /**
     * The condition builder for HAVING clauses.
     */
    private havingCondition: ConditionBuilder
    /**
     * The parameter context for managing query parameters.
     */
    private ctx: ParamContext

    /**
     * Creates an instance of QueryBuilder.
     * @param table - The name of the table to query from.
     * @param executor - The query executor to use.
     * @param dialect - The database dialect to use.
     */
    constructor(
        table: string,
        private executor: QueryExecutor,
        dialect: Dialect
    ) {
        this.fromClause = table
        this.ctx = new ParamContext(dialect)
        this.condition = new ConditionBuilder(this.ctx)
        this.havingCondition = new ConditionBuilder(this.ctx)
    }

    /**
     * Specifies the fields to select.
     * @param fields - An array of field names.
     * @returns The current QueryBuilder instance.
     */
    select(fields: string[]) {
        this.fields = fields
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
    private addJoin(
        type: JoinType,
        table: string,
        localKey: string,
        foreignKey: string
    ) {
        this.joins.push(
            `${type} JOIN ${table} ON ${localKey} = ${foreignKey}`
        )
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
     * Sets the FROM clause to a subquery.
     * @param sub - The QueryBuilder instance representing the subquery.
     * @param alias - The alias for the subquery.
     * @returns The current QueryBuilder instance.
     */
    fromSubquery(sub: QueryBuilder, alias: string) {
        const {query, params} = sub.build()

        params.forEach(p => this.ctx.add(p))

        this.fromClause = `(${query}) AS ${alias}`
        return this
    }

    /**
     * Adds WHERE conditions based on an object.
     * @param obj - An object where keys are column names and values are the desired values.
     * @returns The current QueryBuilder instance.
     */
    where(obj: Record<string, any>) {
        this.condition.where(obj)
        return this
    }

    /**
     * Adds a WHERE condition with a subquery.
     * @param column - The column to apply the condition to.
     * @param operator - The operator ('IN' or 'NOT IN').
     * @param sub - The QueryBuilder instance representing the subquery.
     * @returns The current QueryBuilder instance.
     */
    whereSub(
        column: string,
        operator: 'IN' | 'NOT IN',
        sub: QueryBuilder
    ) {
        const {query, params} = sub.build()

        params.forEach(p => this.ctx.add(p))

        this.condition.raw(
            `${column} ${operator} (${query})`
        )

        return this
    }

    /**
     * Sets the LIMIT for the query.
     * @param limit - The maximum number of rows to return.
     * @returns The current QueryBuilder instance.
     */
    limit(limit: number) {
        this.limitCount = limit
        return this
    }

    /**
     * Builds the SQL query string and its parameters without executing it.
     * @returns An object containing the SQL query string and an array of parameters.
     */
    build() {
        const select = this.fields.length
            ? this.fields.join(', ')
            : '*'

        let query = `SELECT ${select}
                     FROM ${this.fromClause}`

        if (this.joins.length) {
            query += ' ' + this.joins.join(' ')
        }

        const whereClause = this.condition.build()
        if (whereClause) query += ' ' + whereClause

        if (this.limitCount) {
            query += ` LIMIT ${this.limitCount}`
        }

        return {
            query,
            params: this.ctx.getParams()
        }
    }

    /**
     * Executes the built SQL query and returns the results.
     * @returns A Promise that resolves to an array of results of type T.
     * @throws Error if no QueryExecutor is provided.
     */
    async execute(): Promise<T[]> {
        if (!this.executor) {
            throw new Error('No QueryExecutor provided')
        }

        const {query, params} = this.build()
        // @ts-ignore
        const result = await this.executor.execute(query, params)
        return result.rows
    }
}