// Performance utilities for the extension

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to ensure a function is called at most once per interval
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Batch DOM operations for better performance
class DOMBatcher {
  constructor() {
    this.operations = [];
    this.scheduled = false;
  }

  add(operation) {
    this.operations.push(operation);
    this.schedule();
  }

  schedule() {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  flush() {
    this.operations.forEach(op => op());
    this.operations = [];
    this.scheduled = false;
  }
}

// Lazy loader for heavy operations
class LazyLoader {
  constructor() {
    this.loaded = new Set();
  }

  async load(key, loader) {
    if (this.loaded.has(key)) {
      return;
    }
    await loader();
    this.loaded.add(key);
  }

  isLoaded(key) {
    return this.loaded.has(key);
  }
}

// Memory-efficient event listener manager
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  add(element, event, handler, options) {
    const key = `${event}-${element}`;
    if (!this.listeners.has(key)) {
      element.addEventListener(event, handler, options);
      this.listeners.set(key, { element, event, handler, options });
    }
  }

  remove(element, event) {
    const key = `${event}-${element}`;
    const listener = this.listeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.listeners.delete(key);
    }
  }

  removeAll() {
    for (const [key, listener] of this.listeners.entries()) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
    }
    this.listeners.clear();
  }
}

// Export utilities
if (typeof window !== 'undefined') {
  window.PerformanceUtils = {
    debounce,
    throttle,
    DOMBatcher,
    LazyLoader,
    EventManager
  };
}
