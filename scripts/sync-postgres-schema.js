const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const pgSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

let content = fs.readFileSync(schemaPath, 'utf8');
content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

fs.writeFileSync(pgSchemaPath, content, 'utf8');
console.log('✅ Synchronized prisma/schema.postgresql.prisma with latest schema.prisma');
console.log('New Size:', fs.statSync(pgSchemaPath).size, 'bytes');

