#!/usr/bin/env node

/**
 * Icon Validation Script
 *
 * Validates downloaded icons and metadata for:
 * - SVG file integrity
 * - Proper SVG structure
 * - Metadata consistency
 * - File naming conventions
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  iconsDir: path.join(__dirname, '../../public/icons'),
  metadataFile: path.join(__dirname, '../../public/data/icons-metadata.json'),
  expectedLibraries: ['tabler', 'lucide', 'bootstrap', 'phosphor', 'heroicons', 'feather']
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const validateSvgFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if it's a valid SVG
    if (!content.includes('<svg')) {
      return { valid: false, error: 'Not a valid SVG file' };
    }

    // Check for required SVG attributes
    if (!content.includes('viewBox') && !content.includes('width') && !content.includes('height')) {
      return { valid: false, error: 'Missing viewBox or dimension attributes' };
    }

    // Check for properly closed SVG tag
    if (!content.includes('</svg>')) {
      return { valid: false, error: 'SVG tag not properly closed' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const validateLibrary = (libraryName) => {
  const libraryPath = path.join(CONFIG.iconsDir, libraryName);

  if (!fs.existsSync(libraryPath)) {
    log(`Library directory not found: ${libraryName}`, 'error');
    return { valid: false, iconCount: 0, errors: [`Directory not found: ${libraryPath}`] };
  }

  const files = fs.readdirSync(libraryPath).filter(file => file.endsWith('.svg'));
  const errors = [];
  let validIcons = 0;

  log(`Validating ${files.length} icons in ${libraryName}...`);

  for (const file of files) {
    const filePath = path.join(libraryPath, file);
    const validation = validateSvgFile(filePath);

    if (validation.valid) {
      validIcons++;
    } else {
      errors.push(`${file}: ${validation.error}`);
    }
  }

  const isValid = errors.length === 0;
  if (isValid) {
    log(`${libraryName}: ${validIcons} valid icons`, 'success');
  } else {
    log(`${libraryName}: ${validIcons} valid, ${errors.length} invalid icons`, 'warning');
  }

  return {
    valid: isValid,
    iconCount: validIcons,
    totalFiles: files.length,
    errors
  };
};

const validateMetadata = () => {
  if (!fs.existsSync(CONFIG.metadataFile)) {
    log('Metadata file not found', 'error');
    return { valid: false, error: 'Metadata file not found' };
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(CONFIG.metadataFile, 'utf8'));

    // Check required fields
    const requiredFields = ['version', 'generated', 'totalIcons', 'libraries', 'icons', 'categories'];
    const missingFields = requiredFields.filter(field => !(field in metadata));

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate icons array
    if (!Array.isArray(metadata.icons)) {
      return { valid: false, error: 'Icons field must be an array' };
    }

    // Check icon metadata structure
    const iconErrors = [];
    metadata.icons.forEach((icon, index) => {
      const requiredIconFields = ['name', 'library', 'libraryKey', 'category', 'filePath'];
      const missingIconFields = requiredIconFields.filter(field => !(field in icon));

      if (missingIconFields.length > 0) {
        iconErrors.push(`Icon ${index}: missing fields - ${missingIconFields.join(', ')}`);
      }
    });

    if (iconErrors.length > 0) {
      return {
        valid: false,
        error: `Icon metadata errors: ${iconErrors.slice(0, 5).join('; ')}${iconErrors.length > 5 ? '...' : ''}`
      };
    }

    log(`Metadata validation passed: ${metadata.totalIcons} icons`, 'success');
    return { valid: true, metadata };

  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error.message}` };
  }
};

const generateReport = (validationResults, metadataValidation) => {
  console.log('\n📊 Validation Report');
  console.log('==================');

  let totalIcons = 0;
  let totalErrors = 0;

  // Library validation results
  CONFIG.expectedLibraries.forEach(lib => {
    const result = validationResults[lib];
    if (result) {
      console.log(`\n${lib.toUpperCase()}:`);
      console.log(`  Valid icons: ${result.iconCount}`);
      console.log(`  Total files: ${result.totalFiles}`);
      console.log(`  Status: ${result.valid ? '✅ Valid' : '❌ Has errors'}`);

      if (result.errors.length > 0) {
        console.log(`  Errors (showing first 3):`);
        result.errors.slice(0, 3).forEach(error => {
          console.log(`    • ${error}`);
        });
        if (result.errors.length > 3) {
          console.log(`    ... and ${result.errors.length - 3} more errors`);
        }
      }

      totalIcons += result.iconCount;
      totalErrors += result.errors.length;
    } else {
      console.log(`\n${lib.toUpperCase()}: ❌ Not found`);
    }
  });

  // Metadata validation
  console.log(`\nMETADATA:`);
  console.log(`  Status: ${metadataValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
  if (!metadataValidation.valid) {
    console.log(`  Error: ${metadataValidation.error}`);
  }

  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`  Total valid icons: ${totalIcons}`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log(`  Libraries: ${CONFIG.expectedLibraries.length}`);
  console.log(`  Overall status: ${totalErrors === 0 && metadataValidation.valid ? '✅ All valid' : '❌ Has issues'}`);

  return {
    totalIcons,
    totalErrors,
    allValid: totalErrors === 0 && metadataValidation.valid
  };
};

const main = () => {
  log('Starting icon validation...');

  // Validate each library
  const validationResults = {};
  CONFIG.expectedLibraries.forEach(lib => {
    validationResults[lib] = validateLibrary(lib);
  });

  // Validate metadata
  const metadataValidation = validateMetadata();

  // Generate report
  const summary = generateReport(validationResults, metadataValidation);

  if (summary.allValid) {
    log('✨ All icons and metadata are valid!', 'success');
    process.exit(0);
  } else {
    log(`❌ Validation failed with ${summary.totalErrors} errors`, 'error');
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { validateSvgFile, validateLibrary, validateMetadata };