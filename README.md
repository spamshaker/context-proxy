# context-di

A TypeScript library that creates lazy-loaded dependency injection containers using Proxy with circular dependency detection.

## Purpose

The `context-di` library provides a type-safe way to create dependency injection containers where dependencies are resolved lazily and only when accessed. It automatically detects circular dependencies and provides clear error messages, making it ideal for code splitting scenarios where you want to defer expensive operations until they're actually needed.

## Contract-Driven Development with IApiContract

**The main reason for this library is to enable contract-driven development through the `IApiContract` pattern.** This approach allows you to define a shared interface between components and providers, enabling true separation of concerns:

- **Components** know about the runtime instance and expected API shape without needing the provider
- **Providers** know about the component's expected results but nothing about the implementation details

### Contract-Driven vs Provider-Driven Approaches

```typescript
import createContextContainer from 'context-di';

// Define your API contract - this can be shared between components and providers
interface IApiContract {
  main: {
    status: string;
  };
}

// Contract-driven approach: Type-safe with compile-time guarantees
const contractContext = createContextContainer<IApiContract>({
  main() {
    return { status: 'OK' };
  }
});

// TypeScript knows exactly what's available
console.log(contractContext.main.status); // ✅ Type-safe access
// contractContext.settings; // ❌ TypeScript error - property doesn't exist

// Provider-driven approach: Flexible but less constrained
const providerContext = createContextContainer({
  main() {
    return { status: 'OK' };
  }
});

// Still type-safe, but based on implementation rather than contract
console.log(providerContext.main.status); // ✅ Works, but less explicit about API boundaries
```

### Benefits of Contract-Driven Development

1. **API Boundaries**: Clear separation between what components expect and how providers implement
2. **Type Safety**: Compile-time guarantees that implementations match contracts
3. **Refactoring Safety**: Changes to contracts are caught at compile time across all consumers
4. **Documentation**: The contract serves as living documentation of your API
5. **Testing**: Easy to mock and test components independently of providers

## Features

- **Lazy Loading**: Dependencies are only resolved when first accessed
- **Circular Dependency Detection**: Automatically detects and prevents circular dependencies with detailed error messages
- **Type Safety**: Full TypeScript support with generic types
- **Lightweight**: Uses native JavaScript Proxy with minimal overhead

## Installation

```bash
npm install context-di
# or
bun install context-di
```

## Simple Usage Example

```typescript
import createContextProxy from 'context-di';

// Define your context interface
interface AppContext {
  database: Promise<Database>;
  userService: Promise<UserService>;
  logger: Logger;
}

// Create the context proxy with providers
const context = createContextProxy<AppContext>({
  database: () => connectToDatabase(),
  userService: async (ctx) => new UserService(await ctx.database),
  logger: () => new Logger()
});

// Access dependencies lazily - they're only created when needed
const userService = await context.userService;
const user = await userService.getUser('123');
```

## Redux Thunk Integration Example

The library works seamlessly with Redux Thunk for dependency injection in async actions:

```typescript
import { configureStore, createAsyncThunk, createReducer } from '@reduxjs/toolkit';
import createContextProxy from 'context-di';

// Define your services context
interface ServicesContext {
  userService: Promise<{
    getUser(token: string): Promise<string | undefined>;
  }>;
}

// Create the context proxy
const extraArgument = createContextProxy<ServicesContext>({
  userService: () => Promise.resolve({
    getUser: (token: string) => Promise.resolve(token === 'abc' ? 'Dummy User' : undefined)
  })
});

// Configure Redux store with the context as extra argument
const store = configureStore({
  reducer: createReducer({}, () => void 0),
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    thunk: {
      extraArgument
    }
  })
});

// Create typed async thunk
const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: ReturnType<typeof store.getState>;
  dispatch: typeof store.dispatch;
  extra: ServicesContext;
}>();

// Use in async actions
const loginUser = createAppAsyncThunk('auth/login',
  async (token: string, thunkAPI) => {
    const userService = await thunkAPI.extra.userService;
    return userService.getUser(token);
  }
);

// Dispatch the action
store.dispatch(loginUser('abc'));
```

## Error Handling

The library provides clear error messages for common issues:

```typescript
// Missing provider
const emptyContext = createContextProxy({});
emptyContext.missingService; // Error: Missing provider for property: missingService

// Circular dependency
const circularContext = createContextProxy({
  serviceA: (ctx) => ctx.serviceB,
  serviceB: (ctx) => ctx.serviceA
});
circularContext.serviceA; // Error: Circular dependency detected while resolving property "serviceA"
                          // Cause: Dependency chain: serviceA -> serviceB -> serviceA
```

## Development

To install dependencies:

```bash
bun install
```

To run tests:

```bash
bun test
```

To build:

```bash
bun run build
```

## License

MIT
