# PG QUERY SDK (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Architecture: Hexagonal](https://img.shields.io/badge/Architecture-Hexagonal-green.svg)](#-arquitetura)

Uma biblioteca robusta e tipada para integração com banco de dados **PostgresSQL**. Construída sob os princípios da **Arquitetura Hexagonal**, garantindo que sua integração seja escalável, testável e fácil de manter.



**PostgreSQL** SDK com suporte a:

- Query Builder fluente
- Executor baseado em Pool
- Compatível com CommonJS e ESM
- Dual build (CJS + ESM)

---

# 📦 Instalação

```bash
npm install pg-query-sdk
```

Ou localmente:

```bash
npm install .
```

# 🏗 Arquitetura

O módulo é composto por duas camadas principais:

## 1️⃣ QueryBuilder

Responsável por construir a query SQL de forma programática.

Ele **não executa nada**, apenas retorna:

- query (string SQL)
- params (array de parâmetros)

### Exemplo

```js
const { QueryBuilder } = require('pg-query-sdk')

const qb = new QueryBuilder('users')
  .select(['id', 'name'])
  .limit(10)

const { query, params } = qb.build()

console.log(query)
// SELECT id, name FROM users LIMIT 10
```

---

## 2️⃣ QueryExecutor

Responsável por executar a query no PostgreSQL usando Pool do driver `pg`.

Internamente utiliza:

- Pool de conexões
- connect()
- release()
- Execução segura com parâmetros

### Exemplo

```js
const { QueryExecutor } = require('pg-query-sdk')

const executor = new QueryExecutor({
  connectionString: 'postgres://user:pass@localhost:5432/db'
})

const result = await executor.execute(
  'SELECT NOW()',
  []
)

console.log(result.rows)
```

---

# 🔄 Fluxo Interno

1. QueryBuilder gera SQL
2. SQL e params são passados ao Executor
3. Executor:
   - obtém conexão do pool
   - executa query
   - libera conexão
4. Retorna resultado do driver `pg`

---

# ⚙️ Dual Module Support

O pacote suporta:

- CommonJS
- ES Modules

## CommonJS

```js
const { QueryExecutor } = require('pg-query-sdk')
```

## ESM

```js
import { QueryExecutor } from 'pg-query-sdk'
```

Isso funciona graças ao campo `exports` no package.json:

```json
{
  "exports": {
    ".": {
      "require": "./dist/cjs/index.js",
      "import": "./dist/esm/index.js"
    }
  }
}
```

---

# 🧱 Estrutura do Projeto

```
pg-query-sdk/
  src/
    core/
      QueryExecutor.ts
    builders/
      QueryBuilder.ts
    index.ts
  test/
  dist/
```

---

# 🛠 Build

```bash
npm run build
```

Gera:

- dist/cjs (CommonJS)
- dist/esm (ESModule)



# 📌 Responsabilidades

| Camada | Responsabilidade |
|--------|------------------|
| QueryBuilder | Construção de SQL |
| QueryExecutor | Execução e gerenciamento de conexão |
| pg (driver) | Comunicação com PostgreSQL |

---

# 🔐 Segurança

- Suporte a parâmetros preparados
- Pool gerenciado automaticamente
- Conexões sempre liberadas no finally



## 📄 Licença

Distribuído sob a licença MIT. Veja \`LICENSE\` para mais informações.
