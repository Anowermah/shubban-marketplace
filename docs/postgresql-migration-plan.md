# শুব্বান লাইব্রেরী — PostgreSQL এবং Prisma ডাটাবেস মাইগ্রেশন পরিকল্পনা
## Shubban Multi-Vendor Marketplace: SQLite to PostgreSQL Migration Architecture & Blueprint

**তারিখ:** ৩০ অক্টোবর ২০২৬  
**লক্ষ্য:** বর্তমান লোকাল ডেভেলপমেন্ট SQLite (`dev.db`) ডাটাবেসকে এন্টারপ্রাইজ-গ্রেড ডিস্ট্রিবিউটেড PostgreSQL-এ রূপান্তর এবং জিরো-ডাউনটাইম ডেটা মাইগ্রেশন সম্পন্ন করা।

---

### ১. কেন PostgreSQL রূপান্তর প্রয়োজন?

1. **উচ্চ সমসাময়িক লেনদেন (High Concurrency & ACID):**
   - SQLite ফাইল-লেভেলে লক ব্যবহার করে, যা একাধিক বিক্রেতা একই সাথে অর্ডার প্রসেস এবং স্টক আপডেট করার সময় `database is locked` কনকারেন্সি বাধা তৈরি করতে পারে।
   - PostgreSQL মাল্টি-ভার্সন কনকারেন্সি কন্ট্রোল (MVCC) সাপোর্ট করে, যার ফলে হাজারো সমসাময়িক রিড ও রাইট অপারেশন নির্বিঘ্নে সম্পন্ন হয়।

2. **আর্থিক লেনদেনে অভ্রান্ত সূক্ষ্মতা (Financial Ledger Decimal Precision):**
   - প্ল্যাটফর্ম কমিশন হিসাব, সাব-অর্ডার কমিশন কর্তন এবং বিক্রেতা পেআউটের ক্ষেত্রে ফ্লোটিং পয়েন্ট ইরোর রোধে PostgreSQL-এর নেটিভ `DECIMAL(12, 2)` আবশ্যক।

3. **নেটিভ এনাম (Native Enums) ও ফিল্টারিং:**
   - অর্ডার স্ট্যাটাস (`PROCESSING`, `SHIPPED`, `DELIVERED`), বিক্রেতা স্ট্যাটাস (`PENDING`, `APPROVED`, `SUSPENDED`) এবং ভূমিকা (`SUPER_ADMIN`, `ADMIN`, `PUBLISHER`) ইত্যাদির জন্য ডাটাবেস-স্তরের টাইপ চেকিং।

4. **ফুল-টেক্সট সার্চ ও ইন্ডেক্সিং (GIN / GIST Indexes):**
   - বইয়ের শিরোনাম, লেখক, প্রকাশনী ও বিষয়ের উপর দ্রুত বাংলা টেক্সট সার্চের জন্য PostgreSQL ট্রাইগ্রাম (`pg_trgm`) ইনডেক্সিং সাপোর্ট।

---

### ২. PostgreSQL স্কিমা রূপান্তর বিশ্লেষণ (SQLite vs PostgreSQL)

| ক্ষেত্র | বর্তমান SQLite স্কিমা | প্রস্তাবিত PostgreSQL স্কিমা |
|---|---|---|
| **Datasource Provider** | `provider = "sqlite"` | `provider = "postgresql"` |
| **Connection URL** | `file:./dev.db` | `postgresql://user:password@host:5432/shubban_db?schema=public&sslmode=require` |
| **আর্থিক ফিল্ডসমূহ** | `Float` | `Decimal @db.Decimal(12, 2)` |
| **ভূমিকা ও স্ট্যাটাস** | `String` (অ্যাপ স্তরে চেক) | নেটিভ `enum Role`, `enum OrderStatus`, `enum VendorStatus` |
| **টেক্সট ও কনটেন্ট** | `String` | `String @db.Text` (প্রবন্ধ, বিস্তারিত সাইনপসিস, এইচটিএমএল বই রিভিউ) |
| **ইন্ডেক্সিং** | প্রাইমারি কি ও ইউনিক স্লাগ | বি-ট্রি (`B-Tree`) + ট্রাইগ্রাম (`GIN`) সার্চ ইন্ডেক্স |

---

### ৩. ধাপভিত্তিক মাইগ্রেশন কর্মপরিকল্পনা (Migration Pipeline)

```
[ বর্তমান SQLite (dev.db) ]
           │
           ▼
[ ১. Prisma PostgreSQL Schema তৈরি (schema.postgresql.prisma) ]
           │
           ▼
[ ২. টার্গেট PostgreSQL ডাটাবেস প্রভিশনিং (Supabase / Neon / AWS RDS) ]
           │
           ▼
[ ৩. মাইগ্রেশন এক্সিকিউশন (npx prisma migrate dev --name init_postgres) ]
           │
           ▼
[ ৪. ডেটা এক্সট্রাক্ট ও ট্রান্সফার (Custom JSON Dump / pgloader) ]
           │
           ▼
[ ৫. ফরেন কি ও সিকোয়েন্স ভেরিফিকেশন ]
           │
           ▼
[ ৬. .env আপডেট ও অ্যাপ্লিকেশন কাট-ওভার (Cutover) ]
```

#### ধাপ ১: PostgreSQL স্কিমা প্রস্তুতকরণ
প্রকল্পের `prisma/schema.postgresql.prisma` ফাইলে নেটিভ এনোটেশন ও ডেসিমেল প্রেসিশন সহ প্রোডাকশন স্কিমা সংরক্ষিত করা হয়েছে।

#### ধাপ ২: ক্লাউড / অন-প্রিমিস PostgreSQL ডাটাবেস কনফিগারেশন
`.env.production` ফাইলে কানেকশন স্ট্রিং প্রস্তুত করুন:
```env
DATABASE_URL="postgresql://shubban_admin:SuperSecurePass2026@db.shubban.internal:5432/shubban_production?schema=public&connection_limit=20&pool_timeout=10"
```

#### ধাপ ৩: স্ট্রাকচারাল মাইগ্রেশন রান করা
```bash
# স্কিমা যাচাই
npx prisma validate --schema=prisma/schema.postgresql.prisma

# প্রোডাকশন মাইগ্রেশন ফাইল জেনারেট
npx prisma migrate dev --name init_marketplace_postgresql --schema=prisma/schema.postgresql.prisma
```

#### ধাপ ৪: স্বয়ংক্রিয় ডেটা এক্সপোর্ট ও ইমপোর্ট পাইপলাইন (ETL Script)
SQLite-এর সকল বিদ্যমান রেকর্ড (বই, লেখক, ক্যাটাগরি, অর্ডার, ইউজার, ভেন্ডর, সদকাহ ক্যাম্পেইন) এক্সপোর্ট করে নতুন PostgreSQL-এ সিড করার স্ক্রিপ্ট:
```javascript
// scripts/migrate-sqlite-to-postgres.js
const { PrismaClient: SqlitePrisma } = require('@prisma/client');
// টার্গেট ক্লায়েন্ট ইনস্ট্যান্স তৈরি করে ব্যাচ ইনসার্ট করা হয়
```

#### ধাপ ৫: রোলব্যাক ও নিরাপত্তা কৌশল (Rollback Strategy)
- মাইগ্রেশনের পূর্বে `dev.db`-এর একটি ব্যাকআপ ফাইল `backup/dev.db.bak` হিসেবে অটো-সেভ হবে।
- নতুন PostgreSQL সংযোগে কোনো ত্রুটি দেখা দিলে পরিবেশের `DATABASE_URL` পরিবর্তন করে এক ক্লিকেই পূর্বের SQLite মডেলে ফিরে যাওয়া সম্ভব।

---

### ৪. ভেরিফিকেশন চেকলিস্ট (Post-Migration Verification)
- [ ] সকল ব্যবহারকারী অ্যাকাউন্টের পাসওয়ার্ড হ্যাশ (`bcryptjs`) অক্ষত থাকা।
- [ ] ভেন্ডরদের সাব-অর্ডার ও লেজার হিস্ট্রি সম্বলিত ব্যালেন্স মিল থাকা।
- [ ] আস-সুন্নাহ সদকাহ ক্যাম্পেইনের মোট উত্তোলিত অনুদানের হিসাব হুবহু মিলে যাওয়া।
- [ ] ডিজিটাল লাইব্রেরির বুকমার্ক এবং রিডিং প্রগ্রেস সংরক্ষিত থাকা।

