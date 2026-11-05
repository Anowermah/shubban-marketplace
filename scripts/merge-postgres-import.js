const fs = require('fs');
const path = require('path');

console.log('🔄 Merging PostgreSQL schema and data dump...');

const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'postgres-schema.sql'), 'utf8');
const dataSql = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'shubban-postgres-dump.sql'), 'utf8');

let completeSql = `-- ========================================================\n`;
completeSql += `-- SHUBBAN LIBRARY & MARKETPLACE — COMPLETE POSTGRESQL IMPORT\n`;
completeSql += `-- Tables: 97 | Data Rows: 3,788\n`;
completeSql += `-- Database: anowerit_ShubbanLibrary\n`;
completeSql += `-- User: anowerit_shubbanlibary\n`;
completeSql += `-- Date: ${new Date().toISOString()}\n`;
completeSql += `-- ========================================================\n\n`;

completeSql += `-- PART 1: DDL — CREATE ALL TABLES, CONSTRAINTS & INDEXES\n\n`;
completeSql += schemaSql;
completeSql += `\n\n-- PART 2: DML — INSERT ALL DATA\n\n`;
completeSql += dataSql;

const outPath = path.join(__dirname, '..', 'prisma', 'shubban-complete-postgres-import.sql');
fs.writeFileSync(outPath, completeSql, 'utf8');

const stat = fs.statSync(outPath);
console.log(`✅ Complete import SQL file generated: prisma/shubban-complete-postgres-import.sql (${(stat.size / 1024).toFixed(1)} KB)`);

