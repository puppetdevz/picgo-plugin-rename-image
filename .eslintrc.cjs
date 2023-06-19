module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    es6: true // 支持全局的 es6 语法
  },
  parserOptions: {
    ecmaVersion: latest,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    'no-prototype-builtins': 'off',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'no-redeclare': 'error',
    curly: 'error',
    eqeqeq: 'error',
    semi: 'off',
    quotes: 'off',
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }
    ]
  }
}
