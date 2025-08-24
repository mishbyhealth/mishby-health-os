// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './features/testing/setup/test-utils.ts',
        coverage: {
            reporter: ['text', 'html'],
        },
    },
});
