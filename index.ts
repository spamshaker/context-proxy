const createHandler = <T>(getInstance: (name: keyof T) => T[keyof T]) => {
  const resolutionStack = new Set<keyof T>();
  return {
    get(target: T, property: keyof T) {
      if (resolutionStack.has(property)) {
        throw new Error(`Circular dependencies for ${String(property)}`, {
          cause:
            `Chain: ${resolutionStack.values().toArray().join(' -> ')} => ${String(property)}`
        });
      }
      resolutionStack.add(property);
      if (!target[property]) {
        target[property] = getInstance(property);
      }
      resolutionStack.delete(property);
      return target[property];
    }
  };
};

const createContextPropertyProvider = <T extends Provider<any>>(objectProvider: T, ctxProvider: () => object) =>
  <TName extends keyof T>(name: TName): ReturnType<T[TName]> => {
    if (name in objectProvider && typeof objectProvider[name] === 'function') {
      return objectProvider[name](ctxProvider());
    }
    throw new Error(`Expected provider.${String(name)} to be a function but was: ${typeof objectProvider[name]}`);
  };

type Provider<T> = {
  [P in keyof T]: (ctx: T) => T[P];
}

const createContextContainer = <T extends object>(
  provider: T extends Provider<infer X> ? Provider<X> : Provider<T>,
  target: object = {}) => {

  const ctxProvider = () => proxy;
  const contextPropertyProvider = createContextPropertyProvider(provider, ctxProvider);
  const proxy = new Proxy(target, createHandler(contextPropertyProvider as any));
  return proxy as T extends Provider<infer R> ? R : T;
};


export default createContextContainer;