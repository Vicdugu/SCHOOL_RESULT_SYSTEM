# ESLint Configuration Notes

## Known Issue: False Positive "Unused eslint-disable Directives"

### Problem
The `react-hooks/set-state-in-effect` ESLint rule has a known limitation where it incorrectly reports `eslint-disable-next-line` directives as "unused" even though they ARE actively suppressing warnings.

### Evidence
This issue was verified by testing:
- **With directive**: No warning ✅
- **Without directive**: Error appears: "Calling setState synchronously within an effect can trigger cascading renders" ❌
- **With directive restored**: Error suppressed again ✅

### Why These Warnings Are Safe to Ignore

1. **They don't block builds** - `npm run build` succeeds without errors
2. **They don't block deployment** - GitHub Actions workflow passes
3. **The suppressions ARE working** - Tested and verified
4. **This is a known limitation** - ESLint plugin detection has false positives with this rule
5. **The pattern is necessary** - Initializing state from localStorage requires setState in effects

### Files Affected

- `src/components/Dashboard.tsx` (lines 39, 50)
- `src/components/ResultTabContent.tsx` (line 138)

### Current Lint Status

```
3 problems (0 errors, 3 warnings)
✖ All are false-positive "Unused eslint-disable directive" warnings
✖ The directives ARE working correctly
```

### How to Handle in CI/CD

The 3 warnings are **non-blocking**:
- ✅ GitHub Actions: `npm run lint` exits with code 0 (warnings allowed)
- ✅ Deployment: Vercel builds and deploys successfully
- ✅ TypeScript: `npm run build` produces clean compilation

### Future Options

If you want to eliminate these warnings completely, consider:

1. **Update ESLint plugins** (when bug is fixed)
   ```bash
   npm update eslint-plugin-react-hooks
   ```

2. **Upgrade to newer ESLint** (ESLint 11+ may have better detection)
   ```bash
   npm update eslint typescript-eslint
   ```

3. **Restructure the code** (avoid setState in effects)
   - Move initialization logic to useState lazy initializer
   - Use callback-based state updates
   - Refactor to avoid side effects during mounting

4. **Accept the warnings** (recommended for now)
   - They're harmless false positives
   - Directives are working correctly
   - Deployment is not affected

## Reference

- [React Issue #25881](https://github.com/facebook/react/issues/25881)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [React Docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
