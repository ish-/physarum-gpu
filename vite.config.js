// import { resolve } from 'path';
// const glsl = require('vite-plugin-glsl');
import glslify from  'vite-plugin-glslify';
import mkcert from 'vite-plugin-mkcert';

import dotenv from 'dotenv';

const env = dotenv.config().parsed;

// import { defineConfig } from 'vite';

export default {
  base: './',
  server: { https: true },

  define: {
    DEBUG: `"${env.DEBUG}"`,
    VITE_AZAZA: "'yeah!'",
  },

  // build: {
  //   rollupOptions: {
  //     treeshake: {
  //       annotations: false,
  //       moduleSideEffects: 'no-external',
  //       // preset: 'smallest',
  //     },
  //   },
  // },

  plugins: [
    // glsl()
    glslify(),
    mkcert(),
  ],

  resolve: {
    alias: {
      // '~': resolve(__dirname, './'),
    },
  },
};
