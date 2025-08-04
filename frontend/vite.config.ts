import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@data': path.resolve(__dirname, './src/data'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@test-utils': path.resolve(__dirname, './src/test-utils')
    }
  },
  css: {
    modules: {
      // Use camelCase for CSS class names in JS  
      localsConvention: 'camelCase',
      // Generate scoped class names
      generateScopedName: '[name]__[local]__[hash:base64:5]'
    }
  }
});