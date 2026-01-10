# Style Guide

Coding standards and best practices for the Indexr codebase.

## Core Principles

### Function Design
- **Small, single-purpose functions**: Each function should do one thing well
- **Clear, descriptive names**: Avoid abbreviations and magic numbers
- **Reasonable length**: Functions should be readable in one screen view
- **Pure functions where possible**: Minimize side effects

### Naming Conventions
- **No abbreviations**: Use full words for clarity (`getUserBalance` not `getUsrBal`)
- **No magic values**: Extract constants with meaningful names
- **Consistent patterns**: Follow language-specific conventions (camelCase for JS/TS, PascalCase for Solidity)
- **Self-documenting**: Names should explain intent without requiring comments

### Configuration-Driven Behavior
- **No hardcoded addresses**: Use environment variables or config files
- **No hardcoded constants**: Extract magic numbers to named constants
- **Chain-agnostic where possible**: Support testnet/mainnet via config
- **Easy to modify**: Configuration changes shouldn't require code changes

### Documentation
- **Good comments**: Explain "why" not "what" (code should be self-explanatory)
- **Docstrings**: Document function parameters, return values, and side effects
- **README updates**: Keep documentation in sync with code changes
- **Architecture notes**: Document design decisions in code comments when non-obvious

### Testing
- **Tests for non-trivial logic**: Any business logic should have tests
- **Unit tests**: Test individual functions in isolation
- **Integration tests**: Test component interactions
- **Edge cases**: Test error conditions and boundary cases
- **Maintainable tests**: Tests should be readable and easy to update

### Error Handling
- **Predictable errors**: Use consistent error types and messages
- **Graceful degradation**: Handle failures without crashing
- **User-friendly messages**: Errors should be actionable
- **Logging**: Log errors with sufficient context for debugging
- **Never fail silently**: Always log or handle errors explicitly

### Logging
- **Appropriate levels**: Use debug/info/warn/error appropriately
- **Structured logging**: Include context (user ID, transaction hash, etc.)
- **No sensitive data**: Never log private keys or sensitive user data
- **Production-ready**: Logs should be useful in production debugging

## Language-Specific Notes

### Solidity
- Follow Solidity style guide conventions
- Use NatSpec comments for public functions
- Emit events for important state changes
- Use `require` with descriptive error messages

### TypeScript/JavaScript
- Use TypeScript for type safety
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises where possible
- Handle errors explicitly, don't ignore them

### General
- Format code consistently (use Prettier/ESLint)
- Always review code before merging
- Keep dependencies up to date
- Document breaking changes

