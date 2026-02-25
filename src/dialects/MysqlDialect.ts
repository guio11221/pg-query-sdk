import {Dialect} from "./Dialect";

export default class MysqlDialect implements Dialect {
    placeholder() {
        return '?'
    }

    wrapIdentifier(id: string) {
        return `\`${id}\``
    }
}