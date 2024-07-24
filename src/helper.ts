// Wrapper function for console.log
export function log(...args: any[]) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.log(...args);
  }
}
