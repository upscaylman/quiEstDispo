// Utilitaire de logging conditionnel
const isDevelopment = process.env.NODE_ENV === 'development';

export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugInfo = (...args) => {
  if (isDevelopment) {
    console.info(...args);
  }
};

export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Les erreurs importantes restent toujours visibles
export const prodLog = (...args) => {
  console.log(...args);
};

export const prodError = (...args) => {
  console.error(...args);
};

export const prodWarn = (...args) => {
  console.warn(...args);
};
