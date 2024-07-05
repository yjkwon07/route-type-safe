import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import filesize from 'rollup-plugin-filesize';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

import pkg from './package.json' assert { type: 'json' };

const extensions = ['.ts']; // 어떤 확장자를 처리 할 지 정함

export default {
  input: './src/index.ts', // 어떤 파일부터 불러올지 정함.
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  plugins: [
    babel({
      babelHelpers: 'runtime',
      skipPreflightCheck: true,
      extensions,
      include: ['src/**/*'],
      exclude: 'node_modules/**',
    }),

    nodeResolve({ extensions }), // node_modules 에서 모듈을 불러올 수 있게 해줌. ts/tsx 파일도 불러올 수 있게 해줌

    commonjs({
      extensions: [...extensions, '.js'],
    }), // CommonJS 형태로 만들어진 모듈도 불러와서 사용 할 수 있게 해줌

    // Automatically add peerDependencies to the `external` config
    // https://rollupjs.org/guide/en/#external
    peerDepsExternal(), // peerDependencies로 설치한 라이브러리들을 external 모듈로 설정 즉, 번들링된 결과에 포함시키지 않음

    typescript(),

    terser(), // 번들 결과물을 minify

    filesize(),
    visualizer(),
  ],
};
