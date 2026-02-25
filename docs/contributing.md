# Contributing to PG Query SDK

We welcome contributions to the PG Query SDK! Whether it's reporting a bug, suggesting an enhancement, or submitting a pull request, your help is valuable. This document outlines the guidelines for contributing to the project.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## How to Contribute

### 1. Reporting Bugs

If you find a bug, please open an issue on the [GitHub Issues page](https://github.com/guio11221/pg-query-sdk/issues). When reporting a bug, please include:

*   A clear and concise description of the bug.
*   Steps to reproduce the behavior.
*   Expected behavior.
*   Actual behavior.
*   Screenshots or code snippets if applicable.
*   Your environment details (Node.js version, TypeScript version, database version, `pg-query-sdk` version).

### 2. Suggesting Enhancements

We're always looking for ways to improve the SDK. If you have an idea for a new feature or an improvement to an existing one, please open an issue on the [GitHub Issues page](https://github.com/guio11221/pg-query-sdk/issues). Describe your suggestion clearly and explain why it would be beneficial to the project.

### 3. Submitting Pull Requests

If you'd like to contribute code, please follow these steps:

1.  **Fork the repository** on GitHub.
2.  **Clone your forked repository** to your local machine.
    ```bash
    git clone https://github.com/guio11221/pg-query-sdk.git
    cd pg-query-sdk
    ```
3.  **Create a new branch** for your feature or bug fix.
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/your-bug-fix-name
    ```
4.  **Install dependencies**:
    ```bash
    npm install
    ```
5.  **Make your changes**. Ensure your code adheres to the project's coding style and conventions.
6.  **Write tests** for your changes. All new features and bug fixes should be accompanied by appropriate tests to ensure correctness and prevent regressions.
7.  **Run tests**:
    ```bash
    npm test
    ```
    Ensure all tests pass.
8.  **Update documentation**: If your changes introduce new features or modify existing behavior, please update the relevant documentation files (`.md` files in the `docs` directory and JSDoc comments in the source code).
9.  **Commit your changes** with a clear and descriptive commit message.
    ```bash
    git commit -m "feat: Add new feature X"
    # or
    git commit -m "fix: Resolve bug Y"
    ```
10. **Push your branch** to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```
11. **Open a Pull Request** on the original repository.
    *   Provide a clear title and description for your pull request.
    *   Reference any related issues (e.g., "Closes #123").
    *   Explain the changes you've made and why they are necessary.

## Development Setup

*   **TypeScript**: The project is written in TypeScript. Ensure you have a good understanding of TypeScript.
*   **Testing**: We use `jest` for testing.
*   **Linting/Formatting**: The project might use `eslint` and `prettier` for code quality. Please ensure your code passes linting checks.

## Code Style

*   Follow existing code style and conventions.
*   Use JSDoc comments for all public APIs (classes, methods, properties).
*   Keep functions and methods focused on a single responsibility.

Thank you for considering contributing to the PG Query SDK! Your efforts help make this project better for everyone.