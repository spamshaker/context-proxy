import createContextContainer from '../index';

it(`should throw Missing provider for property main`, async () => {
  const context = createContextContainer({});
  expect(() => context.main).toThrow(new Error('Missing provider for property: main'));
});

it(`should resolve property main`, async () => {
  const context = createContextContainer({ main: () => Promise.resolve('Main') });
  return expect(context.main).resolves.toBe('Main');
});

it(`should resolve chain main -> controller -> service`, async () => {
  const context = createContextContainer({
    main: (ctx) => ctx.controller,
    controller: (ctx) => ctx.service,
    service: () => Promise.resolve('Service')
  });
  return expect(context.main).resolves.toBe('Service');
});

it(`should throw circular dependency main -> controller -> service -> main`, async () => {
  const context = createContextContainer({
    main: (ctx) => ctx.controller,
    controller: (ctx) => ctx.service,
    service: (ctx) => ctx.main
  });
  const expectedException = new Error('Circular dependency detected while resolving property "main"',
    { cause: 'Dependency chain: main -> controller -> service -> main' }
  );

  try {
    const r = context.main;
    expect.fail(`Should throw exception but was: ${r}`);
  } catch (err) {
    if (!Error.isError(err)) {
      throw err;
    }
    expect(err.message).toEqual(expectedException.message);
    expect(err.cause).toEqual(expectedException.cause);
  }
});