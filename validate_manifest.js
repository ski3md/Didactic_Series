#!/usr/bin/env node

// Manifest Validation Script (ES Module Version)
// Usage: node validate_manifest.js [--fix] [--verbose]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_FILE = path.join(__dirname, 'src/assets/data/image_manifest.json');
const METADATA_RULES_FILE = path.join(__dirname, 'src/assets/data/metadata_rules.json');
const FIX_ISSUES = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose');

function log(message, level = 'info') {
  if (VERBOSE || level === 'error') {
    console.log(message);
  }
}

function validateJSONFile(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`❌ ${description} not found: ${filePath}`, 'error');
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      log(`❌ ${description} is empty: ${filePath}`, 'error');
      return null;
    }
    
    if (!content.startsWith('{') || !content.endsWith('}')) {
      log(`❌ ${description} has invalid JSON format: ${filePath}`, 'error');
      log(`Content preview: ${content.substring(0, 100)}...`, 'error');
      return null;
    }
    
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error parsing ${description}: ${error.message}`, 'error');
    return null;
  }
}

function createEmptyManifest() {
  const emptyManifest = {
    generated: new Date().toISOString(),
    ai_enhanced: false,
    version: "1.0.0",
    schema: "who-2022-thoracic",
    categories: {}
  };
  
  try {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(emptyManifest, null, 2));
    log(`✅ Created empty manifest file: ${MANIFEST_FILE}`);
    return emptyManifest;
  } catch (error) {
    log(`❌ Failed to create empty manifest: ${error.message}`, 'error');
    return null;
  }
}

function createEmptyRules() {
  const emptyRules = {
    version: "1.0.0",
    schema: "who-2022-thoracic",
    entities: {},
    stainRoles: {
      "H&E": "general morphology",
      "GMS": "highlight fungal cell walls",
      "PAS": "highlight fungal cell walls and mucin",
      "AFB": "highlight mycobacterial organisms",
      "Polarized": "reveal polarizable foreign material"
    },
    difficultyLevels: {
      "beginner": "Classic presentations with obvious diagnostic features",
      "intermediate": "Moderate diagnostic complexity, requires pattern recognition",
      "advanced": "Subtle findings, mimics, or rare presentations"
    }
  };
  
  try {
    fs.writeFileSync(METADATA_RULES_FILE, JSON.stringify(emptyRules, null, 2));
    log(`✅ Created empty rules file: ${METADATA_RULES_FILE}`);
    return emptyRules;
  } catch (error) {
    log(`❌ Failed to create empty rules: ${error.message}`, 'error');
    return null;
  }
}

function validateManifest() {
  log('🔍 Validating image manifest...');
  
  // Validate manifest file
  let manifest = validateJSONFile(MANIFEST_FILE, 'Manifest file');
  if (!manifest) {
    if (FIX_ISSUES) {
      log('🔧 Creating empty manifest file...');
      manifest = createEmptyManifest();
      if (!manifest) return false;
    } else {
      log('💡 Use --fix to create an empty manifest file');
      return false;
    }
  }
  
  // Validate rules file
  let rules = validateJSONFile(METADATA_RULES_FILE, 'Metadata rules file');
  if (!rules) {
    if (FIX_ISSUES) {
      log('🔧 Creating empty rules file...');
      rules = createEmptyRules();
      if (!rules) return false;
    } else {
      log('💡 Use --fix to create an empty rules file');
      return false;
    }
  }
  
  try {
    // Validate manifest structure
    if (!manifest.categories || typeof manifest.categories !== 'object') {
      log('❌ Invalid manifest structure: missing categories', 'error');
      if (FIX_ISSUES) {
        manifest.categories = {};
        log('🔧 Fixed: Added empty categories object');
      } else {
        return false;
      }
    }
    
    if (!rules.entities || typeof rules.entities !== 'object') {
      log('❌ Invalid rules structure: missing entities', 'error');
      if (FIX_ISSUES) {
        rules.entities = {};
        log('🔧 Fixed: Added empty entities object');
      } else {
        return false;
      }
    }
    
    // Check for missing entity mappings
    const manifestEntities = new Set();
    const rulesEntities = new Set(Object.keys(rules.entities));
    
    Object.values(manifest.categories).forEach(category => {
      if (category && typeof category === 'object') {
        Object.keys(category).forEach(entity => {
          manifestEntities.add(entity);
        });
      }
    });
    
    const unmappedEntities = [...manifestEntities].filter(entity => !rulesEntities.has(entity));
    if (unmappedEntities.length > 0) {
      log(`⚠️ Entities without rules mapping: ${unmappedEntities.join(', ')}`);
      
      if (FIX_ISSUES) {
        log('🔧 Adding default mappings for unmapped entities...');
        unmappedEntities.forEach(entity => {
          rules.entities[entity] = {
            category: 'noninfectious',
            patterns: [],
            cells: ['epithelioid histiocytes'],
            difficulty: 'intermediate',
            tags: [entity],
            teachingPoint: `${entity} granulomatous inflammation.`
          };
        });
        
        fs.writeFileSync(METADATA_RULES_FILE, JSON.stringify(rules, null, 2));
        log('✅ Fixed unmapped entities');
      }
    }
    
    // Check for duplicate IDs
    const allIds = new Set();
    const duplicateIds = new Set();
    
    Object.values(manifest.categories).forEach(category => {
      if (category && typeof category === 'object') {
        Object.values(category).forEach(entity => {
          if (entity && typeof entity === 'object') {
            Object.values(entity).forEach(stainImages => {
              if (Array.isArray(stainImages)) {
                stainImages.forEach(image => {
                  if (image && image.id) {
                    if (allIds.has(image.id)) {
                      duplicateIds.add(image.id);
                    } else {
                      allIds.add(image.id);
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
    
    if (duplicateIds.size > 0) {
      log(`⚠️ Duplicate image IDs found: ${[...duplicateIds].join(', ')}`);
      
      if (FIX_ISSUES) {
        log('🔧 Fixing duplicate IDs...');
        Object.entries(manifest.categories).forEach(([categoryName, category]) => {
          Object.entries(category).forEach(([entityName, entity]) => {
            Object.entries(entity).forEach(([stainName, stainImages]) => {
              stainImages.forEach((image, index) => {
                if (duplicateIds.has(image.id)) {
                  // Generate new unique ID
                  const newId = `${entityName}_${stainName.toLowerCase()}_${Date.now()}_${index}`;
                  image.id = newId;
                  log(`  Fixed: ${image.id} → ${newId}`);
                }
              });
            });
          });
        });
        
        fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
        log('✅ Fixed duplicate IDs');
      }
    }
    
    // Check for missing required fields
    const requiredFields = ['id', 'entity', 'category', 'stain', 'path'];
    const missingFields = new Set();
    
    Object.values(manifest.categories).forEach(category => {
      if (category && typeof category === 'object') {
        Object.values(category).forEach(entity => {
          if (entity && typeof entity === 'object') {
            Object.values(entity).forEach(stainImages => {
              if (Array.isArray(stainImages)) {
                stainImages.forEach(image => {
                  if (image) {
                    requiredFields.forEach(field => {
                      if (!image[field]) {
                        missingFields.add(`${image.id || 'unknown'}: ${field}`);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    
    if (missingFields.size > 0) {
      log(`⚠️ Missing required fields: ${[...missingFields].join(', ')}`);
    }
    
    // Generate statistics
    let totalImages = 0;
    const categoryCounts = {};
    const entityCounts = {};
    const stainCounts = {};
    
    Object.entries(manifest.categories).forEach(([categoryName, category]) => {
      if (category && typeof category === 'object') {
        categoryCounts[categoryName] = 0;
        Object.entries(category).forEach(([entityName, entity]) => {
          if (entity && typeof entity === 'object') {
            entityCounts[entityName] = 0;
            Object.entries(entity).forEach(([stainName, stainImages]) => {
              if (Array.isArray(stainImages)) {
                if (!stainCounts[stainName]) stainCounts[stainName] = 0;
                stainCounts[stainName] += stainImages.length;
                entityCounts[entityName] += stainImages.length;
                categoryCounts[categoryName] += stainImages.length;
                totalImages += stainImages.length;
              }
            });
          }
        });
      }
    });
    
    log('📊 Manifest Statistics:');
    log(`  Total images: ${totalImages}`);
    log('  Categories:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      log(`    ${cat}: ${count}`);
    });
    log('  Top entities:');
    Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([entity, count]) => {
        log(`    ${entity}: ${count}`);
      });
    log('  Stains:');
    Object.entries(stainCounts).forEach(([stain, count]) => {
      log(`    ${stain}: ${count}`);
    });
    
    log('✅ Manifest validation complete');
    return true;
    
  } catch (error) {
    log(`❌ Validation error: ${error.message}`, 'error');
    if (VERBOSE) {
      log(error.stack, 'error');
    }
    return false;
  }
}

// Run validation
const isValid = validateManifest();
process.exit(isValid ? 0 : 1);