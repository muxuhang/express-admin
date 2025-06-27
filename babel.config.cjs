module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'auto'
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta'
  ],
  env: {
    test: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { loose: true }]
      ]
    }
  }
} 