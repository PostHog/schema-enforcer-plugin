import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import builtins from 'rollup-plugin-node-builtins'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

const external = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.peerDependencies || {}))

export default [
    {
        input: './src/index.ts',
        output: {
            file: pkg.main,
            format: 'cjs',
        },
        external,
        plugins: [
            builtins(),
            // Allows node_modules resolution
            resolve({
                extensions,
                preferBuiltins: false,
                mainFields: ['jsnext', 'module', 'main'],
            }),
            // Allow bundling cjs modules. Rollup doesn't understand cjs
            commonjs({
                include: 'node_modules/**',
            }),
            // Compile TypeScript/JavaScript files
            typescript({
                include: ['*.ts', '**/*.ts'],
            }),
        ],
    },
]
