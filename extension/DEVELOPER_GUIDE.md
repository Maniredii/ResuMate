# Developer Guide - Performance Optimizations

## Quick Reference

### Using the Performance Utilities

```javascript
// Import in your content script (already included in manifest.json)
const { debounce, throttle, DOMBatcher, LazyLoader, EventManager } = window.PerformanceUtils;

// Debounce example - limit function calls
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

// Throttle example - ensure function runs at most once per interval
const throttledScroll = throttle(() => {
  console.log('Scroll event');
}, 100);

// DOM Batcher example - batch multiple DOM updates
const batcher = new DOMBatcher();
batcher.add(() => element1.style.color = 'red');
batcher.add(() => element2.style.color = 'blue');
// Both updates happen in a single animation frame

// Lazy Loader example - load heavy operations only when needed
const loader = new LazyLoader();
await loader.load('heavyFeature', async () => {
  // Load heavy feature
  console.log('Loading heavy feature...');
});

// Event Manager example - prevent memory leaks
const eventManager = new EventManager();
eventManager.add(button, 'click', handleClick);
// Later...
eventManager.removeAll(); // Clean up all listeners
```

### Caching Best Practices

```javascript
// Profile caching (already implemented)
let profileCache = null;
let profileCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function getCachedProfile() {
  if (profileCache && (Date.now() - profileCacheTime) < CACHE_DURATION) {
    return profileCache;
  }
  
  const result = await chrome.storage.local.get(['userProfile']);
  profileCache = result.userProfile;
  profileCacheTime = Date.now();
  return profileCache;
}

// Invalidate cache when data changes
function invalidateCache() {
  profileCache = null;
  profileCacheTime = 0;
}
```

### DOM Optimization Patterns

```javascript
// ❌ Bad - Multiple reflows
element.style.width = '100px';
element.style.height = '100px';
element.style.color = 'red';

// ✅ Good - Single reflow with cssText
element.style.cssText = 'width: 100px; height: 100px; color: red;';

// ✅ Better - Batch with requestAnimationFrame
requestAnimationFrame(() => {
  element.style.width = '100px';
  element.style.height = '100px';
  element.style.color = 'red';
});

// ❌ Bad - Query inside loop
for (let i = 0; i < items.length; i++) {
  const element = document.querySelector('.item');
  element.textContent = items[i];
}

// ✅ Good - Query once, reuse
const element = document.querySelector('.item');
for (let i = 0; i < items.length; i++) {
  element.textContent = items[i];
}
```

### Async Operation Patterns

```javascript
// ❌ Bad - Sequential execution
for (const field of fields) {
  const result = await processField(field);
  results.push(result);
}

// ✅ Good - Parallel execution
const promises = fields.map(field => processField(field));
const results = await Promise.all(promises);

// ✅ Better - Parallel with error handling
const results = await Promise.allSettled(
  fields.map(field => processField(field))
);
```

### Memory Management

```javascript
// ❌ Bad - Memory leak
element.addEventListener('click', handleClick);
// Never removed

// ✅ Good - Proper cleanup
const controller = new AbortController();
element.addEventListener('click', handleClick, { 
  signal: controller.signal 
});
// Later...
controller.abort(); // Removes listener

// ✅ Better - Use EventManager
const eventManager = new EventManager();
eventManager.add(element, 'click', handleClick);
// Later...
eventManager.removeAll();
```

### Visibility Checks

```javascript
// ❌ Bad - Expensive style computation first
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none';
}

// ✅ Good - Quick checks first
function isVisible(element) {
  // Quick check (no style computation)
  if (element.offsetParent === null) return false;
  
  // Bounding rect check
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  
  // Only compute style if needed
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}
```

## Performance Checklist

### Before Committing Code

- [ ] Are DOM queries cached?
- [ ] Are style changes batched?
- [ ] Are async operations parallelized where possible?
- [ ] Are event listeners properly cleaned up?
- [ ] Is data cached appropriately?
- [ ] Are expensive operations debounced/throttled?
- [ ] Are visibility checks optimized?
- [ ] Is memory usage stable over time?

### Testing Performance

```javascript
// Measure execution time
console.time('operation');
await performOperation();
console.timeEnd('operation');

// Measure memory usage
console.memory.usedJSHeapSize; // Chrome only

// Profile with Chrome DevTools
// 1. Open DevTools
// 2. Go to Performance tab
// 3. Record while using extension
// 4. Analyze flame graph
```

## Common Pitfalls

### 1. Over-caching
```javascript
// ❌ Bad - Cache never expires
let cache = {};

// ✅ Good - Cache with TTL
let cache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > TTL) {
      cache.delete(key);
    }
  }
}, TTL);
```

### 2. Unnecessary Re-renders
```javascript
// ❌ Bad - Re-render on every change
input.addEventListener('input', () => {
  updateUI();
});

// ✅ Good - Debounce updates
const debouncedUpdate = debounce(updateUI, 300);
input.addEventListener('input', debouncedUpdate);
```

### 3. Blocking the Main Thread
```javascript
// ❌ Bad - Synchronous heavy operation
function processLargeArray(arr) {
  return arr.map(item => heavyComputation(item));
}

// ✅ Good - Break into chunks
async function processLargeArray(arr) {
  const results = [];
  for (let i = 0; i < arr.length; i += 100) {
    const chunk = arr.slice(i, i + 100);
    results.push(...chunk.map(item => heavyComputation(item)));
    await new Promise(resolve => setTimeout(resolve, 0)); // Yield
  }
  return results;
}
```

## Monitoring Performance

### Key Metrics to Track

1. **Time to Interactive (TTI)**: How long until extension is usable
2. **Form Fill Time**: Time to complete auto-fill
3. **Memory Usage**: Heap size over time
4. **Cache Hit Rate**: Percentage of cache hits vs misses
5. **API Response Time**: Backend call latency

### Setting Up Monitoring

```javascript
// Simple performance tracker
class PerformanceTracker {
  constructor() {
    this.metrics = {};
  }

  start(name) {
    this.metrics[name] = performance.now();
  }

  end(name) {
    if (this.metrics[name]) {
      const duration = performance.now() - this.metrics[name];
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      delete this.metrics[name];
      return duration;
    }
  }
}

// Usage
const tracker = new PerformanceTracker();
tracker.start('formFill');
await fillForm();
tracker.end('formFill');
```

## Resources

- [Chrome Extension Performance Best Practices](https://developer.chrome.com/docs/extensions/mv3/performance/)
- [Web Performance Optimization](https://web.dev/performance/)
- [JavaScript Performance Tips](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

## Support

For questions or issues related to performance optimizations, please:
1. Check this guide first
2. Review the PERFORMANCE_IMPROVEMENTS.md document
3. Profile the issue with Chrome DevTools
4. Open an issue with performance metrics
