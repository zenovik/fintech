export function uniqueRef(prefix) {
  const vu = typeof __VU !== 'undefined' ? __VU : 0;
  const iter = typeof __ITER !== 'undefined' ? __ITER : 0;
  return `${prefix}-${Date.now()}-${vu}-${iter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@perf.test`;
}

export function randomAmount(min = 10, max = 500) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
