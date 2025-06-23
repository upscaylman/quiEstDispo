#!/usr/bin/env node
// Script de lancement des tests E2E - PHASE 6

const { spawn } = require('child_process');
const path = require('path');

console.log('🎭 Lancement des tests End-to-End - PHASE 6');
console.log('='.repeat(50));

// Configuration
const testPattern = process.argv[2] || '**/*.e2e.js';
const verbose =
  process.argv.includes('--verbose') || process.argv.includes('-v');

// Vérifier que l'application est démarrée
console.log(
  "⚠️  IMPORTANT: Assurez-vous que l'application tourne sur http://localhost:3000"
);
console.log(
  '   Exécutez "npm start" dans un autre terminal si ce n\'est pas fait'
);
console.log('');

// Configuration Jest pour E2E
const jestConfig = {
  testMatch: [`${__dirname}/tests/${testPattern}`],
  testTimeout: 120000, // 2 minutes par test
  setupFilesAfterEnv: [],
  testEnvironment: 'node',
  verbose: verbose,
  forceExit: true,
  detectOpenHandles: true,
};

// Créer le fichier de configuration temporaire
const fs = require('fs');
const configPath = path.join(__dirname, 'jest.config.temp.js');
const configContent = `module.exports = ${JSON.stringify(jestConfig, null, 2)};`;
fs.writeFileSync(configPath, configContent);

console.log(`🧪 Pattern de test: ${testPattern}`);
console.log(`⏱️  Timeout par test: ${jestConfig.testTimeout}ms`);
console.log('');

// Lancer Jest
const jestArgs = [
  '--config',
  configPath,
  '--runInBand', // Exécuter les tests en série pour éviter les conflits
  '--no-cache',
];

if (verbose) {
  jestArgs.push('--verbose');
}

const jestProcess = spawn('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

jestProcess.on('close', code => {
  // Nettoyer le fichier de configuration temporaire
  try {
    fs.unlinkSync(configPath);
  } catch (error) {
    // Ignorer l'erreur si le fichier n'existe pas
  }

  console.log('');
  console.log('='.repeat(50));
  if (code === 0) {
    console.log('✅ Tests E2E terminés avec succès !');
  } else {
    console.log('❌ Tests E2E échoués');
  }

  process.exit(code);
});

jestProcess.on('error', error => {
  console.error('❌ Erreur lors du lancement des tests E2E:', error);
  process.exit(1);
});
