// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // Tắt explicit-any vì NestJS sử dụng any ở nhiều chỗ
      '@typescript-eslint/no-explicit-any': 'off',
      
      // Cho phép biến không sử dụng nếu bắt đầu bằng _ (convention)
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      
      // Floating promises chỉ cảnh báo, không lỗi
      '@typescript-eslint/no-floating-promises': 'warn',
      
      // Unsafe operations chỉ cảnh báo (common trong NestJS với decorators)
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      
      // Prettier tự động fix line endings
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      
      // === Phase 3 Cleanup: Downgrade to warnings ===
      // require-await: async without await is valid pattern in NestJS controllers
      '@typescript-eslint/require-await': 'warn',
      
      // enum comparison: safe in our codebase, just cosmetic
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      
      // case declarations: common pattern for scoped variables
      'no-case-declarations': 'warn',
      
      // empty interface: used for marker interfaces
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      
      // unbound-method: false positives with NestJS decorators
      '@typescript-eslint/unbound-method': 'warn',
    },
  },
);
