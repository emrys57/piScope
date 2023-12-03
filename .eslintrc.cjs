// This project uses ES modules but eslint does not support that so I have to rename this file `eslintrc.cjs`.
// https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module', // Have to have this or await globalThis does not work at top level.
  },
  extends: 'eslint:recommended',
  overrides: [],
  globals: {
    // _: true
  },
  rules: {
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    semi: [2, 'always'],
    curly: 'error',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    'no-console': 0,
  },
};
