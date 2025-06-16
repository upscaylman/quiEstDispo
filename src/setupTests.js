// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// @ts-nocheck
// Setup pour les tests Jest

// Polyfill simple pour ReadableStream
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {};
}
