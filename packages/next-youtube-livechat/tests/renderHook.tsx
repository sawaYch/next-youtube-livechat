import { type ReactElement, act } from 'react';
import { type Root, createRoot } from 'react-dom/client';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

export function renderHook<T>(callback: () => T) {
  const result: { current: T } = { current: undefined as unknown as T };
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root;

  function TestComponent(): ReactElement | null {
    result.current = callback();
    return null;
  }

  act(() => {
    root = createRoot(container);
    root.render(<TestComponent />);
  });

  return {
    result,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

export async function waitFor(
  assertion: () => void,
  { timeout = 1000, interval = 10 } = {}
) {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeout) {
    await act(async () => {
      await Promise.resolve();
    });
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, interval));
      });
    }
  }

  throw lastError;
}
