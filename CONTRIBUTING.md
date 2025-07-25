# Contributing to NanoSocket

Thank you for your interest in contributing to NanoSocket! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Performance Considerations](#performance-considerations)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- TypeScript knowledge
- Basic understanding of WebSockets

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nano-socket.git
cd nano-socket

# Install dependencies
npm install

# Build the project
npm run build

# Run examples to test
npm run test:server  # In one terminal
npm run test:client  # In another terminal
```

## Making Changes

### Branch Naming

- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting
- `refactor`: code refactoring
- `test`: adding tests
- `chore`: maintenance

Examples:
```
feat(client): add auto-reconnection with exponential backoff
fix(server): resolve memory leak in room management
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Build and run basic tests
npm test

# Run server example
npm run test:server

# Run client example
npm run test:client

# Build project
npm run build

# Clean build artifacts
npm run clean
```

### Writing Tests

When adding new features:

1. Add example usage in the `examples/` directory
2. Ensure your code works with the existing examples
3. Test both server and client functionality
4. Test error conditions and edge cases

## Submitting Changes

### Pull Request Process

1. Update documentation if needed
2. Add or update examples if applicable
3. Ensure all tests pass
4. Update the README.md if needed
5. Create a pull request with a clear description

### Pull Request Requirements

- [ ] Code builds without errors
- [ ] Examples work correctly
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No breaking changes (unless discussed)

## Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Provide comprehensive type definitions
- Use JSDoc comments for public APIs
- Follow existing code style
- Use meaningful variable and function names

### Code Style

```typescript
// Good
export class NanoSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  
  /**
   * Connects to the WebSocket server
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void> {
    // Implementation
  }
}

// Avoid
export class client {
  ws: any;
  connect() { /* no docs */ }
}
```

### Documentation

- Use JSDoc for all public methods
- Include parameter types and descriptions
- Provide usage examples
- Keep documentation up to date

## Performance Considerations

NanoSocket is built for performance. When contributing:

### Do:
- Profile your changes for performance impact
- Use efficient data structures
- Minimize memory allocations
- Leverage uWebSockets.js optimizations
- Consider memory usage in long-running connections

### Don't:
- Add unnecessary dependencies
- Use blocking operations
- Create memory leaks
- Ignore performance regressions

### Benchmarking

Before submitting performance-related changes:

1. Benchmark current implementation
2. Benchmark your changes
3. Include performance comparison in PR
4. Ensure no significant regressions

## Architecture Guidelines

### Server Architecture
- Keep the core server lightweight
- Use event-driven patterns
- Maintain compatibility with socket.io API where possible
- Leverage uWebSockets.js features efficiently

### Client Architecture
- Provide robust reconnection logic
- Handle network failures gracefully
- Maintain state consistency
- Support both browser and Node.js environments

## Getting Help

If you need help:

1. Check existing issues and documentation
2. Create a new issue with detailed description
3. Join discussions in existing issues
4. Reach out to maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to NanoSocket!