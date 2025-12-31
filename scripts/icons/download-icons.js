#!/usr/bin/env node

/**
 * Icon Download Script
 *
 * Downloads and processes free icons from major open-source libraries:
 * - Tabler Icons (5,600+ icons)
 * - Lucide Icons (1,400+ icons)
 * - Bootstrap Icons (1,800+ icons)
 * - Phosphor Icons (6,000+ icons)
 * - Heroicons (300+ icons)
 * - Feather Icons (280+ icons)
 *
 * Total: ~15,000+ free icons
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, '../../public/icons'),
  metadataFile: path.join(__dirname, '../../public/data/icons-metadata.json'),
  libraries: {
    tabler: {
      name: 'Tabler Icons',
      url: 'https://github.com/tabler/tabler-icons/archive/refs/heads/main.zip',
      iconPath: 'tabler-icons-main/icons',
      license: 'MIT',
      website: 'https://tabler.io/icons',
      count: 5600
    },
    lucide: {
      name: 'Lucide Icons',
      url: 'https://github.com/lucide-icons/lucide/archive/refs/heads/main.zip',
      iconPath: 'lucide-main/icons',
      license: 'ISC',
      website: 'https://lucide.dev',
      count: 1400
    },
    bootstrap: {
      name: 'Bootstrap Icons',
      url: 'https://github.com/twbs/icons/archive/refs/heads/main.zip',
      iconPath: 'icons-main/icons',
      license: 'MIT',
      website: 'https://icons.getbootstrap.com',
      count: 1800
    },
    phosphor: {
      name: 'Phosphor Icons',
      url: 'https://github.com/phosphor-icons/core/archive/refs/heads/main.zip',
      iconPath: 'core-main/assets/regular',
      license: 'MIT',
      website: 'https://phosphoricons.com',
      count: 6000
    },
    heroicons: {
      name: 'Heroicons',
      url: 'https://github.com/tailwindlabs/heroicons/archive/refs/heads/master.zip',
      iconPath: 'heroicons-master/src/24/outline',
      license: 'MIT',
      website: 'https://heroicons.com',
      count: 300
    },
    feather: {
      name: 'Feather Icons',
      url: 'https://github.com/feathericons/feather/archive/refs/heads/main.zip',
      iconPath: 'feather-main/icons',
      license: 'MIT',
      website: 'https://feathericons.com',
      count: 280
    }
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, destination).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
};

const extractZip = (zipFile, destination) => {
  try {
    execSync(`unzip -q "${zipFile}" -d "${destination}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Failed to extract ${zipFile}: ${error.message}`, 'error');
    return false;
  }
};

const optimizeSvg = (svgContent) => {
  // Basic SVG optimization
  return svgContent
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim();
};

const generateIconMetadata = (iconName, library, svgContent) => {
  // Extract metadata from SVG
  const titleMatch = svgContent.match(/<title>(.*?)<\/title>/i);
  const descMatch = svgContent.match(/<desc>(.*?)<\/desc>/i);

  // Generate keywords based on icon name
  const keywords = iconName
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(word => word.length > 2);

  // Categorize icon based on name patterns
  const category = categorizeIcon(iconName);

  return {
    name: iconName,
    library: library.name,
    libraryKey: Object.keys(CONFIG.libraries).find(key => CONFIG.libraries[key] === library),
    title: titleMatch ? titleMatch[1] : iconName.replace(/[-_]/g, ' '),
    description: descMatch ? descMatch[1] : `${iconName} icon from ${library.name}`,
    keywords,
    category,
    license: library.license,
    website: library.website,
    filePath: `icons/${Object.keys(CONFIG.libraries).find(key => CONFIG.libraries[key] === library)}/${iconName}.svg`,
    optimized: true
  };
};

const categorizeIcon = (iconName) => {
  const name = iconName.toLowerCase();

  // Category mapping based on common icon patterns
  const categories = {
    'ecommerce': ['cart', 'shop', 'store', 'buy', 'sell', 'money', 'payment', 'credit', 'cash', 'price', 'tag'],
    'electronics': ['phone', 'mobile', 'laptop', 'computer', 'tablet', 'device', 'screen', 'monitor', 'tv', 'camera', 'headphone'],
    'food': ['food', 'eat', 'restaurant', 'cook', 'kitchen', 'pizza', 'coffee', 'cake', 'fruit', 'vegetable'],
    'transportation': ['car', 'bike', 'plane', 'train', 'bus', 'ship', 'truck', 'vehicle', 'transport'],
    'sports': ['sport', 'game', 'ball', 'fitness', 'gym', 'run', 'swim', 'football', 'basketball', 'tennis'],
    'medical': ['medical', 'health', 'hospital', 'doctor', 'medicine', 'pill', 'heart', 'cross', 'bandage'],
    'office': ['office', 'work', 'business', 'document', 'file', 'folder', 'calendar', 'clock', 'pen', 'paper'],
    'social': ['user', 'people', 'person', 'group', 'team', 'profile', 'avatar', 'social'],
    'communication': ['phone', 'mail', 'message', 'chat', 'call', 'email', 'letter', 'envelope'],
    'navigation': ['arrow', 'direction', 'navigation', 'compass', 'map', 'location', 'gps', 'pointer'],
    'media': ['play', 'pause', 'stop', 'music', 'video', 'audio', 'volume', 'speaker', 'microphone'],
    'weather': ['sun', 'rain', 'cloud', 'snow', 'storm', 'weather', 'temperature', 'wind'],
    'tools': ['tool', 'wrench', 'hammer', 'screwdriver', 'build', 'construction', 'repair', 'fix'],
    'home': ['home', 'house', 'building', 'door', 'window', 'room', 'furniture', 'bed', 'chair'],
    'nature': ['tree', 'plant', 'flower', 'leaf', 'nature', 'garden', 'animal', 'pet'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }

  return 'general';
};

const processLibrary = async (libraryKey, library) => {
  log(`Processing ${library.name}...`);

  const tempDir = path.join(__dirname, 'temp');
  const zipFile = path.join(tempDir, `${libraryKey}.zip`);
  const extractDir = path.join(tempDir, libraryKey);
  const outputDir = path.join(CONFIG.outputDir, libraryKey);

  // Create directories
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Download library
    log(`Downloading ${library.name} from ${library.url}`);
    await downloadFile(library.url, zipFile);
    log(`Downloaded ${library.name}`, 'success');

    // Extract archive
    log(`Extracting ${library.name}...`);
    if (!extractZip(zipFile, extractDir)) {
      throw new Error('Failed to extract archive');
    }

    // Find icon files
    const iconDir = path.join(extractDir, library.iconPath);
    if (!fs.existsSync(iconDir)) {
      throw new Error(`Icon directory not found: ${iconDir}`);
    }

    const iconFiles = fs.readdirSync(iconDir).filter(file => file.endsWith('.svg'));
    log(`Found ${iconFiles.length} icons in ${library.name}`);

    const metadata = [];

    // Process each icon
    for (const iconFile of iconFiles) {
      const iconName = path.basename(iconFile, '.svg');
      const sourcePath = path.join(iconDir, iconFile);
      const destPath = path.join(outputDir, iconFile);

      // Read and optimize SVG
      let svgContent = fs.readFileSync(sourcePath, 'utf8');
      svgContent = optimizeSvg(svgContent);

      // Write optimized SVG
      fs.writeFileSync(destPath, svgContent);

      // Generate metadata
      const iconMetadata = generateIconMetadata(iconName, library, svgContent);
      metadata.push(iconMetadata);
    }

    // Clean up temp files
    fs.rmSync(zipFile, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });

    log(`Processed ${iconFiles.length} icons from ${library.name}`, 'success');
    return metadata;

  } catch (error) {
    log(`Error processing ${library.name}: ${error.message}`, 'error');
    return [];
  }
};

const main = async () => {
  log('Starting icon download and processing...');

  // Create output directories
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(path.dirname(CONFIG.metadataFile), { recursive: true });

  const allMetadata = [];
  let totalIcons = 0;

  // Process each library
  for (const [key, library] of Object.entries(CONFIG.libraries)) {
    const metadata = await processLibrary(key, library);
    allMetadata.push(...metadata);
    totalIcons += metadata.length;
  }

  // Create comprehensive metadata file
  const finalMetadata = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    totalIcons,
    libraries: Object.keys(CONFIG.libraries).length,
    icons: allMetadata,
    categories: [...new Set(allMetadata.map(icon => icon.category))].sort(),
    libraryStats: Object.entries(CONFIG.libraries).map(([key, lib]) => ({
      key,
      name: lib.name,
      count: allMetadata.filter(icon => icon.libraryKey === key).length,
      license: lib.license,
      website: lib.website
    }))
  };

  // Write metadata file
  fs.writeFileSync(CONFIG.metadataFile, JSON.stringify(finalMetadata, null, 2));

  // Clean up temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  log(`✨ Successfully downloaded and processed ${totalIcons} icons from ${Object.keys(CONFIG.libraries).length} libraries!`, 'success');
  log(`📊 Metadata saved to: ${CONFIG.metadataFile}`);
  log(`📁 Icons saved to: ${CONFIG.outputDir}`);

  // Print summary
  console.log('\n📈 Summary:');
  finalMetadata.libraryStats.forEach(lib => {
    console.log(`  ${lib.name}: ${lib.count} icons`);
  });
  console.log(`\n🎯 Total: ${totalIcons} icons across ${finalMetadata.categories.length} categories`);
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main, CONFIG };