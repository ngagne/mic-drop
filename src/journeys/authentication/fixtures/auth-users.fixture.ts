export interface AuthUserFixture {
  username: string;
  password: string;
}

export const validAuthUser: AuthUserFixture = {
  username: 'test.user',
  password: 'correct-password'
};

export const invalidAuthUser: AuthUserFixture = {
  username: 'test.user',
  password: 'wrong-password'
};

export const authenticationLatencySamplesMs: readonly number[] = [42, 44, 45, 47, 49];
