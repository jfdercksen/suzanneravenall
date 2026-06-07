const fs = require('fs');
const audit = JSON.parse(fs.readFileSync('c:/Apps/suzanneravenall.com/infra/scripts/migrations/wc-product-audit.json', 'utf8'));

const s = audit.summary;
const lines = [];

lines.push('=== WOOCOMMERCE PRODUCT AUDIT ===');
lines.push('Fetched at: ' + audit.fetched_at);
lines.push('');
lines.push('Total products: ' + s.total_products);
var byType = s.by_type;
lines.push('  simple:   ' + (byType.simple || 0));
lines.push('  variable: ' + (byType.variable || 0) + ' (total ' + s.total_variations + ' variations with published data)');
lines.push('  grouped:  ' + (byType.grouped || 0));
lines.push('  external: ' + (byType.external || 0));
lines.push('');
lines.push('By status:');
var byStatus = s.by_status;
Object.keys(byStatus).sort().forEach(function(k) {
  lines.push('  ' + k + ': ' + byStatus[k]);
});
lines.push('');

// Categories
lines.push('Categories (' + s.total_categories + ' total):');
// Filter to categories with count > 0 to reduce noise
var activeCats = audit.categories.filter(function(c) { return c.count > 0; });
activeCats.sort(function(a, b) { return b.count - a.count; });
activeCats.forEach(function(cat) {
  lines.push('  [' + cat.name + '] (slug: ' + cat.slug + ', ' + cat.count + ' products) -> collection: ' + cat.proposed_medusa_collection);
});
var zeroCats = audit.categories.filter(function(c) { return c.count === 0; });
lines.push('');
lines.push('  Zero-count (legacy/unused) categories: ' + zeroCats.length);
zeroCats.forEach(function(c) {
  lines.push('    - ' + c.name + ' (slug: ' + c.slug + ')');
});
lines.push('');

// Variable products and their variations
lines.push('Variable products and their variations:');
var variableProds = audit.products.filter(function(p) { return p.type === 'variable'; });
variableProds.forEach(function(p) {
  lines.push('  ' + p.name + ' (id: ' + p.id + ', status: ' + p.status + ')');
  if (p.variations && p.variations.length > 0) {
    p.variations.forEach(function(v) {
      var attrs = v.attributes.map(function(a) { return a.option ? (a.name + ': ' + a.option) : a.name; }).join(', ');
      lines.push('    - id:' + v.id + ' price: R' + (v.price || 'n/a') + ' | attrs: [' + attrs + '] | status: ' + v.status);
    });
  } else {
    lines.push('    (no published variations found via API)');
    // Show product-level attributes as indicators
    if (p.attributes && p.attributes.length > 0) {
      p.attributes.forEach(function(a) {
        lines.push('    attribute: ' + a.name + ' -> options: ' + a.options.join(', '));
      });
    }
  }
});
lines.push('');

// Flags
lines.push('Flagged products:');
lines.push('  No price (' + s.flags.no_price.length + '):');
s.flags.no_price.forEach(function(p) {
  lines.push('    - [' + p.status + '] ' + p.name + ' (id: ' + p.id + ')');
});
lines.push('');
lines.push('  No description (' + s.flags.no_description.length + '):');
s.flags.no_description.forEach(function(p) {
  lines.push('    - [' + p.status + '] ' + p.name + ' (id: ' + p.id + ')');
});
lines.push('');
lines.push('  No category (' + s.flags.no_category.length + '): (none)');
lines.push('');
lines.push('  Low-confidence program_type (' + s.flags.low_confidence_program_type.length + '):');
s.flags.low_confidence_program_type.forEach(function(p) {
  lines.push('    - ' + p.name + ' (id: ' + p.id + ', inferred: ' + p.inferredType + ')');
});
lines.push('');

// All slugs
lines.push('All product slugs for 301 redirects (' + audit.all_slugs.length + ' slugs):');
audit.all_slugs.forEach(function(slug) {
  lines.push('  /product/' + slug);
});
lines.push('');

// All tags
lines.push('All product tags (' + audit.all_tags.length + ' unique):');
lines.push('  ' + audit.all_tags.join(', '));
lines.push('');

// Collection mapping
lines.push('Proposed collection mapping:');
lines.push('  WC category -> Medusa collection');
lines.push('');
var proposed = audit.collection_mapping.proposed;
['start-here', 'deep-dive', 'master-level', 'practitioner'].forEach(function(col) {
  var cats = proposed[col] || [];
  lines.push('  [' + col + '] (' + cats.length + ' categories):');
  cats.forEach(function(c) {
    lines.push('    - ' + c.name + ' (' + c.count + ' products)');
  });
  lines.push('');
});

// Program type breakdown
lines.push('Program type inference summary:');
var typeCount = {};
audit.products.forEach(function(p) {
  var key = p.proposed_program_type + ':' + p.program_type_confidence;
  typeCount[key] = (typeCount[key] || 0) + 1;
});
Object.keys(typeCount).sort().forEach(function(k) {
  lines.push('  ' + k + ': ' + typeCount[k]);
});
lines.push('');

lines.push('=== END AUDIT ===');

console.log(lines.join('\n'));
