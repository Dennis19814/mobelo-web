#!/usr/bin/env node

/**
 * Split Emoji Metadata
 *
 * This script splits the large emoji metadata file into smaller chunks
 * for better performance when loading in the browser.
 */

const fs = require('fs');
const path = require('path');

// Paths
const publicDir = path.join(__dirname, '../../public');
const dataDir = path.join(publicDir, 'data');
const metadataFile = path.join(dataDir, 'emojis-metadata.json');
const chunksDir = path.join(dataDir, 'emoji-chunks');

// Ensure chunks directory exists
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

console.log('🔄 Starting emoji metadata splitting...');

try {
  // Read the original metadata file
  console.log('📖 Reading original metadata file...');
  const metadataContent = fs.readFileSync(metadataFile, 'utf8');
  const metadata = JSON.parse(metadataContent);

  console.log(`📊 Total emojis: ${metadata.totalEmojis}`);
  console.log(`📊 Categories: ${metadata.categories.length}`);
  console.log(`📊 Sources: ${metadata.sources}`);

  // Configuration
  const EMOJIS_PER_CHUNK = 200; // Smaller chunks for better performance
  const totalEmojis = metadata.emojis.length;
  const totalChunks = Math.ceil(totalEmojis / EMOJIS_PER_CHUNK);

  console.log(`🗂️  Creating ${totalChunks} chunks with ~${EMOJIS_PER_CHUNK} emojis each...`);

  // Create light metadata (without emojis array)
  const lightMetadata = {
    version: metadata.version,
    generated: metadata.generated,
    totalEmojis: metadata.totalEmojis,
    sources: metadata.sources,
    categories: metadata.categories,
    categoryInfo: metadata.categoryInfo,
    sourceStats: metadata.sourceStats,
    // Add chunk information
    chunksInfo: {
      totalChunks,
      emojisPerChunk: EMOJIS_PER_CHUNK,
      chunkSize: Math.ceil(totalEmojis / totalChunks)
    }
  };

  // Write light metadata
  const lightMetadataFile = path.join(dataDir, 'emoji-metadata-light.json');
  fs.writeFileSync(lightMetadataFile, JSON.stringify(lightMetadata, null, 2));
  console.log(`✅ Created light metadata: ${(fs.statSync(lightMetadataFile).size / 1024).toFixed(1)}KB`);

  // Create chunks organized by category for better caching
  const chunksByCategory = {};
  const categoryChunks = {};

  // Group emojis by category first
  metadata.categories.forEach(category => {
    const categoryEmojis = metadata.emojis.filter(emoji => emoji.category === category);
    if (categoryEmojis.length > 0) {
      const categoryChunkCount = Math.ceil(categoryEmojis.length / EMOJIS_PER_CHUNK);
      categoryChunks[category] = {
        totalEmojis: categoryEmojis.length,
        chunks: categoryChunkCount,
        emojis: categoryEmojis
      };

      // Split category into chunks
      for (let i = 0; i < categoryChunkCount; i++) {
        const start = i * EMOJIS_PER_CHUNK;
        const end = Math.min(start + EMOJIS_PER_CHUNK, categoryEmojis.length);
        const chunkEmojis = categoryEmojis.slice(start, end);

        const chunkData = {
          category,
          chunkIndex: i,
          totalChunks: categoryChunkCount,
          emojis: chunkEmojis,
          startIndex: start,
          endIndex: end - 1,
          count: chunkEmojis.length
        };

        const chunkFileName = `${category}-${i}.json`;
        const chunkFilePath = path.join(chunksDir, chunkFileName);
        fs.writeFileSync(chunkFilePath, JSON.stringify(chunkData, null, 0)); // Compact JSON

        const chunkSize = (fs.statSync(chunkFilePath).size / 1024).toFixed(1);
        console.log(`  ✅ ${chunkFileName}: ${chunkEmojis.length} emojis (${chunkSize}KB)`);
      }
    }
  });

  // Create category index
  const categoryIndex = {};
  Object.keys(categoryChunks).forEach(category => {
    categoryIndex[category] = {
      totalEmojis: categoryChunks[category].totalEmojis,
      chunks: categoryChunks[category].chunks,
      files: []
    };

    for (let i = 0; i < categoryChunks[category].chunks; i++) {
      categoryIndex[category].files.push(`${category}-${i}.json`);
    }
  });

  const categoryIndexFile = path.join(dataDir, 'emoji-category-index.json');
  fs.writeFileSync(categoryIndexFile, JSON.stringify(categoryIndex, null, 2));
  console.log(`✅ Created category index: ${(fs.statSync(categoryIndexFile).size / 1024).toFixed(1)}KB`);

  // Create popular emojis cache for quick loading
  const popularCategories = [
    'emotions-reactions',
    'food-beverages',
    'shopping-commerce',
    'symbols-signs'
  ];

  const popularEmojis = [];
  popularCategories.forEach(category => {
    if (categoryChunks[category]) {
      // Take first 10 emojis from each popular category
      popularEmojis.push(...categoryChunks[category].emojis.slice(0, 10));
    }
  });

  const popularCache = {
    generated: new Date().toISOString(),
    count: popularEmojis.length,
    categories: popularCategories,
    emojis: popularEmojis
  };

  const popularCacheFile = path.join(dataDir, 'emoji-popular-cache.json');
  fs.writeFileSync(popularCacheFile, JSON.stringify(popularCache, null, 0));
  console.log(`✅ Created popular cache: ${popularEmojis.length} emojis (${(fs.statSync(popularCacheFile).size / 1024).toFixed(1)}KB)`);

  // Summary
  const totalChunkFiles = fs.readdirSync(chunksDir).length;
  const totalChunkSize = fs.readdirSync(chunksDir)
    .map(file => fs.statSync(path.join(chunksDir, file)).size)
    .reduce((total, size) => total + size, 0);

  console.log('\n📊 Summary:');
  console.log(`  Original file: ${(fs.statSync(metadataFile).size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Light metadata: ${(fs.statSync(lightMetadataFile).size / 1024).toFixed(1)}KB`);
  console.log(`  Category index: ${(fs.statSync(categoryIndexFile).size / 1024).toFixed(1)}KB`);
  console.log(`  Popular cache: ${(fs.statSync(popularCacheFile).size / 1024).toFixed(1)}KB`);
  console.log(`  Total chunks: ${totalChunkFiles} files`);
  console.log(`  Total chunk size: ${(totalChunkSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Categories: ${Object.keys(categoryIndex).length}`);

  console.log('\n✅ Emoji metadata splitting completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('  - Update emoji loader to use chunked loading');
  console.log('  - Implement progressive loading in emoji picker');
  console.log('  - Test performance improvements');

} catch (error) {
  console.error('❌ Error splitting emoji metadata:', error);
  process.exit(1);
}