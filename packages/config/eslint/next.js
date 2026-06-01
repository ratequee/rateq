/** @type {import('eslint').Linter.Config[]} */
const base = require('./base');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
];
