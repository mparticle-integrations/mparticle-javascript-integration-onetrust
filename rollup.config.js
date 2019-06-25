import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/oneTrustWrapper.js',
    output: {
        file: 'build/OneTrustKit.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-oneTrust-kit',
        strict: true
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
},
{
    input: 'src/oneTrustWrapper.js',
    output: {
        file: 'dist/OneTrustKit.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-oneTrust-kit',
        strict: true
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
}
] 