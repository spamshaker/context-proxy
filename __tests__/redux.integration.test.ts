import { configureStore, createAsyncThunk, createReducer } from '@reduxjs/toolkit';
import createContextProxy from '../';

interface IContext {
  userService: Promise<{
    getUser(token: string): Promise<string | undefined>;
  }>;
}

const extraArgument = createContextProxy<IContext>({
  userService: () => Promise.resolve({
    getUser: (token: string) => Promise.resolve(token === 'abc' ? 'Dummy User' : undefined)
  })
});

const store = configureStore({
  reducer: createReducer({}, () => void 0),
  middleware: (gdm) => gdm({
    thunk: {
      get extraArgument(): IContext {
        return extraArgument;
      }
    }
  })
});

const createAppAsyncThunk = createAsyncThunk.withTypes<typeof store & { extra: IContext }>();

it(`should `, async () => {
  const login = createAppAsyncThunk('Login',
    async (arg: string, thunkAPI) => {
      return (await thunkAPI.extra.userService).getUser(arg);
    }
  );
  const result = await store.dispatch(login('abc')).unwrap();
  expect(result).toEqual('Dummy User');
});