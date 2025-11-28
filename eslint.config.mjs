import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'no-unused-disable': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/incompatible-library': 'off',
      'jsx-a11y/alt-text': 'off',
      'jsx-a11y/role-supports-aria-props': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Console kullanımını error yap (production'da logger kullan)
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Code quality rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'warn',
    },
  },

  // Test files için özel kurallar
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // Test dosyalarında console.log'a izin ver
      'no-console': 'off',
      // Test dosyalarında any kullanımına daha toleranslı ol (ama yine de warn)
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // Scripts and tools için özel kurallar
  {
    files: [
      'scripts/**/*.ts',
      'scripts/**/*.js',
      'scripts/**/*.mts',
      'src/scripts/**/*.ts',
      'src/scripts/**/*.js',
    ],
    rules: {
      // Scripts'te console kullanımına izin ver (debugging/diagnostic scripts)
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Unused vars için daha toleranslı ol
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // Logger implementation için exception
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off', // Logger implementation console kullanır
    },
  },

  // API routes için exception (server-side logging)
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      'no-console': 'off', // Server-side API routes console kullanabilir
    },
  },



  // Override default ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    '.husky/**',
    'coverage/**',
    'dist/**',
    'src/lib/performance-monitor.tsx',
  ]),
]);

export default eslintConfig;
