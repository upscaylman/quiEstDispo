// Utilitaire de logging conditionnel

export const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const debugInfo = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(...args);
  }
};

export const debugWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

export const debugError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
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
