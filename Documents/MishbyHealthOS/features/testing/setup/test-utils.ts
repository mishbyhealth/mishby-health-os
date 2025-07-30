// features/testing/setup/test-utils.ts

import { vi } from 'vitest';
import '@testing-library/jest-dom';

export const mockConsole = () => {
  const originalLog = console.log;
  const mock = vi.fn();
  console.log = mock;
  return {
    mock,
    restore: () => {
      console.log = originalLog;
    },
  };
};
