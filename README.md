# 🩺 json-doctor

[![CI](https://github.com/YOUR_USERNAME/json-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/json-doctor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![GitHub Achievements](https://img.shields.io/badge/GitHub-Achievements-blueviolet.svg)](https://github.com/YOUR_USERNAME)

> Validates, formats, and repairs broken JSON files — your JSON emergency room.

## ✨ Features

- ✅ Validate JSON with helpful error messages and position hints
- 🎨 Format/prettify with configurable indentation or minify
- 🔧 Auto-repair: trailing commas, single quotes, unquoted keys, comments, undefined values
- 🔍 Diff two JSON files and highlight structural changes
- 📁 Process files or inline JSON strings

## 🚀 Quick Start

```bash
npm install
node src/jsondoctor.js validate data.json
node src/jsondoctor.js repair broken.json --out fixed.json
```

## 📖 Usage

```bash
node src/jsondoctor.js validate <file>
node src/jsondoctor.js format <file> [--indent 4] [--minify] [--out file]
node src/jsondoctor.js repair <file> [--out file]
node src/jsondoctor.js diff <file1> <file2>
```

## 🏆 Achievement Scripts

```bash
bash scripts/setup.sh && bash scripts/unlock-all.sh
```
