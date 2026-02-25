# Installation

This guide will walk you through the process of installing the PG Query SDK in your project.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 14 or higher.
*   **npm** or **Yarn**: Package managers for Node.js.
*   **TypeScript**: If you are using TypeScript in your project (recommended).

## Step 1: Install the Package

Open your terminal or command prompt in your project's root directory and run one of the following commands:

### Using npm

```bash
npm install pg-query-sdk pg
```

### Using Yarn

```bash
yarn add pg-query-sdk pg
```

**Note**: The `pg` package (Node.js PostgreSQL client) is a peer dependency of `pg-query-sdk` and must be installed separately.

## Step 2: Configure TypeScript (Optional, but Recommended)

If you are using TypeScript, ensure your `tsconfig.json` is configured to support ES Modules (if applicable) and has appropriate settings for your project. The SDK is fully typed and provides excellent IntelliSense support.

A typical `tsconfig.json` might look like this:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Step 3: Basic Usage Verification

After installation, you can quickly verify that the SDK is working by creating a simple test file (e.g., `test-db.ts`):

```typescript
import Database from 'pg-query-sdk';

async function runTest() {
  const db = new Database({
    connectionString: 'postgres://user:password@localhost:5432/your_database',
  });

  try {
    // Replace with an actual table and column from your database
    const result = await db.table('your_table').select(['id']).limit(1).execute();
    console.log('Successfully connected and queried:', result);
  } catch (error) {
    console.error('Failed to connect or query:', error);
  } finally {
    // It's good practice to close the database connection pool when done
    // Note: Database class itself doesn't have a direct close method for its internal executor.
    // You would typically manage the lifecycle of the QueryExecutor if you need explicit closing.
    // For simple scripts, the process will exit and clean up.
  }
}

runTest();
```

Remember to replace `postgres://user:password@localhost:5432/your_database` with your actual PostgreSQL connection string and `your_table` with a table that exists in your database.

To run this test file:

```bash
# If using ts-node for direct execution
npx ts-node test-db.ts

# If compiling first
tsc test-db.ts
node test-db.js
```

You are now ready to start building your database interactions with PG Query SDK!

Next: [Using the QueryBuilder](./usage-query-builder.md)