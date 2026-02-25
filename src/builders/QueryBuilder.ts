import ParamContext from '../core/ParamContext'
import ConditionBuilder from './ConditionBuilder'
import QueryExecutor from '../core/QueryExecutor'
import {Dialect} from "../dialects/Dialect";

type JoinType = 'INNER' | 'LEFT' | 'RIGHT'

export default class QueryBuilder<T = any> {
  private fields: string[] = []
  private joins: string[] = []
  private groupByFields: string[] = []
  private orderByFields: string[] = []
  private limitCount?: number
  private offsetCount?: number
  private ctes: any[] = []
  private fromClause: string
  private condition: ConditionBuilder
  private havingCondition: ConditionBuilder
  private ctx: ParamContext

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

  /* ================= SELECT ================= */

  select(fields: string[]) {
    this.fields = fields
    return this
  }

  /* ================= JOINS ================= */

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

  join(table: string, localKey: string, foreignKey: string) {
    return this.addJoin('INNER', table, localKey, foreignKey)
  }

  leftJoin(table: string, localKey: string, foreignKey: string) {
    return this.addJoin('LEFT', table, localKey, foreignKey)
  }

  rightJoin(table: string, localKey: string, foreignKey: string) {
    return this.addJoin('RIGHT', table, localKey, foreignKey)
  }

  /* ================= SUBQUERY FROM ================= */

  fromSubquery(sub: QueryBuilder, alias: string) {
    const { query, params } = sub.build()

    params.forEach(p => this.ctx.add(p))

    this.fromClause = `(${query}) AS ${alias}`
    return this
  }

  /* ================= WHERE ================= */

  where(obj: Record<string, any>) {
    this.condition.where(obj)
    return this
  }

  whereSub(
      column: string,
      operator: 'IN' | 'NOT IN',
      sub: QueryBuilder
  ) {
    const { query, params } = sub.build()

    params.forEach(p => this.ctx.add(p))

    this.condition.raw(
        `${column} ${operator} (${query})`
    )

    return this
  }

  /* ================= LIMIT ================= */

  limit(limit: number) {
    this.limitCount = limit
    return this
  }

  /* ================= BUILD ================= */

  build() {
    const select = this.fields.length
        ? this.fields.join(', ')
        : '*'

    let query = `SELECT ${select} FROM ${this.fromClause}`

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

  async execute() {
    if (!this.executor) {
      throw new Error('No QueryExecutor provided')
    }

    const { query, params } = this.build()
    // @ts-ignore
    const result = await this.executor.execute(query, params)
    return result.rows
  }
}