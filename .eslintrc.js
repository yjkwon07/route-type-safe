module.exports = {
  /* 프로젝트의 사용 환경 */
  env: {
    es6: true,
    node: true,
  },
  /* 플러그인은 일련의 규칙 집합 */
  plugins: [
    // 플러그인을 추가하여도 규칙은 적용되지 않는다.
    '@typescript-eslint',
    'import',
    'prettier',
  ],
  /* extends는 추가한 플러그인에서 사용할 규칙 설정 */
  extends: [
    // 규칙을 적용하기 위해서는 추가한 플러그인 중, 사용할 규칙 추가
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended', // eslint에서 규칙을 비활성화 하는 호환성을 위한 규칙 모음
    'plugin:prettier/recommended',
  ],
  settings: {
    // https://github.com/import-js/eslint-plugin-import?tab=readme-ov-file#importextensions
    // This defaults to ['.js'], unless you are using the react shared config, in which case it is specified as ['.js', '.jsx']. Despite the default, if you are using TypeScript (without the plugin:import/typescript config described above) you must specify the new extensions (.ts, and also .tsx if using React).
    'import/extensions': ['.js', '.ts'],
    'import/parsers': {
      // https://github.com/import-js/eslint-plugin-import?tab=readme-ov-file#importparsers
      // This is useful if you're interop-ing with TypeScript directly using webpack
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  /* 자바스크립트 버전, 모듈 사용 여부 등을 설정 */
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  /* extends와 plugins에 대한 세부 설정을 변경 */
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': ['off'],
    // airbnb ESLint 구성의 문제를 해결하기 위함
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
    // import order 정의
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'object'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
          {
            pattern: '@+(assets|images|styles)/**',
            group: 'object',
          },
          {
            pattern: '{.,..}/**/*.+(css|sass|less|scss)',
            group: 'object',
          },
          {
            pattern: '*.+(css|sass|less|scss)',
            group: 'object',
            patternOptions: { matchBase: true },
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        warnOnUnassignedImports: true,
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'prettier/prettier': ['error'],
  },
  ignorePatterns: ['jest.config.js'],
};
