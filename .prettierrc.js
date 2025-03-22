import limulusConfig from '@limulus/eslint-config/prettier.js'

/**
 * @type {import("prettier").Config}
 */
export default {
  ...limulusConfig,
  plugins: ['@prettier/plugin-xml'],
  xmlWhitespaceSensitivity: 'ignore',
  overrides: [
    {
      files: '*.tcx',
      options: {
        parser: 'xml',
      },
    }
  ]
}
