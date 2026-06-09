#!/usr/bin/env node
/**
 * json-doctor — Validates, formats, and repairs broken JSON files
 * Usage: node src/jsondoctor.js <command> <file|string> [options]
 */

const fs = require('fs');
const path = require('path');

function readInput(input) {
  if (input && fs.existsSync(input)) return fs.readFileSync(input, 'utf8');
  return input || '';
}

function validateCommand(input) {
  const content = readInput(input);
  console.log(`\n🩺 Validating JSON...`);
  try {
    const parsed = JSON.parse(content);
    console.log('✅ Valid JSON');
    const type = Array.isArray(parsed) ? 'array' : typeof parsed;
    if (type === 'object') {
      const keys = Object.keys(parsed);
      console.log(`   Type: object | Keys: ${keys.length} | Top-level: ${keys.slice(0,5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    } else if (type === 'array') {
      console.log(`   Type: array | Items: ${parsed.length}`);
    } else {
      console.log(`   Type: ${type}`);
    }
    return true;
  } catch (e) {
    console.log(`❌ Invalid JSON: ${e.message}`);
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const snippet = content.slice(Math.max(0, pos - 20), pos + 20);
      console.log(`   Near position ${pos}: ...${snippet}...`);
    }
    return false;
  }
}

function formatCommand(input, opts = {}) {
  const content = readInput(input);
  const indent = opts.indent || 2;
  const minify = opts.minify || false;
  
  let parsed;
  try { parsed = JSON.parse(content); } catch(e) {
    console.log(`❌ Cannot format invalid JSON. Try 'repair' first.\n   ${e.message}`);
    process.exit(1);
  }
  
  const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
  
  if (opts.out) {
    fs.writeFileSync(opts.out, output);
    console.log(`✅ Formatted JSON written to: ${opts.out}`);
  } else {
    console.log(output);
  }
}

function repairCommand(input, opts = {}) {
  let content = readInput(input);
  const original = content;
  console.log(`\n🔧 Attempting JSON repair...`);
  const fixes = [];
  
  // Fix 1: Remove trailing commas before } or ]
  const noTrailing = content.replace(/,(\s*[}\]])/g, '$1');
  if (noTrailing !== content) { fixes.push('Removed trailing commas'); content = noTrailing; }
  
  // Fix 2: Replace single quotes with double quotes (basic)
  const noSingleQ = content.replace(/([{,\[]\s*)'([^']+)'\s*:/g, '$1"$2":');
  if (noSingleQ !== content) { fixes.push('Replaced single quotes in keys'); content = noSingleQ; }
  
  // Fix 3: Add missing quotes around unquoted keys
  const quotedKeys = content.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  if (quotedKeys !== content) { fixes.push('Quoted unquoted keys'); content = quotedKeys; }
  
  // Fix 4: Remove comments (// and /* */)
  const noComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (noComments !== content) { fixes.push('Removed comments'); content = noComments; }
  
  // Fix 5: Replace undefined with null
  const noUndefined = content.replace(/:\s*undefined/g, ': null');
  if (noUndefined !== content) { fixes.push('Replaced undefined with null'); content = noUndefined; }
  
  // Fix 6: Remove BOM
  const noBOM = content.replace(/^\uFEFF/, '');
  if (noBOM !== content) { fixes.push('Removed BOM'); content = noBOM; }
  
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch(e) {
    console.log(`❌ Could not repair JSON automatically.`);
    console.log(`   Error: ${e.message}`);
    console.log(`   Partial fixes applied: ${fixes.length ? fixes.join(', ') : 'none'}`);
    process.exit(1);
  }
  
  const output = JSON.stringify(parsed, null, 2);
  
  if (fixes.length === 0) {
    console.log('✅ JSON was already valid — formatted output:');
  } else {
    console.log(`✅ Repaired! Applied ${fixes.length} fix(es):`);
    fixes.forEach(f => console.log(`   ✓ ${f}`));
  }
  
  if (opts.out) {
    fs.writeFileSync(opts.out, output);
    console.log(`   Written to: ${opts.out}`);
  } else {
    console.log('\nRepaired JSON:');
    console.log(output);
  }
}

function diffCommand(fileA, fileB) {
  const a = JSON.parse(readInput(fileA));
  const b = JSON.parse(readInput(fileB));
  
  console.log(`\n🔍 JSON Diff — ${fileA} vs ${fileB}`);
  
  function diffObjects(obj1, obj2, prefix = '') {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    let changes = 0;
    allKeys.forEach(k => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (!(k in obj1)) { console.log(`  + Added: ${key} = ${JSON.stringify(obj2[k])}`); changes++; }
      else if (!(k in obj2)) { console.log(`  - Removed: ${key}`); changes++; }
      else if (JSON.stringify(obj1[k]) !== JSON.stringify(obj2[k])) {
        if (typeof obj1[k] === 'object' && typeof obj2[k] === 'object' && !Array.isArray(obj1[k])) {
          changes += diffObjects(obj1[k], obj2[k], key);
        } else {
          console.log(`  ~ Changed: ${key}\n    Before: ${JSON.stringify(obj1[k])}\n    After:  ${JSON.stringify(obj2[k])}`);
          changes++;
        }
      }
    });
    return changes;
  }
  
  const changes = diffObjects(a, b);
  if (changes === 0) console.log('✅ No differences found.');
  else console.log(`\n  Total changes: ${changes}`);
}

const [,, cmd, arg1, ...rest] = process.argv;
if (!cmd || cmd === 'help') {
  console.log('json-doctor — JSON Validator, Formatter & Repairer\n');
  console.log('Commands:');
  console.log('  validate <file|json>               Check if JSON is valid');
  console.log('  format <file> [--indent N] [--out file] [--minify]  Format JSON');
  console.log('  repair <file> [--out file]         Auto-repair broken JSON');
  console.log('  diff <file1> <file2>               Compare two JSON files');
  process.exit(0);
}

const outIdx = rest.indexOf('--out');
const out = outIdx !== -1 ? rest[outIdx + 1] : null;
const indentIdx = rest.indexOf('--indent');
const indent = indentIdx !== -1 ? parseInt(rest[indentIdx + 1]) : 2;
const minify = rest.includes('--minify');

if (cmd === 'validate') validateCommand(arg1);
else if (cmd === 'format') formatCommand(arg1, { indent, out, minify });
else if (cmd === 'repair') repairCommand(arg1, { out });
else if (cmd === 'diff') diffCommand(arg1, rest[0]);
else { console.error(`Unknown command: ${cmd}`); process.exit(1); }
