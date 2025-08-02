const createContextContainer = <TContext extends object,
  P extends keyof TContext = keyof TContext,
  T extends { [K in P]: (ctx: TContext) => TContext[K] } = { [K in P]: (ctx: TContext) => TContext[K] }>(provider: T) => {

  const isProperty = (p: unknown): p is P => {
    return typeof p === 'string' && p in provider;
  };

  const chain = new Set<P>();

  const contextHandler: ProxyHandler<TContext> = {
    get(target: TContext, p: unknown) {
      if (!isProperty(p)) {
        throw new Error(`Missing provider for property: ${p}`);
      }
      if (chain.has(p)) {
        const path = chain.values().toArray().join(' -> ');
        throw new Error(`Circular dependency detected while resolving property "${String(p)}"`,
          { cause: `Dependency chain: ${path} -> ${String(p)}` }
        );
      }

      if (!target[p]) {
        chain.add(p);
        target[p] = provider[p](contextProxy) as TContext[P];
        chain.delete(p);
      }
      return target[p];
    }
  };
  const contextProxy = new Proxy({} as TContext, contextHandler);
  return contextProxy;
};

export default createContextContainer;