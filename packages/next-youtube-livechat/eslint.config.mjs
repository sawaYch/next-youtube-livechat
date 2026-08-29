import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

// preserve the previous only-warn behavior: report everything as warnings
const toWarn = (configs) =>
  configs.map((config) => ({
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).map(([name, value]) => {
        const severity = Array.isArray(value) ? value[0] : value;
        if (severity === 'off' || severity === 0) return [name, value];
        return [name, Array.isArray(value) ? ['warn', ...value.slice(1)] : 'warn'];
      })
    ),
  }));

export default defineConfig([
  ...toWarn([...nextVitals, ...nextTs]),
  prettier,
  {
    // not a Next app: no pages directory exists in this package
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  globalIgnores(['dist/**', 'node_modules/**', 'coverage/**']),
]);
