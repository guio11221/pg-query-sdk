import ParamContext from '../core/ParamContext'
import ConditionBuilder from './ConditionBuilder'
import QueryExecutor from '../core/QueryExecutor'
import {Dialect} from '../dialects/Dialect'

type JoinType = 'INNER' | 'LEFT' | 'RIGHT'
type WhereInput<T> = | Partial<T> | Record<string, any> | Array<Record<string, any>>
const IDENTIFIER_PART = /^[A-Za-z_][A-Za-z0-9_]*$/
const QUOTED_IDENTIFIER_PART = /^"([^"]|"")+"$/
const SIMPLE_TABLE_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*|"([^"]|"")+"?)(\.([A-Za-z_][A-Za-z0-9_]*|"([^"]|"")+"?))*$/ // relaxed for quoted parts

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
    private orderByFields: { expression: string; raw: boolean }[] = []
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
     * Data to be inserted into the table.
     */
    private insertData?: Record<string, any>;

    /**
     * Data to be updated in the table.
     */
    private updateData?: Record<string, any>;

    /**
     * Flag to indicate if the query is a DELETE operation.
     */
    private deleteFlag: boolean = false;

    /**
     * Flag to indicate if the query should return distinct results.
     */
    private distinctFlag: boolean = false;

    /**
     * Array of QueryBuilder instances to be combined with UNION or UNION ALL.
     */
    private unionOperations: { query: QueryBuilder<any>; type: 'UNION' | 'UNION ALL' }[] = [];

    /**
     * Stores the aggregate function and column for queries like COUNT, SUM, AVG, etc.
     */
    private aggregateFunction?: { type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'; column: string };

    /**
     * The FROM clause of the query.
     */
    private fromClause: string
    private baseTableName?: string
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
        this.baseTableName = table
        this.fromClause = this.wrapTableExpression(table)
        this.ctx = new ParamContext(this.dialect)
        this.condition = new ConditionBuilder(
            this.ctx,
            (field) => this.wrapConditionalField(field)
        )
        this.havingCondition = new ConditionBuilder(
            this.ctx,
            (field) => this.wrapConditionalField(field)
        )
    }

    private assertNoDangerousSql(input: string, context: string): void {
        if (/;|--|\/\*|\*\//.test(input)) {
            throw new Error(`Unsafe SQL detected in ${context}`)
        }
    }

    private wrapIdentifierPart(part: string): string {
        const trimmed = part.trim()

        if (trimmed === '*') return '*'
        if (QUOTED_IDENTIFIER_PART.test(trimmed)) return trimmed
        if (IDENTIFIER_PART.test(trimmed)) {
            return this.dialect.wrapIdentifier(trimmed)
        }

        throw new Error(`Invalid identifier part: ${part}`)
    }

    private wrapDottedIdentifier(identifier: string, allowWildcard = false): string {
        this.assertNoDangerousSql(identifier, 'identifier')
        const parts = identifier.split('.').map(p => p.trim()).filter(Boolean)

        if (!parts.length) {
            throw new Error(`Invalid identifier: ${identifier}`)
        }

        return parts.map((part, index) => {
            if (part === '*' && allowWildcard && index === parts.length - 1) {
                return '*'
            }
            return this.wrapIdentifierPart(part)
        }).join('.')
    }

    private wrapTableExpression(tableExpr: string): string {
        const normalized = tableExpr.trim()
        this.assertNoDangerousSql(normalized, 'table expression')

        if (normalized.startsWith('(')) {
            return normalized
        }

        const withAs = normalized.match(/^(.+?)\s+AS\s+(.+)$/i)
        const withImplicitAlias = !withAs ? normalized.match(/^(.+?)\s+([A-Za-z_][A-Za-z0-9_]*|"([^"]|"")+"?)$/) : null

        if (withAs) {
            const tablePart = withAs[1].trim()
            const aliasPart = withAs[2].trim()
            return `${this.wrapDottedIdentifier(tablePart)} AS ${this.wrapIdentifierPart(aliasPart)}`
        }

        if (withImplicitAlias) {
            const tablePart = withImplicitAlias[1].trim()
            const aliasPart = withImplicitAlias[2].trim()
            return `${this.wrapDottedIdentifier(tablePart)} ${this.wrapIdentifierPart(aliasPart)}`
        }

        if (!SIMPLE_TABLE_PATTERN.test(normalized)) {
            throw new Error(`Invalid table expression: ${tableExpr}`)
        }

        return this.wrapDottedIdentifier(normalized)
    }

    private wrapSelectableField(field: string): string {
        const trimmed = field.trim()
        this.assertNoDangerousSql(trimmed, 'select field')

        if (trimmed === '*') {
            return '*'
        }

        // Allow explicit SQL expressions while still blocking obvious injection tokens.
        if (/\(|\)|\s+AS\s+/i.test(trimmed)) {
            return trimmed
        }

        return this.wrapDottedIdentifier(trimmed, true)
    }

    private wrapConditionalField(field: string): string {
        const trimmed = field.trim()
        this.assertNoDangerousSql(trimmed, 'condition field')

        if (/\(|\)/.test(trimmed)) {
            return trimmed
        }

        return this.wrapDottedIdentifier(trimmed, true)
    }

    private resolveWritableTableName(): string {
        const base = this.baseTableName?.trim()
        if (!base) {
            throw new Error('Writable operations require a concrete table name')
        }
        if (base.includes(' ') || base.startsWith('(')) {
            throw new Error('INSERT/UPDATE/DELETE do not support aliased tables or subqueries')
        }
        return this.wrapDottedIdentifier(base)
    }

    /**
     * Specifies the fields to select.
     * @param fields - An array of field names or keys of T.
     * @returns The current QueryBuilder instance.
     */
    select(fields: (keyof T | string)[] | keyof T | string) {
        if(!fields) throw new Error('fields on select must be a string')

        const normalized = Array.isArray(fields) ? fields : [fields]
        this.fields = normalized.map(field => this.wrapSelectableField(String(field)))
        return this
    }

    /**
     * Sets the data to be inserted into the table.
     * @param data - An object where keys are column names and values are the data to insert.
     * @returns The current QueryBuilder instance.
     */
    insert(data: Record<string, any>): QueryBuilder<T> {
        this.insertData = data;
        return this;
    }

    /**
     * Sets the data to be updated in the table.
     * @param data - An object where keys are column names and values are the new data.
     * @returns The current QueryBuilder instance.
     */
    update(data: Record<string, any>): QueryBuilder<T> {
        this.updateData = data;
        return this;
    }

    /**
     * Marks the query as a DELETE operation.
     * @returns The current QueryBuilder instance.
     */
    delete(): QueryBuilder<T> {
        this.deleteFlag = true;
        return this;
    }

    /**
     * Adds the DISTINCT keyword to the SELECT query.
     * @returns The current QueryBuilder instance.
     */
    distinct(): QueryBuilder<T> {
        this.distinctFlag = true;
        return this;
    }

    /**
     * Adds a UNION clause to combine the results of the current query with another query.
     * The unioned query must have the same number of columns and compatible data types.
     * @param queryBuilder - The QueryBuilder instance to union with.
     * @returns The current QueryBuilder instance.
     */
    union(queryBuilder: QueryBuilder<T>): QueryBuilder<T> {
        this.unionOperations.push({ query: queryBuilder, type: 'UNION' });
        return this;
    }

    /**
     * Adds a UNION ALL clause to combine the results of the current query with another query, including duplicates.
     * The unioned query must have the same number of columns and compatible data types.
     * @param queryBuilder - The QueryBuilder instance to union all with.
     * @returns The current QueryBuilder instance.
     */
    unionAll(queryBuilder: QueryBuilder<T>): QueryBuilder<T> {
        this.unionOperations.push({ query: queryBuilder, type: 'UNION ALL' });
        return this;
    }

    /**
     * Performs a COUNT aggregate function on the specified column.
     * @param column - The column to count. Defaults to '*'.
     * @returns The current QueryBuilder instance.
     */
    count(column: string = '*'): QueryBuilder<T> {
        this.aggregateFunction = { type: 'COUNT', column };
        return this;
    }

    /**
     * Performs a SUM aggregate function on the specified column.
     * @param column - The column to sum.
     * @returns The current QueryBuilder instance.
     */
    sum(column: string): QueryBuilder<T> {
        this.aggregateFunction = { type: 'SUM', column };
        return this;
    }

    /**
     * Performs an AVG aggregate function on the specified column.
     * @param column - The column to average.
     * @returns The current QueryBuilder instance.
     */
    avg(column: string): QueryBuilder<T> {
        this.aggregateFunction = { type: 'AVG', column };
        return this;
    }

    /**
     * Performs a MIN aggregate function on the specified column.
     * @param column - The column to find the minimum value of.
     * @returns The current QueryBuilder instance.
     */
    min(column: string): QueryBuilder<T> {
        this.aggregateFunction = { type: 'MIN', column };
        return this;
    }

    /**
     * Performs a MAX aggregate function on the specified column.
     * @param column - The column to find the maximum value of.
     * @returns The current QueryBuilder instance.
     */
    max(column: string): QueryBuilder<T> {
        this.aggregateFunction = { type: 'MAX', column };
        return this;
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
        const wrappedTable = this.wrapTableExpression(table)
        const wrappedLocalKey = this.wrapDottedIdentifier(localKey, true)
        const wrappedForeignKey = this.wrapDottedIdentifier(foreignKey, true)
        this.joins.push(`${type} JOIN ${wrappedTable} ON ${wrappedLocalKey} = ${wrappedForeignKey}`)
        return this
    }

    /**
     * Adds a raw join clause. Use only with trusted SQL fragments.
     */
    unsafeJoinRaw(joinClause: string) {
        this.assertNoDangerousSql(joinClause, 'join raw')
        this.joins.push(joinClause.trim())
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
        this.assertNoDangerousSql(expression, 'where raw')
        this.condition.raw(expression)
        return this
    }

    /**
     * Alias with explicit unsafe naming for raw SQL clauses.
     */
    unsafeWhereRaw(expression: string) {
        return this.whereRaw(expression)
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
            this.groupByFields.push(...fields.map(field => this.wrapDottedIdentifier(field, true)))
        } else {
            this.groupByFields.push(this.wrapDottedIdentifier(fields, true))
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
        this.assertNoDangerousSql(expr, 'having raw')
        this.havingCondition.raw(expr)
        return this
    }

    /**
     * Alias with explicit unsafe naming for raw SQL clauses.
     */
    unsafeHavingRaw(expr: string) {
        return this.havingRaw(expr)
    }

    /**
     * Specifies the order by clause.
     * @param column - The column to order by.
     * @param direction - The order direction ('ASC' or 'DESC'). Defaults to 'ASC'.
     * @returns The current QueryBuilder instance.
     */
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
        const normalizedDirection = direction.toUpperCase() as 'ASC' | 'DESC'
        this.orderByFields.push({
            expression: `${this.wrapDottedIdentifier(column, true)} ${normalizedDirection}`,
            raw: false
        })
        return this
    }

    /**
     * Adds a raw ORDER BY expression for advanced use cases.
     */
    unsafeOrderByRaw(expression: string) {
        this.assertNoDangerousSql(expression, 'order by raw')
        this.orderByFields.push({
            expression: expression.trim(),
            raw: true
        })
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
        this.baseTableName = undefined
        this.fromClause = `(${query}) AS ${this.wrapIdentifierPart(alias)}`
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
        qb.orderByFields = this.orderByFields.map(order => ({...order}))
        qb.limitCount = this.limitCount
        qb.offsetCount = this.offsetCount
        qb.ctes = [...this.ctes]
        qb.baseTableName = this.baseTableName
        qb.insertData = this.insertData ? {...this.insertData} : undefined; // Clone insertData
        qb.updateData = this.updateData ? {...this.updateData} : undefined; // Clone updateData
        qb.deleteFlag = this.deleteFlag; // Clone deleteFlag
        qb.distinctFlag = this.distinctFlag; // Clone distinctFlag
        qb.unionOperations = this.unionOperations.map(op => ({
            query: op.query.clone(), // Deep clone the unioned QueryBuilder
            type: op.type
        }));
        qb.aggregateFunction = this.aggregateFunction ? { ...this.aggregateFunction } : undefined; // Clone aggregateFunction
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
        if (this.insertData) {
            const columns = Object.keys(this.insertData);
            const values = Object.values(this.insertData);

            const columnNames = columns.map(col => this.wrapDottedIdentifier(col)).join(', ');
            const placeholders = values.map(value => this.ctx.add(value)).join(', ');

            const query = `INSERT INTO ${this.resolveWritableTableName()} (${columnNames}) VALUES (${placeholders})`;
            return {
                query,
                params: this.ctx.getParams()
            };
        }

        if (this.updateData) {
            const updates = Object.entries(this.updateData)
                .map(([key, value]) => `${this.wrapDottedIdentifier(key)} = ${this.ctx.add(value)}`)
                .join(', ');

            let query = `UPDATE ${this.resolveWritableTableName()} SET ${updates}`;

            const where = this.condition.build();
            if (where) query += ' ' + where;

            return {
                query,
                params: this.ctx.getParams()
            };
        }

        if (this.deleteFlag) {
            let query = `DELETE FROM ${this.resolveWritableTableName()}`;

            const where = this.condition.build();
            if (where) query += ' ' + where;

            return {
                query,
                params: this.ctx.getParams()
            };
        }

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

        let selectClause: string;
        if (this.aggregateFunction) {
            const column = this.aggregateFunction.column === '*'
                ? '*'
                : this.wrapDottedIdentifier(this.aggregateFunction.column, true);
            selectClause = `${this.aggregateFunction.type}(${column})`;
        } else {
            selectClause = this.fields.length ? this.fields.join(', ') : '*';
        }
        
        const distinct = this.distinctFlag ? 'DISTINCT ' : '';

        query += `SELECT ${distinct}${selectClause} FROM ${this.fromClause}`

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
            query += ` ORDER BY ${this.orderByFields.map(order => order.expression).join(', ')}`
        }

        if (this.limitCount) {
            query += ` LIMIT ${this.limitCount}`
        }

        if (this.offsetCount) {
            query += ` OFFSET ${this.offsetCount}`
        }

        // Handle UNION operations
        for (const op of this.unionOperations) {
            const { query: unionedQuerySql, params: unionedQueryParams } = op.query.build();
            unionedQueryParams.forEach(p => this.ctx.add(p)); // Add parameters from unioned queries
            query += ` ${op.type} (${unionedQuerySql})`;
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
     * For SELECT queries, it returns an array of results of type T.
     * For INSERT/UPDATE/DELETE queries, it returns the number of affected rows.
     * For aggregate functions, it returns a single numeric value or null.
     * @returns A Promise that resolves to an array of results (T[]), the number of affected rows (number), or a single aggregate value (number | null).
     */
    async execute(): Promise<T[] | number | null> {
        const {query, params} = this.build()
        const result = await this.executor.execute(
            query,
            params,
            this.cacheTTL
        )

        if (this.insertData || this.updateData || this.deleteFlag) {
            return result.rowCount;
        }

        if (this.aggregateFunction) {
            if (result.rows && result.rows.length > 0) {
                const aggregateKey = this.aggregateFunction.type.toLowerCase();
                return result.rows[0][aggregateKey] !== undefined ? Number(result.rows[0][aggregateKey]) : null;
            }
            return null;
        }
        
        return result.rows
    }

    /**
     * Executes the query and returns the first result, or null if no results are found.
     * Automatically applies a LIMIT 1 to the query.
     * @returns A Promise that resolves to the first result of type T, or null.
     */
    async first(): Promise<T | null> {
        const qb = this.clone(); // Clone to avoid modifying the original query builder
        qb.limit(1);
        const results = await qb.execute() as T[]; // Cast to T[] because we expect rows from a SELECT
        return results.length > 0 ? results[0] : null;
    }
}
