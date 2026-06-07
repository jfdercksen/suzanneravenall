const fs = require('fs');
const path = require('path');

// ============================================================
// LOAD ALL DATA
// ============================================================
const p1 = JSON.parse(fs.readFileSync('c:/Apps/suzanneravenall.com/infra/scripts/migrations/source/products_page1.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('c:/Apps/suzanneravenall.com/infra/scripts/migrations/source/products_page2.json', 'utf8'));
const p3 = JSON.parse(fs.readFileSync('c:/Apps/suzanneravenall.com/infra/scripts/migrations/source/products_page3.json', 'utf8'));
const allProducts = [...p1, ...p2, ...p3];

const categories = JSON.parse(fs.readFileSync('c:/Apps/suzanneravenall.com/infra/scripts/migrations/source/categories.json', 'utf8'));

const variationsDir = 'c:/Apps/suzanneravenall.com/infra/scripts/migrations/source/variations';
const variationsMap = {};
fs.readdirSync(variationsDir).forEach(file => {
  const id = parseInt(file.replace('.json', ''));
  variationsMap[id] = JSON.parse(fs.readFileSync(path.join(variationsDir, file), 'utf8'));
});

// ============================================================
// CATEGORY -> MEDUSA COLLECTION MAPPING
// 4 target collections: start-here, deep-dive, master-level, practitioner
// ============================================================
function mapCategoryToCollection(cat) {
  const name = (cat.name + ' ' + cat.slug).toLowerCase();

  // Practitioner signals
  if (/practitioner|certification|licensing|licence|certif|mentor/.test(name)) {
    return 'practitioner';
  }
  // Master-level / premium signals
  if (/advanced|master|executive|full.series|full.basic|level.2|level.3|level.4|level.5|rapid.transform|rtt|rapid.repatter/.test(name)) {
    return 'master-level';
  }
  // Deep dive signals - mid-tier structured programmes
  if (/programme|program|course|training|fundamentals|life.enhancing|resonance.repatter|akashic|exploring.alpha|alpha.mind|energy.clearing|energy.ninja|brainwave|group.session|group.family|family.coaching/.test(name)) {
    return 'deep-dive';
  }
  // Private/single sessions
  if (/private.session|session|coaching|clearing|bodytalk|meditation|meditations|products|books|healing.tools|add.on|presentation|speaking/.test(name)) {
    return 'start-here';
  }

  if (cat.count === 0) return 'start-here';
  return 'start-here';
}

// ============================================================
// PROGRAM TYPE INFERENCE
// ============================================================
function inferProgramType(product) {
  const text = [
    product.name,
    product.short_description || '',
    product.categories.map(function(c) { return c.name; }).join(' '),
    (product.tags || []).map(function(t) { return t.name; }).join(' ')
  ].join(' ').toLowerCase();

  // Strong signals -> high confidence
  if (/licen[cs]|certificat|practitioner.programme|practitioner.training/.test(text)) {
    return { type: 'licensing', confidence: 'high' };
  }
  if (/\bcourse\b|programme|training.series|self.study|self.paced|self-paced|self-study/.test(text)) {
    return { type: 'course', confidence: 'high' };
  }
  if (/\bbundle\b|\bpackage\b|purchased.together|collection/.test(text)) {
    return { type: 'bundle', confidence: 'high' };
  }
  if (/\bgroup\b|workshop|retreat|masterclass|community/.test(text)) {
    return { type: 'group', confidence: 'high' };
  }
  if (/session|coaching|consult|call|therapy|clearing|bodytalk|repatterning.*session/.test(text)) {
    return { type: 'session', confidence: 'high' };
  }

  // Medium confidence - from category hierarchy only
  var catNames = product.categories.map(function(c) { return c.name.toLowerCase(); }).join(' ');
  if (/private.session/.test(catNames)) return { type: 'session', confidence: 'medium' };
  if (/guided.programme|programme/.test(catNames)) return { type: 'course', confidence: 'medium' };
  if (/group.session/.test(catNames)) return { type: 'group', confidence: 'medium' };
  if (/meditation/.test(catNames)) return { type: 'session', confidence: 'medium' };

  // Low confidence - price-based fallback
  var price = parseFloat(product.price || product.regular_price || '0');
  if (price >= 5000) return { type: 'licensing', confidence: 'low' };
  if (price >= 2000) return { type: 'course', confidence: 'low' };
  if (price >= 500) return { type: 'session', confidence: 'low' };

  return { type: 'course', confidence: 'low' };
}

// ============================================================
// BUILD CATEGORY-TO-COLLECTION LOOKUP
// ============================================================
var catCollectionMap = {};
categories.forEach(function(cat) {
  catCollectionMap[cat.id] = mapCategoryToCollection(cat);
});

function inferCollectionFromProduct(product) {
  if (!product.categories || product.categories.length === 0) return 'start-here';
  for (var i = 0; i < product.categories.length; i++) {
    var mapped = catCollectionMap[product.categories[i].id];
    if (mapped) return mapped;
  }
  return 'start-here';
}

// ============================================================
// BUILD AUDIT
// ============================================================
var byType = {};
var byStatus = {};
var totalVariations = 0;
var noPrice = [];
var noDescription = [];
var noCategory = [];
var lowConfidenceProgramType = [];
var allSlugs = [];
var allTagsSet = {};

var auditProducts = allProducts.map(function(p) {
  byType[p.type] = (byType[p.type] || 0) + 1;
  byStatus[p.status] = (byStatus[p.status] || 0) + 1;

  var vars = variationsMap[p.id] || [];
  totalVariations += vars.length;

  allSlugs.push(p.slug);

  (p.tags || []).forEach(function(t) { allTagsSet[t.name] = true; });

  var flags = [];
  var price = p.price || p.regular_price || '';
  if (!price || price === '') {
    flags.push('no_price');
    noPrice.push({ id: p.id, name: p.name, status: p.status });
  }

  var descText = ((p.description || '') + (p.short_description || '')).replace(/<[^>]*>/g, '').trim();
  if (!descText) {
    flags.push('no_description');
    noDescription.push({ id: p.id, name: p.name, status: p.status });
  }

  if (!p.categories || p.categories.length === 0) {
    flags.push('no_category');
    noCategory.push({ id: p.id, name: p.name, status: p.status });
  }

  var programTypeResult = inferProgramType(p);
  if (programTypeResult.confidence === 'low') {
    lowConfidenceProgramType.push({ id: p.id, name: p.name, inferredType: programTypeResult.type });
    flags.push('low_confidence_program_type');
  }

  var proposedCollection = inferCollectionFromProduct(p);

  var variationData = vars.map(function(v) {
    return {
      id: v.id,
      sku: v.sku || '',
      price: v.price || '',
      regular_price: v.regular_price || '',
      sale_price: v.sale_price || '',
      status: v.status || '',
      attributes: v.attributes || [],
      stock_status: v.stock_status || '',
    };
  });

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    status: p.status,
    sku: p.sku || '',
    price: price,
    regular_price: p.regular_price || '',
    sale_price: p.sale_price || '',
    description_length: ((p.description || '').replace(/<[^>]*>/g, '').trim().length),
    short_description_length: ((p.short_description || '').replace(/<[^>]*>/g, '').trim().length),
    categories: p.categories.map(function(c) { return { id: c.id, name: c.name, slug: c.slug }; }),
    tags: (p.tags || []).map(function(t) { return t.name; }),
    attributes: (p.attributes || []).map(function(a) { return { name: a.name, options: a.options || [] }; }),
    images: (p.images || []).map(function(i) { return { id: i.id, src: i.src, alt: i.alt || '' }; }),
    variations: variationData,
    proposed_collection: proposedCollection,
    proposed_program_type: programTypeResult.type,
    program_type_confidence: programTypeResult.confidence,
    flags: flags,
  };
});

// ============================================================
// CATEGORY AUDIT
// ============================================================
var auditCategories = categories.map(function(cat) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent,
    count: cat.count,
    proposed_medusa_collection: mapCategoryToCollection(cat),
  };
});

// ============================================================
// COLLECTION MAPPING SUMMARY
// ============================================================
var collectionMappingProposed = { 'start-here': [], 'deep-dive': [], 'master-level': [], 'practitioner': [] };
auditCategories.forEach(function(cat) {
  var col = cat.proposed_medusa_collection;
  if (!collectionMappingProposed[col]) collectionMappingProposed[col] = [];
  collectionMappingProposed[col].push({ id: cat.id, name: cat.name, count: cat.count });
});

var unmappedCategories = auditCategories
  .filter(function(c) { return c.count === 0; })
  .map(function(c) { return { id: c.id, name: c.name, slug: c.slug, reason: 'zero_product_count' }; });

// ============================================================
// FINAL AUDIT JSON
// ============================================================
var audit = {
  fetched_at: new Date().toISOString(),
  summary: {
    total_products: allProducts.length,
    by_type: byType,
    by_status: byStatus,
    total_categories: categories.length,
    total_variations: totalVariations,
    flags: {
      no_price: noPrice,
      no_description: noDescription,
      no_category: noCategory,
      low_confidence_program_type: lowConfidenceProgramType,
    },
  },
  categories: auditCategories,
  products: auditProducts,
  all_slugs: allSlugs.sort(),
  all_tags: Object.keys(allTagsSet).sort(),
  collection_mapping: {
    proposed: collectionMappingProposed,
    unmapped_categories: unmappedCategories,
  },
};

var outPath = 'c:/Apps/suzanneravenall.com/infra/scripts/migrations/wc-product-audit.json';
fs.writeFileSync(outPath, JSON.stringify(audit, null, 2));
console.log('Audit JSON written to: ' + outPath);
console.log('Total products: ' + audit.summary.total_products);
console.log('Total variations: ' + audit.summary.total_variations);
console.log('Total categories: ' + audit.summary.total_categories);
console.log('No price: ' + audit.summary.flags.no_price.length);
console.log('No description: ' + audit.summary.flags.no_description.length);
console.log('No category: ' + audit.summary.flags.no_category.length);
console.log('Low confidence: ' + audit.summary.flags.low_confidence_program_type.length);
