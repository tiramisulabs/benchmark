module.exports = {
    root: true,
    env: {
        es6: true,
        node: true
    },
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'import'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            globalReturn: true
        },
        project: ['./tsconfig.json'], // Specify it only for TypeScript files
    },
    rules: {
        '@typescript-eslint/ban-types': 'off',
        'no-with': 'error',
        'no-unexpected-multiline': 'error',
        'array-bracket-spacing': [
            'error',
            'never'
        ],
        'import/no-duplicates': 'error',
        'default-param-last': 'error',
        'default-case-last': 'warn',
        'space-in-parens': [
            'error',
            'never'
        ],
        'no-unsafe-negation': 'error',
        'no-extra-boolean-cast': 'error',
        'no-sparse-arrays': 'error',
        'no-new-wrappers': 'error',
        'no-multiple-empty-lines': [
            'error',
            {
                max: 2,
                maxEOF: 1,
                maxBOF: 0
            }
        ],
        'no-extend-native': 'error',
        'no-func-assign': 'error',
        'no-unreachable': 'error',
        'no-unreachable-loop': 'error',
        'no-dupe-args': 'error',
        'no-var': 'error',
        'no-debugger': 'error',
        'no-new-func': 'error',
        'no-dupe-keys': 'error',
        'getter-return': 'error',
        'no-extra-semi': 'error',
        'for-direction': 'error',
        'arrow-spacing': [
            'error',
            {
                before: true,
                after: true
            }
        ],
        'brace-style': [
            'error',
            '1tbs'
        ],
        'use-isnan': 'warn',
        'no-caller': 'error',
        'no-empty': 'error',
        indent: [
            'error',
            4,
            {
                SwitchCase: 1
            }
        ],
        quotes: [
            'error',
            'single'
        ],
        semi: [
            'error',
            'always'
        ],
        yoda: 'error',
        '@typescript-eslint/adjacent-overload-signatures': 'warn',
        '@typescript-eslint/consistent-type-definitions': [
            'error',
            'interface'
        ],
        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/no-namespace': [
            'error',
            {
                allowDeclarations: true
            }
        ],
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        'quote-props': ['error', 'as-needed'],
        '@typescript-eslint/no-unnecessary-condition': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': [
            'error',
            {
                checksVoidReturn: false
            }
        ],
        'no-template-curly-in-string': 'error',
        'prefer-template': 'error',
        'arrow-parens': 'error',
        'array-callback-return': 'error',
        'constructor-super': 'error',
        'no-constructor-return': 'error',
        'no-duplicate-case': 'error',
        'no-unmodified-loop-condition': 'error',
    }
}