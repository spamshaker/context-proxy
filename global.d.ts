export declare global {
  export { test, it, describe, beforeAll, afterAll, beforeEach, spyOn, mock } from 'bun:test';
  export const expect: typeof import('bun:test')['expect'] & { fail: (message: string) => void };
}
