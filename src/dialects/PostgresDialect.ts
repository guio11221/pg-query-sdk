import {Dialect} from "./Dialect";


export default class PostgresDialect implements Dialect {
    placeholder(index: number) {
        return `$${index}`
    }

    wrapIdentifier(id: string) {
        return `"${id}"`
    }
}