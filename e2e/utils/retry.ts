/**
 * Retry utility for Playwright tests
 * Handles network errors, 502 errors, and server unavailability
 */

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  timeout: 30000,
  waitUntil: 'networkidle',
};

/**
 * Retry navigation with exponential backoff
 */
export async function retryNavigation(
  page: any,
  url: string,
  options: RetryOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < opts.maxRetries) {
    try {
      await page.goto(url, {
        waitUntil: opts.waitUntil,
        timeout: opts.timeout,
      });
      return; // Success, exit the function
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      const errorMessage = lastError.message || String(lastError);
      const isNetworkError = 
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504') ||
        errorMessage.includes('net::ERR') ||
        errorMessage.includes('Navigation timeout') ||
        errorMessage.includes('Connection refused');

      if (isNetworkError && retries < opts.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = opts.delay * Math.pow(2, retries - 1);
        console.warn(
          `Navigation attempt ${retries}/${opts.maxRetries} failed (${errorMessage}). ` +
          `Retrying in ${backoffDelay}ms...`
        );
        await page.waitForTimeout(backoffDelay);
      } else {
        // Non-network error or max retries reached
        break;
      }
    }
  }

  // If all retries failed, throw the last error
  throw new Error(
    `Failed to navigate to ${url} after ${opts.maxRetries} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Retry any async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < opts.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      if (retries < opts.maxRetries) {
        const backoffDelay = opts.delay * Math.pow(2, retries - 1);
        console.warn(
          `Operation attempt ${retries}/${opts.maxRetries} failed. ` +
          `Retrying in ${backoffDelay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new Error(
    `Operation failed after ${opts.maxRetries} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Wait for server to be ready using health check endpoint
 */
export async function waitForServer(
  page: any,
  baseURL = 'http://localhost:3000',
  maxAttempts = 10,
  delay = 2000
): Promise<boolean> {
  const healthCheckURL = `${baseURL}/api/health`;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await page.goto(healthCheckURL, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });
      
      if (response && response.status() === 200) {
        const body = await response.json();
        if (body.status === 'ok') {
          console.log(`✅ Server is ready (status: ${response.status()}, uptime: ${body.uptime}s)`);
          return true;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`⏳ Server check attempt ${attempt}/${maxAttempts} failed: ${errorMsg}`);
    }
    
    if (attempt < maxAttempts) {
      await page.waitForTimeout(delay);
    }
  }
  
  console.error(`❌ Server is not ready after ${maxAttempts} attempts`);
  return false;
}

