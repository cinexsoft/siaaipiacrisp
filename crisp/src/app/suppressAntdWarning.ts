"use client";

// Suppress Ant Design React 19 compatibility warning in development.
// Remove this once upgrading to antd version that officially supports React 19.
const originalWarn = console.warn;
const originalError = console.error;

function shouldSuppress(args: any[]): boolean {
  try {
    const msg = args?.[0];
    if (typeof msg === "string" && msg.includes("[antd: compatible] antd v5 support React is 16 ~ 18")) {
      return true;
    }
  } catch {}
  return false;
}

console.warn = (...args: any[]) => {
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  if (shouldSuppress(args)) return;
  originalError(...args);
};


