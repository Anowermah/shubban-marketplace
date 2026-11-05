// scripts/generate-postgres-migration.js — Generates full PostgreSQL SQL dump and JSON from SQLite
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

console.log('🔄 Exporting SQLite data to PostgreSQL SQL dump...');

// 1. Parse schema to get accurate field types for PostgreSQL
const schemaContent = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
const fieldTypes = {};
let currentModel = null;

schemaContent.split('\n').forEach(line => {
  const mMatch = line.match(/^model\s+(\w+)\s+\{/);
  if (mMatch) {
    currentModel = mMatch[1];
    fieldTypes[currentModel] = {};
    return;
  }
  if (line.match(/^\}/)) {
    currentModel = null;
    return;
  }
  if (currentModel) {
    const fMatch = line.trim().match(/^(\w+)\s+(\w+)(\??)/);
    if (fMatch) {
      fieldTypes[currentModel][fMatch[1]] = fMatch[2];
    }
  }
});

const db = new DatabaseSync('prisma/dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'").all();

const dumpData = {};
let sqlDump = `-- ========================================================\n`;
sqlDump += `-- Shubban Library — Production PostgreSQL Data Migration Dump\n`;
sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
sqlDump += `-- ========================================================\n\n`;
sqlDump += `SET statement_timeout = 0;\n`;
sqlDump += `SET lock_timeout = 0;\n`;
sqlDump += `SET client_encoding = 'UTF8';\n`;
sqlDump += `SET standard_conforming_strings = on;\n\n`;
sqlDump += `-- Disable foreign key constraints during bulk insert\n`;
sqlDump += `SET session_replication_role = 'replica';\n\n`;

function formatPgValue(val, modelName, colName) {
  if (val === null || val === undefined) return 'NULL';

  const expectedType = fieldTypes[modelName] ? fieldTypes[modelName][colName] : null;

  if (expectedType === 'Boolean') {
    if (val === 1 || val === true || val === '1' || val === 'true') return 'TRUE';
    if (val === 0 || val === false || val === '0' || val === 'false') return 'FALSE';
    return 'FALSE';
  }

  if (expectedType === 'DateTime') {
    if (typeof val === 'number') {
      return `'${new Date(val).toISOString()}'`;
    }
    if (typeof val === 'string') {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) {
        return `'${new Date(parsed).toISOString()}'`;
      }
      return `'${val.replace(/'/g, "''")}'`;
    }
    return 'NULL';
  }

  if (expectedType === 'Int' || expectedType === 'Float') {
    return isNaN(Number(val)) ? 'NULL' : String(val);
  }

  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }

  if (typeof val === 'number') {
    return val.toString();
  }

  return `'${String(val).replace(/'/g, "''")}'`;
}

// Priority insertion order to minimize constraint conflicts
const priorityOrder = [
  'SiteSetting', 'User', 'CustomerTag', 'Author', 'Publisher', 'Category', 'Tag',
  'MembershipPlan', 'CourierProvider', 'CourierSetting', 'ShippingZone', 'ShippingMethod',
  'Book', 'Magazine', 'PublicationIssue', 'Article', 'ResearchPaper', 'Presentation',
  'Vendor', 'VendorMember', 'VendorApplication', 'ProductAttributeGroup', 'ProductAttribute',
  'ProductAttributeValue', 'VendorProduct', 'ProductVariant', 'ProductAttributeAssignment',
  'ProductAttributeAssignmentValue', 'Order', 'OrderItem', 'SubOrder', 'SubOrderItem',
  'CommissionRule', 'SellerLedgerEntry', 'SellerPayout', 'DonationCampaign', 'Donation',
  'DonationReceipt', 'InventoryLog', 'PaymentTransaction', 'SupportTicket', 'TicketResponse',
  'Address', 'Refund', 'StockReservation', 'ShippingRate', 'Shipment', 'ShipmentEvent',
  'CourierWebhookLog', 'CodSettlement', 'ReturnRequest', 'ReturnItem', 'ReturnDispute',
  'IslamicResource', 'DonationLedgerEntry', 'HeroSlide', 'HomepageSection', 'NavigationMenuItem',
  'FooterColumn', 'FooterLink', 'CustomPage', 'Review', 'Comment', 'Bookmark', 'ReadingProgress',
  'DigitalEntitlement', 'Subscription', 'Submission', 'Notification', 'Coupon', 'AuditLog',
  'Question', 'Answer', 'Vote', 'AiProviderSetting', 'AiConversation', 'AiMessage',
  'AiTask', 'AiTaskStep', 'AiApproval', 'AiToolExecution', 'AiUsageLog', 'QuranVerse',
  'QuranTranslation', 'TafsirEntry', 'HadithCollection', 'HadithEntry', 'ScholarlyReference',
  'IslamicAiConversation', 'IslamicAiMessage', 'IslamicAiCitation', 'IslamicAiFeedback',
  'PushSubscription', 'PushNotificationPreference', 'PushNotificationLog'
];

// Sort tables according to priorityOrder
const tableNames = tables.map(t => t.name);
const orderedTables = [
  ...priorityOrder.filter(name => tableNames.includes(name)),
  ...tableNames.filter(name => !priorityOrder.includes(name))
];

let totalExportedRows = 0;

for (const tableName of orderedTables) {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  if (rows.length === 0) continue;

  dumpData[tableName] = rows;
  totalExportedRows += rows.length;

  sqlDump += `-- --------------------------------------------------------\n`;
  sqlDump += `-- Table: ${tableName} (${rows.length} rows)\n`;
  sqlDump += `-- --------------------------------------------------------\n`;

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  // Insert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const valueTuples = batch.map(row => {
      const vals = columns.map(c => formatPgValue(row[c], tableName, c));
      return `(${vals.join(', ')})`;
    });

    sqlDump += `INSERT INTO "${tableName}" (${colList}) VALUES\n${valueTuples.join(',\n')}\nON CONFLICT DO NOTHING;\n\n`;
  }
}

sqlDump += `-- Re-enable foreign key constraints\n`;
sqlDump += `SET session_replication_role = 'origin';\n\n`;
sqlDump += `-- Migration dump complete! Total rows: ${totalExportedRows}\n`;

// 1. Write SQL dump
const sqlOutPath = path.join(__dirname, '..', 'prisma', 'shubban-postgres-dump.sql');
fs.writeFileSync(sqlOutPath, sqlDump, 'utf8');
console.log(`✅ Generated SQL Dump: prisma/shubban-postgres-dump.sql (${(fs.statSync(sqlOutPath).size / 1024).toFixed(1)} KB)`);

// 2. Write JSON dump
const jsonOutPath = path.join(__dirname, '..', 'prisma', 'shubban-postgres-dump.json');
fs.writeFileSync(jsonOutPath, JSON.stringify(dumpData, null, 2), 'utf8');
console.log(`✅ Generated JSON Dump: prisma/shubban-postgres-dump.json (${(fs.statSync(jsonOutPath).size / 1024).toFixed(1)} KB)`);

console.log(`\n🎉 Total tables exported: ${Object.keys(dumpData).length}`);
console.log(`🎉 Total rows exported: ${totalExportedRows}`);
