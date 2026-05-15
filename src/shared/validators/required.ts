export const ensureRequiredFields = <TObject extends object, TKey extends keyof TObject>(
  value: TObject,
  requiredKeys: readonly TKey[]
): asserts value is TObject & Required<Pick<TObject, TKey>> => {
  for (const key of requiredKeys) {
    if (value[key] === undefined || value[key] === null) {
      throw new Error(`Missing required field: ${String(key)}`);
    }
  }
};
