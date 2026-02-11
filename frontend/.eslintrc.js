module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest'
    },
    plugins: ['import'],
    rules: {
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'always',
                jsx: 'always',
                ts: 'always',
                tsx: 'always'
            }
        ]
    }
}
