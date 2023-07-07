// import { resolve } from 'path';
// const glsl = require('vite-plugin-glsl');
import glslify from  'vite-plugin-glslify';

// import { defineConfig } from 'vite';

export default {
  plugins: [
    // glsl()
    glslify()
  ],

  resolve: {
    alias: {
      // '~': resolve(__dirname, './'),
    },
  },
};
