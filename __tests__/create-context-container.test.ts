import createContextContainer from '../';

/**
 * This IApiContract interface can be shared between components and provider so that the components don't need a
 * provider but knows all about the runtime instance and the provider knows all about the component's results but
 * nothing about the implementation
 * @interface IApiContract
 */
interface IApiContract {
  main: {
    status: string
  };
}

it(`contract driven implementation should not have TypeScript errors`, async () => {
  const ctx = createContextContainer<IApiContract>({
    // No TypeScript error, cause the IApiContract specified and matches the implementation with contract restriction
    main() {
      return { status: 'OK' };
    }
  });
  // No TypeScript error, cause the IApiContract specified and matches the implementation
  expect(ctx.main.status).toEqual('OK');

  expect(() => {
    // @ts-expect-error: TS2339: Property setting does not exist on type { main: { status: string; };
    return ctx.settings;
  }).toThrow('Expected provider.settings to be a function but was: undefined');
});


it(`should resolve property main asynchronously`, async () => {
  const context = createContextContainer({ main: () => Promise.resolve('Main') });
  return expect(context.main).resolves.toBe('Main');
});

it(`should resolve chain main -> controller -> service asynchronously`, async () => {
  const context = createContextContainer<{
    main: Promise<string>,
    controller: Promise<string>
    service: Promise<string>
  }>({
    main: (ctx) => ctx.controller,
    controller: (ctx) => ctx.service,
    service: () => Promise.resolve('Service')
  });

  return expect(context.main).resolves.toBe('Service');
});


it(`provider driven implementation should not have TypeScript errors`, async () => {
  const ctx = createContextContainer({
    // This should be used as declaration instead of contract for flexible implementation
    main() {
      return { status: 'OK' };
    }
  });
  // No TypeScript error, cause the IApiContract specified and matches the implementation
  expect(ctx.main.status).toEqual('OK');

  expect(() => {
    // @ts-expect-error: TS2339: Property settings do not exist on type { main: { status: string; };
    return ctx.settings;
  }).toThrow('Expected provider.settings to be a function but was: undefined');
});

it(`should throw circular dependencies error for near chain`, () => {
  const ctx = createContextContainer<IApiContract>({
    main: (ctx) => ctx.main
  });
  expect(() => ctx.main).toThrow('Circular dependencies for main');
});

it(`should throw circular dependencies error for far chain`, () => {
  const ctx = createContextContainer<IApiContract & { settings: { status: string } }>({
    settings: (ctx) => ctx.main,
    main: (ctx) => ctx.settings
  });
  try {
    const main = ctx.main;
    expect.fail(`Should throw circular dependencies error for far chain but received ${main}`);
  } catch (e) {
    if (e instanceof Error) {
      expect(e.cause).toEqual('Chain: main -> settings => main');
    }
  }

  expect(() => ctx.main).toThrow('Circular dependencies for main');
});