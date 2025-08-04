import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    modules: {
      // Use camelCase for CSS class names in JS  
      localsConvention: 'camelCase',
      // Generate scoped class names
      generateScopedName: '[name]__[local]__[hash:base64:5]'
    }
  }
});