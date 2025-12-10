module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended'],
  plugins: ['html'],
  overrides: [
    { files: ['*.ts'], extends: ['plugin:@typescript-eslint/recommended'] },
    { files: ['*.html'], rules: { 'no-console': 'off' } }
  ],
  rules: { 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off' }
}
