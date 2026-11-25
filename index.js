import { appendFileSync } from 'node:fs';

const inputPayload = process.env.INPUT_PAYLOAD;
const outputFile = process.env.GITHUB_OUTPUT;

if (typeof inputPayload !== 'string') {
  throw new Error('INPUT_PAYLOAD must be set');
}
if (typeof outputFile !== 'string' || outputFile.length === 0) {
  throw new Error('GITHUB_OUTPUT must be set');
}

let parsed;
try {
  parsed = JSON.parse(inputPayload);
} catch {
  throw new Error('INPUT_PAYLOAD must be valid JSON');
}

if (
  parsed === null ||
  typeof parsed !== 'object' ||
  Array.isArray(parsed)
) {
  throw new Error('payload must be an object');
}

const hasOwn = Object.prototype.hasOwnProperty;
if (!hasOwn.call(parsed, 'value') || !hasOwn.call(parsed, 'path')) {
  throw new Error('payload must contain value and path');
}

const { value, path } = parsed;

if (value === null || typeof value !== 'object' || Array.isArray(value)) {
  throw new Error('value must be a plain object');
}
if (
  Object.getPrototypeOf(value) !== Object.prototype &&
  Object.getPrototypeOf(value) !== null
) {
  throw new Error('value must be a plain object');
}
if (typeof path !== 'string' || path.length === 0) {
  throw new Error('path must be a non-empty string');
}

const segments = path.split('.');
if (segments.length === 0) {
  throw new Error('path must be dot-separated');
}
const segmentRe = /^[A-Za-z0-9_-]+$/;
for (let i = 0; i < segments.length; i++) {
  if (!segmentRe.test(segments[i])) {
    throw new Error('invalid path segment');
  }
}

let current = value;
let exists = true;

for (let i = 0; i < segments.length; i++) {
  const key = segments[i];
  if (current === null || typeof current !== 'object' || !hasOwn.call(current, key)) {
    exists = false;
    break;
  }
  current = current[key];
}

const result = exists ? { exists: true, value: current } : { exists: false, value: null };
appendFileSync(outputFile, `result=${JSON.stringify(result)}\n`);