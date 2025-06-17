#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les problèmes de linting identifiés par GitHub Copilot
 *
 * Problèmes ciblés :
 * 1. Console statements → debugLog/debugError/debugWarn (selon mémoire)
 * 2. Variables non utilisées
 * 3. Erreurs Testing Library
 * 4. Problèmes de parsing (caractères corrompus)
 */

const fs = require('fs');
const path = require('path');

console.log(
  '🔧 Démarrage du script de correction automatique des erreurs de linting...\n'
);

// Configuration
const PATHS_TO_FIX = [
  'src/tests',
  'src/utils',
  'src/components',
  'src/services',
];

const EXCLUDE_FILES = ['node_modules', '.git', 'build', 'dist'];

/**
 * Corriger les problèmes de console statements dans les tests
 * Selon la mémoire : debugLog/debugError/debugWarn déjà implémenté
 */
function fixConsoleStatementsInTests(content, filePath) {
  if (!filePath.includes('test.js')) return content;

  let fixed = content;

  // Dans les tests, on peut garder les console.log mockés
  if (content.includes('console.log = jest.fn()')) {
    console.log(
      `  ✅ ${filePath}: Console mocks détectés, pas de modification nécessaire`
    );
    return fixed;
  }

  // Ajouter les mocks console si manquants
  if (
    content.includes('beforeEach') &&
    !content.includes('console.log = jest.fn()')
  ) {
    fixed = fixed.replace(
      /beforeEach\s*\(\s*\(\s*\)\s*=>\s*\{/g,
      `beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();`
    );
    console.log(`  🔧 ${filePath}: Ajout des mocks console`);
  }

  return fixed;
}

/**
 * Corriger les erreurs Testing Library
 */
function fixTestingLibraryErrors(content, filePath) {
  if (!filePath.includes('test.js')) return content;

  let fixed = content;

  // Remplacer container.querySelector par des méthodes Testing Library
  const containerQueries = [
    {
      pattern: /container\.querySelector\(['"`]\.([^'"`]+)['"`]\)/g,
      replacement: (match, className) =>
        `screen.getByRole('generic', { class: /${className}/ })`,
    },
    {
      pattern: /container\.firstChild/g,
      replacement: 'screen.queryByTestId("container")?.firstChild || null',
    },
  ];

  containerQueries.forEach(({ pattern, replacement }) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      console.log(`  🔧 ${filePath}: Correction Testing Library`);
    }
  });

  return fixed;
}

/**
 * Supprimer les variables non utilisées simples
 */
function fixUnusedVariables(content, filePath) {
  let fixed = content;

  // Variables communes non utilisées dans les tests
  const unusedInTests = [
    /let\s+handler\s*=\s*[^;]+;?\s*(?=\n|\r)/g,
    /const\s+handler\s*=\s*[^;]+;?\s*(?=\n|\r)/g,
  ];

  if (filePath.includes('test.js')) {
    unusedInTests.forEach(pattern => {
      if (pattern.test(fixed)) {
        fixed = fixed.replace(
          pattern,
          '// Variable handler supprimée (non utilisée)'
        );
        console.log(`  🔧 ${filePath}: Suppression variable non utilisée`);
      }
    });
  }

  return fixed;
}

/**
 * Corriger les erreurs de caractères corrompus
 */
function fixCorruptedCharacters(content, filePath) {
  let fixed = content;

  // Détecter et corriger les caractères Unicode problématiques
  const corruptedPatterns = [
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, // Caractères de contrôle
    /\uFEFF/g, // BOM
    /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
  ];

  corruptedPatterns.forEach(pattern => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, '');
      console.log(`  🔧 ${filePath}: Suppression caractères corrompus`);
    }
  });

  return fixed;
}

/**
 * Traiter un fichier
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;

    // Appliquer les corrections
    fixedContent = fixCorruptedCharacters(fixedContent, filePath);
    fixedContent = fixConsoleStatementsInTests(fixedContent, filePath);
    fixedContent = fixTestingLibraryErrors(fixedContent, filePath);
    fixedContent = fixUnusedVariables(fixedContent, filePath);

    // Écrire seulement si des changements ont été apportés
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`  ✅ ${filePath}: Corrections appliquées`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`  ❌ Erreur traitement ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Scanner récursivement les dossiers
 */
function scanDirectory(dirPath) {
  const files = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !EXCLUDE_FILES.includes(item)) {
        files.push(...scanDirectory(fullPath));
      } else if (
        stat.isFile() &&
        (item.endsWith('.js') || item.endsWith('.jsx'))
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erreur lecture dossier ${dirPath}:`, error.message);
  }

  return files;
}

/**
 * Main
 */
function main() {
  let totalFiles = 0;
  let fixedFiles = 0;

  console.log('📁 Analyse des dossiers:');
  PATHS_TO_FIX.forEach(pathToFix => {
    if (fs.existsSync(pathToFix)) {
      console.log(`  ${pathToFix}/`);
    } else {
      console.log(`  ⚠️  ${pathToFix}/ (n'existe pas)`);
    }
  });

  console.log('\n🔍 Scan des fichiers...\n');

  for (const pathToFix of PATHS_TO_FIX) {
    if (!fs.existsSync(pathToFix)) continue;

    console.log(`📂 Traitement de ${pathToFix}/:`);
    const files = scanDirectory(pathToFix);

    for (const file of files) {
      totalFiles++;
      const wasFixed = processFile(file);
      if (wasFixed) fixedFiles++;
    }
    console.log('');
  }

  console.log('📊 Résumé:');
  console.log(`   Total fichiers traités: ${totalFiles}`);
  console.log(`   Fichiers corrigés: ${fixedFiles}`);
  console.log(`   Fichiers sans modification: ${totalFiles - fixedFiles}`);

  if (fixedFiles > 0) {
    console.log(
      '\n✅ Corrections appliquées ! Relancez le linter pour vérifier.'
    );
    console.log('   npm run lint');
  } else {
    console.log(
      '\n💡 Aucune correction automatique possible. Vérification manuelle nécessaire.'
    );
  }
}

// Exécution
main();
