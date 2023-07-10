// import { resolve } from 'path';
// const glsl = require('vite-plugin-glsl');
import glslify from  'vite-plugin-glslify';
import mkcert from 'vite-plugin-mkcert'

// import { defineConfig } from 'vite';

export default {
  server: { https: true },

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
