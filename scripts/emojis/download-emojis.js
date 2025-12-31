#!/usr/bin/env node

/**
 * Emoji Download Script
 *
 * Downloads and processes free emojis from open-source libraries:
 * - OpenMoji (4,292+ emojis) - SVG format
 * - Unicode Emoji Data - Metadata and fallbacks
 *
 * Total: ~4,292+ free emojis organized for e-commerce use
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, '../../public/emojis'),
  metadataFile: path.join(__dirname, '../../public/data/emojis-metadata.json'),
  sources: {
    openmoji: {
      name: 'OpenMoji',
      svgUrl: 'https://github.com/hfg-gmuend/openmoji/archive/refs/heads/master.zip',
      metadataUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json',
      svgPath: 'openmoji-master/color/svg',
      license: 'CC BY-SA 4.0',
      website: 'https://openmoji.org',
      count: 4292
    }
  }
};

// E-commerce focused emoji categories
const ECOMMERCE_CATEGORIES = {
  'emotions-reactions': {
    name: 'Emotions & Reactions',
    description: 'Customer satisfaction, reviews, feedback',
    keywords: ['happy', 'sad', 'love', 'angry', 'surprised', 'thinking', 'wink', 'smile', 'heart', 'thumbs']
  },
  'food-beverages': {
    name: 'Food & Beverages',
    description: 'Restaurants, cafes, food delivery, cooking',
    keywords: ['food', 'drink', 'coffee', 'pizza', 'burger', 'fruit', 'vegetable', 'cake', 'wine', 'beer', 'restaurant']
  },
  'shopping-commerce': {
    name: 'Shopping & Commerce',
    description: 'E-commerce, payments, shopping, sales',
    keywords: ['cart', 'bag', 'money', 'credit', 'dollar', 'euro', 'sale', 'shop', 'store', 'payment', 'receipt']
  },
  'technology-electronics': {
    name: 'Technology & Electronics',
    description: 'Gadgets, devices, tech products',
    keywords: ['phone', 'computer', 'laptop', 'tablet', 'camera', 'headphone', 'watch', 'tv', 'speaker', 'keyboard']
  },
  'transportation-delivery': {
    name: 'Transportation & Delivery',
    description: 'Shipping, logistics, travel, vehicles',
    keywords: ['car', 'truck', 'plane', 'ship', 'train', 'bike', 'delivery', 'package', 'mail', 'logistics']
  },
  'home-living': {
    name: 'Home & Living',
    description: 'Furniture, home goods, lifestyle',
    keywords: ['house', 'home', 'furniture', 'bed', 'chair', 'table', 'lamp', 'kitchen', 'bathroom', 'garden']
  },
  'fashion-accessories': {
    name: 'Fashion & Accessories',
    description: 'Clothing, jewelry, beauty, style',
    keywords: ['shirt', 'dress', 'shoe', 'hat', 'jewelry', 'watch', 'glasses', 'makeup', 'lipstick', 'perfume']
  },
  'sports-fitness': {
    name: 'Sports & Fitness',
    description: 'Exercise, sports, health, wellness',
    keywords: ['sport', 'ball', 'fitness', 'gym', 'run', 'bike', 'swim', 'yoga', 'weight', 'health']
  },
  'animals-nature': {
    name: 'Animals & Nature',
    description: 'Pets, plants, outdoor, environment',
    keywords: ['dog', 'cat', 'bird', 'fish', 'plant', 'tree', 'flower', 'nature', 'pet', 'garden']
  },
  'business-professional': {
    name: 'Business & Professional',
    description: 'Office, work, corporate, services',
    keywords: ['office', 'business', 'work', 'meeting', 'document', 'chart', 'calendar', 'briefcase', 'professional']
  },
  'travel-leisure': {
    name: 'Travel & Leisure',
    description: 'Tourism, vacation, entertainment',
    keywords: ['travel', 'vacation', 'hotel', 'beach', 'mountain', 'camera', 'passport', 'luggage', 'map']
  },
  'symbols-signs': {
    name: 'Symbols & Signs',
    description: 'Icons, arrows, symbols, indicators',
    keywords: ['arrow', 'star', 'heart', 'check', 'cross', 'warning', 'info', 'question', 'exclamation']
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

const downloadJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadJson(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
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

const categorizeEmoji = (emoji) => {
  const searchText = [
    emoji.annotation || '',
    emoji.openmoji_tags || '',
    ...(emoji.openmoji_keywords || [])
  ].join(' ').toLowerCase();

  // Find best matching category
  for (const [categoryKey, categoryData] of Object.entries(ECOMMERCE_CATEGORIES)) {
    for (const keyword of categoryData.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return categoryKey;
      }
    }
  }

  // Fallback to original group or general
  const originalGroup = emoji.group || '';
  const groupMapping = {
    'smileys-emotion': 'emotions-reactions',
    'people-body': 'emotions-reactions',
    'food-drink': 'food-beverages',
    'travel-places': 'travel-leisure',
    'activities': 'sports-fitness',
    'objects': 'technology-electronics',
    'symbols': 'symbols-signs',
    'flags': 'symbols-signs'
  };

  return groupMapping[originalGroup] || 'symbols-signs';
};

const generateEmojiMetadata = (emoji, source) => {
  const category = categorizeEmoji(emoji);

  // Generate keywords from various sources
  const keywords = [
    ...(emoji.openmoji_keywords || []),
    ...(emoji.annotation || '').split(' ').filter(w => w.length > 2),
    ...(emoji.openmoji_tags || '').split(',').map(t => t.trim()).filter(t => t.length > 0)
  ].filter((keyword, index, self) => self.indexOf(keyword) === index); // Remove duplicates

  return {
    unicode: emoji.hexcode,
    name: emoji.annotation || emoji.openmoji_name || emoji.hexcode,
    shortcode: `:${(emoji.openmoji_name || emoji.annotation || emoji.hexcode).toLowerCase().replace(/[^a-z0-9]/g, '_')}:`,
    category,
    subcategory: emoji.subgroup || emoji.group || 'general',
    keywords: keywords.slice(0, 10), // Limit to 10 keywords
    tags: (emoji.openmoji_tags || '').split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5),
    version: emoji.unicode_version || '1.0',
    source: source.name,
    sourceKey: 'openmoji',
    license: source.license,
    website: source.website,
    filePath: `emojis/openmoji/${emoji.hexcode}.svg`,
    optimized: true
  };
};

const processOpenMoji = async () => {
  log('Processing OpenMoji emojis...');

  const source = CONFIG.sources.openmoji;
  const tempDir = path.join(__dirname, 'temp');
  const zipFile = path.join(tempDir, 'openmoji.zip');
  const extractDir = path.join(tempDir, 'openmoji');
  const outputDir = path.join(CONFIG.outputDir, 'openmoji');

  // Create directories
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Download metadata first
    log('Downloading OpenMoji metadata...');
    const metadata = await downloadJson(source.metadataUrl);
    log(`Downloaded metadata for ${metadata.length} emojis`, 'success');

    // Download SVG archive
    log(`Downloading OpenMoji SVGs from ${source.svgUrl}`);
    await downloadFile(source.svgUrl, zipFile);
    log('Downloaded OpenMoji SVG archive', 'success');

    // Extract archive
    log('Extracting OpenMoji archive...');
    if (!extractZip(zipFile, extractDir)) {
      throw new Error('Failed to extract archive');
    }

    // Find SVG files
    const svgDir = path.join(extractDir, source.svgPath);
    if (!fs.existsSync(svgDir)) {
      throw new Error(`SVG directory not found: ${svgDir}`);
    }

    const svgFiles = fs.readdirSync(svgDir).filter(file => file.endsWith('.svg'));
    log(`Found ${svgFiles.length} SVG files`);

    const processedEmojis = [];

    // Process each emoji
    for (const svgFile of svgFiles) {
      const hexcode = path.basename(svgFile, '.svg');
      const emojiData = metadata.find(e => e.hexcode === hexcode);

      if (!emojiData) {
        continue; // Skip if no metadata found
      }

      const sourcePath = path.join(svgDir, svgFile);
      const destPath = path.join(outputDir, svgFile);

      // Read and copy SVG (minimal processing for now)
      let svgContent = fs.readFileSync(sourcePath, 'utf8');

      // Basic SVG optimization
      svgContent = svgContent
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .trim();

      // Write optimized SVG
      fs.writeFileSync(destPath, svgContent);

      // Generate metadata
      const emojiMetadata = generateEmojiMetadata(emojiData, source);
      processedEmojis.push(emojiMetadata);
    }

    // Clean up temp files
    fs.rmSync(zipFile, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });

    log(`Processed ${processedEmojis.length} emojis from OpenMoji`, 'success');
    return processedEmojis;

  } catch (error) {
    log(`Error processing OpenMoji: ${error.message}`, 'error');
    return [];
  }
};

const main = async () => {
  log('Starting emoji download and processing...');

  // Create output directories
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(path.dirname(CONFIG.metadataFile), { recursive: true });

  // Process emojis
  const openmojiEmojis = await processOpenMoji();
  const allEmojis = [...openmojiEmojis];

  // Create comprehensive metadata file
  const categories = Object.keys(ECOMMERCE_CATEGORIES);
  const finalMetadata = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    totalEmojis: allEmojis.length,
    sources: Object.keys(CONFIG.sources).length,
    emojis: allEmojis,
    categories: categories,
    categoryInfo: ECOMMERCE_CATEGORIES,
    sourceStats: [{
      key: 'openmoji',
      name: CONFIG.sources.openmoji.name,
      count: openmojiEmojis.length,
      license: CONFIG.sources.openmoji.license,
      website: CONFIG.sources.openmoji.website
    }]
  };

  // Write metadata file
  fs.writeFileSync(CONFIG.metadataFile, JSON.stringify(finalMetadata, null, 2));

  // Clean up temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  log(`✨ Successfully downloaded and processed ${allEmojis.length} emojis!`, 'success');
  log(`📊 Metadata saved to: ${CONFIG.metadataFile}`);
  log(`📁 Emojis saved to: ${CONFIG.outputDir}`);

  // Print summary
  console.log('\n📈 Summary:');
  console.log(`  OpenMoji: ${openmojiEmojis.length} emojis`);
  console.log(`\n🎯 Total: ${allEmojis.length} emojis across ${categories.length} e-commerce categories`);

  console.log('\n📂 Categories:');
  categories.forEach(cat => {
    const count = allEmojis.filter(e => e.category === cat).length;
    console.log(`  ${ECOMMERCE_CATEGORIES[cat].name}: ${count} emojis`);
  });
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main, CONFIG };