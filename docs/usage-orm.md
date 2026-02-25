# Basic ORM with Repositories

The PG Query SDK provides a foundational Object-Relational Mapping (ORM) layer through its `Repository` abstract class. This layer is designed to offer a structured way to interact with your database entities, promoting code organization, reusability, and a cleaner separation of concerns.

## The `Repository` Abstract Class

The `Repository<T>` class serves as a base for creating specific data access objects (DAOs) for your entities. It provides common methods and a pre-configured `QueryBuilder` instance.

### Defining an Entity Interface

First, define a TypeScript interface for your database entity. This provides type safety throughout your application.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}
```

### Creating a Concrete Repository

Extend the `Repository<T>` class, providing your entity interface as the type parameter. In the constructor, you'll pass the table name, `QueryExecutor`, and `Dialect` instances.

```typescript
import { Repository, QueryExecutor, Dialect } from 'pg-query-sdk';

class UserRepository extends Repository<User> {
  constructor(executor: QueryExecutor, dialect: Dialect) {
    // 'users' is the name of the table in the database
    super('users', executor, dialect);
  }

  // You can add custom data access methods here
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.qb()
      .where({ email })
      .limit(1)
      .execute();
    return users[0] ?? null;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.qb()
      .where({ active: true }) // Assuming 'active' column exists
      .orderBy('name', 'ASC')
      .execute();
  }

  // DML operations (insert, update, delete) need to be implemented
  // based on your specific needs and return types.
  // The base Repository provides placeholders for these.
  async insert(data: Omit<User, 'id'>): Promise<User> {
    // Example: This would typically use a raw INSERT query or a specialized builder
    // For simplicity, let's assume a basic executor call
    const result = await this.executor.execute(
      `INSERT INTO ${this.table} (name, email) VALUES ($1, $2) RETURNING *`,
      [data.name, data.email]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(data);
    const result = await this.executor.execute(
      `UPDATE ${this.table} SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.executor.execute(
      `DELETE FROM ${this.table} WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }
}
```

## Using Repositories

The `Database` instance provides a `repository()` method to easily get an instance of your custom repository.

```typescript
import Database from 'pg-query-sdk';
// Assuming UserRepository and User interface are defined as above

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function repositoryExample() {
  // Get an instance of your UserRepository
  const userRepository = db.repository(UserRepository);

  // Use the built-in findById method
  const userById = await userRepository.findById(1);
  console.log('User by ID (1):', userById);

  // Use your custom findByEmail method
  const userByEmail = await userRepository.findByEmail('john.doe@example.com');
  console.log('User by Email:', userByEmail);

  // Insert a new user
  const newUser = await userRepository.insert({ name: 'Jane Doe', email: 'jane.doe@example.com' });
  console.log('New User:', newUser);

  // Update an existing user
  const updatedUser = await userRepository.update(newUser.id, { name: 'Jane A. Doe' });
  console.log('Updated User:', updatedUser);

  // Find active users
  const activeUsers = await userRepository.findActiveUsers();
  console.log('Active Users:', activeUsers);

  // Delete a user
  const deleted = await userRepository.delete(newUser.id);
  console.log(`User ${newUser.id} deleted: ${deleted}`);
}

repositoryExample();
```

## Key Concepts

*   **`qb()` Method**: Each repository instance has a `qb()` method that returns a `QueryBuilder<T>` pre-configured for the repository's table, `QueryExecutor`, and `Dialect`. This allows you to leverage the fluent query building capabilities directly from your repository.
*   **DML Operations**: The base `Repository` class provides placeholder methods for `insert`, `update`, and `delete`. You are expected to implement these in your concrete repository classes, tailoring them to your entity's structure and database's return conventions (e.g., `RETURNING *` for PostgreSQL).
*   **Separation of Concerns**: Repositories encapsulate data access logic, keeping your business logic clean and focused on domain operations.

By utilizing the `Repository` pattern, you can create a clean, maintainable, and type-safe data access layer for your application.

Next: [Executing Raw Queries](./usage-raw-queries.md)