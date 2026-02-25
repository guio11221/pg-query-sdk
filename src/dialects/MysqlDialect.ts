import {Dialect} from "./Dialect";

/**
 * Implements the Dialect interface for MySQL, providing MySQL-specific placeholder and identifier wrapping.
 */
export default class MysqlDialect implements Dialect {
    /**
     * Returns a MySQL-specific parameter placeholder '?'.
     * @returns The string '?'.
     */
    placeholder() {
        return '?'
    }

    /**
     * Wraps a MySQL identifier with backticks.
     * @param id - The identifier to wrap.
     * @returns The backtick-wrapped identifier.
     */
    wrapIdentifier(id: string) {
        return `\`${id}\``
    }
}