export function normalizeQualityPreference(value) {
  if (value === 'max') return 'max';
  // Earlier versions used auto/original; map both to the safer catalog default.
  return 'standard';
}

export function shouldFetchHighestQuality(mode, hasProxy) {
  return mode === 'max' && Boolean(hasProxy);
}
