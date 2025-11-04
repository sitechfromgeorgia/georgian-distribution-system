/**
 * Node.js Polyfills for Browser Globals
 * 
 * This file must be loaded before Next.js starts to provide
 * browser globals that some libraries expect during SSR.
 * 
 * Loaded via: node -r ./src/polyfills-node.js
 */

// Polyfill 'self' to point to globalThis in Node.js environment
if (typeof globalThis !== 'undefined') {
  // Define 'self' if it doesn't exist
  if (typeof self === 'undefined') {
    globalThis.self = globalThis
  }
  
  // Define 'window' if it doesn't exist (some libs check for window)
  if (typeof window === 'undefined') {
    globalThis.window = {
      ...globalThis,
      location: {
        protocol: 'http:',
        hostname: 'localhost',
        port: '3000',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/',
        pathname: '/',
        search: '',
        hash: '',
      },
      navigator: {
        userAgent: 'Node.js',
      },
    }
  }
  
  // Define 'document' as a minimal stub (only for build process)
  if (typeof document === 'undefined') {
    globalThis.document = {
      createElement: () => ({}),
      createTextNode: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
      head: {
        appendChild: () => {},
        removeChild: () => {},
      },
    }
  }
  
  // Ensure self.__webpack_chunkLoad__ and similar properties work
  if (typeof self !== 'undefined' && !self.__webpack_chunkLoad__) {
    self.__webpack_chunkLoad__ = function() {}
  }
}

console.log('✓ Server polyfills loaded: self =', typeof self !== 'undefined' ? 'defined' : 'undefined', ', document =', typeof document !== 'undefined' ? 'defined' : 'undefined')
