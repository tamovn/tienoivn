import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // đảm bảo Vite copy cả /public
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
  item &&
    typeof item.name === 'string' && item.name.trim() !== '' &&
    typeof item.content === 'string' &&
    typeof item.date === 'string' &&
    typeof item.author === 'string';
  if (!isValid) {
    console.warn('Invalid comment data filtered out:', item);
  }
  return isValid;
}
 * Validates a single User object.
 * @param item The object to validate.
 * @returns True if the object is a valid User, false otherwise.