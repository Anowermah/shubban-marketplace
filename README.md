# শুব্বান লাইব্রেরী (Shubban Library)
> **“বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা”**  
> *A Production-Ready Multi-Vendor Bengali Marketplace, Digital Library & Islamic Publishing Platform*

---

## ১. প্রকল্পের পরিচিতি (Project Overview)
**শুব্বান লাইব্রেরী** হলো একটি পূর্ণাঙ্গ, আধুনিক, রেসপনসিভ, সুরক্ষিত ও স্কেলেবল মাল্টি-ভেন্ডর ই-কমার্স, ডিজিটাল জ্ঞানপীঠ ও প্রকাশনা প্ল্যাটফর্ম:
- **মাল্টি-ভেন্ডর বুকস্টোর ও মার্কেটপ্লেস:** মুদ্রিত হার্ডকভার ও পেপারব্যাক বই ক্রয়, ভেন্ডর সাব-অর্ডার, সার্ভার-সাইড মূল্য ও স্টক যাচাই, কুপন ডিসকাউন্ট এবং হোম ডেলিভারি ট্র্যাকিং।
- **ডিজিটাল লাইব্রেরী ও ইন-ব্রাউজার PDF রিডার:** কোনো অ্যাপ ডাউনলোড ছাড়াই ব্রাউজারে উচ্চমানের পাঠ, জুম, নাইট/সেপিয়া মোড, ব্যক্তিগত বুকমার্ক ও পড়ার অগ্রগতি সিঙ্ক।
- **ইসলামিক প্রকাশনা ও সাময়িকী আর্কাইভ:** ম্যাগাজিন সংখ্যা, সম্পাদকীয় অনুমোদন পাইপলাইন এবং কপিরাইট-সুরক্ষিত ডিজিটাল ডাউনলোড।
- **স্বচ্ছ দান ও ত্রাণ তহবিল (Donation Management):** ক্যাম্পেইন লক্ষ্য, লাইভ প্রোগ্রেস, তাৎক্ষণিক ট্যাক্স-এক্সেম্পট রশিদ এবং সাধারণ মার্কেটপ্লেস রেভিনিউ থেকে সম্পূর্ণ আলাদা ডাবল-এন্ট্রি চ্যারিটি লেজার।
- **ডুয়াল প্রগ্রেসিভ ওয়েব অ্যাপ (Dual PWA & Web Push Engine):**
  - সাধারণ গ্রাহকদের জন্য মেইন স্টোরফ্রন্ট PWA (`/manifest.webmanifest`, `/sw.js`, `/offline`) গোল্ড ব্র্যান্ড থিম সহ।
  - অ্যাডমিনিস্ট্রেটরদের জন্য আইসোলেটেড অ্যাডমিন PWA (`/admin/manifest.webmanifest`, `/admin-sw.js`, `/admin/offline`) অ্যাম্বার থিম ও সিকিউর লগআউট ক্যাশে পার্জ সহ।
  - VAPID ওয়েব পুশ নোটিফিকেশন সিস্টেম, গ্রাহক প্রেফারেন্স সেন্টার এবং অ্যাডমিন ব্রডকাস্ট কনসোল (`/admin/settings/pwa`)।
- **প্রোডাক্ট অ্যাট্রিবিউট ও কার্টেসিয়ান ভ্যারিয়েন্ট ইঞ্জিন (`/admin/attributes`):** সাইজ, রঙ, বাইন্ডিং, ভলিউম ইত্যাদি ডায়নামিক অ্যাট্রিবিউট তৈরি এবং স্বয়ংক্রিয় কার্টেসিয়ান প্রোডাক্ট কম্বিনেশন থেকে এসকেইউ ও ভ্যারিয়েন্ট জেনারেশন।
- **প্রকাশক ও লেখক ম্যানেজমেন্ট স্যুট (`/admin/publishers`, `/admin/authors`):** প্রোফাইল কমপ্লিশন স্কোর, প্রকাশনা প্রটেকশন গার্ড এবং পাবলিকেশন ও আর্টিকেল রি-অ্যাসাইনমেন্ট সেফটি পাইপলাইন।
- **গ্রাহক রিলেশনশিপ ও মেম্বারশিপ টায়ারিং (`/admin/customers`):** ডায়নামিক কাস্টমার ট্যাগিং, ভিআইপি/প্রিমিয়াম মেম্বারশিপ এবং ফাইন্যান্সিয়াল হিস্ট্রি প্রটেকশন।
- **কুরিয়ার ও ম্যানুয়াল শিপমেন্ট বুকিং (`/admin/orders`):** চেকআউট প্রি-বুকিং গার্ড, অ্যাডমিন অর্ডার কনফার্মেশন, ওজন ও সিওডি ভিত্তিক শিপিং রেট এবং পাবলিক ট্র্যাকিং প্রাইভেসী মাস্কিং।
- **সেলার সেন্টার ও ভেন্ডর পোর্টাল:** স্বাধীন বিক্রেতা অনবোর্ডিং, নিজস্ব পণ্যের ইনভেন্টরি, কমিশন স্টেটমেন্ট, সাপ্তাহিক পেআউট রিকুয়েস্ট ও রিভিউ ম্যানেজমেন্ট।
- **আর্থিক লেজার ও লজিস্টিকস:** ক্যাটাগরি ও সেলার-ভিত্তিক কমিশন হিসাব, রিফান্ড ও রিটার্ন ইন্সপেকশন পাইপলাইন, কুরিয়ার ট্র্যাকিং এবং সিওডি (COD) কালেকশন রিকনসিলিয়েশন।
- **পূর্ণাঙ্গ অ্যাডমিন ড্যাশবোর্ড:** ৩৮টি ডেডিকেটেড ম্যানেজমেন্ট মডিউল, ইনভেন্টরি স্টক অডিট, ১৪টি আরব্যাক (RBAC) রোল প্রশাসন এবং সিস্টেম অডিট ট্রেইল।
- **AI অটোনোমাস কমান্ড সেন্টার (`/admin/ai-assistant`):** ৩-স্তরের নিরাপত্তা এক্সিকিউশন (অটো, প্রিভিউ ও কনফার্মেশন মোড), ২৫+ ডোমেন টুলস, ১-ক্লিক রোলব্যাক ও অডিট হিস্ট্রি।
- **পাবলিক ইসলামিক এআই অ্যাসিস্ট্যান্ট (`/islamic-ai`):** কুরআন, সহীহ হাদিস ও ৪ মাযহাবের প্রামাণ্য নলেজ ইঞ্জিন, ১১৪ সূরার কুরআন সার্চ (`/islamic-ai/quran`), সিহাহ সিত্তাহ হাদিস সার্চ (`/islamic-ai/hadith`), তুলনামূলক ফিকহ গবেষণা (`/islamic-ai/research`), গ্লোবাল ফ্লোটিং চ্যাট লঞ্চার এবং গেস্ট ইউজার কোটা পলিসি।
- **ক্লাউডলিনাক্স ও সিপ্যানেল প্রোডাকশন প্যাকেজিং:** Apache/LiteSpeed ডিরেক্ট স্ট্যাটিক রাউটিং, নোড সার্ভার ফেইল-সেফ স্ট্রিমিং (`server.js`) এবং নোড_মডিউলস-বিহীন অপ্টিমাইজড জিপ প্যাকেজ (`scripts/prepare-cloudlinux-zip.js`)।
- **গ্লোবাল বাংলা টাইপোগ্রাফি:** সাইটের সমস্ত বাংলা টেক্সটের জন্য অপ্টিমাইজড **Bornomala (বর্ণমালা)** ফন্ট স্বয়ংক্রিয়ভাবে সক্রিয়।

---

## ২. প্রযুক্তি ও আর্কিটেকচার (Technology Stack)
- **Frontend & App Router:** Next.js 14 (React 18, TypeScript)
- **Modular Route Groups:**
  - `src/app/(storefront)/`: সাধারণ গ্রাহক ও পাবলিক রাউট (Header, Footer, MobileBottomNav সহ)
  - `src/app/(admin)/admin/`: সম্পূর্ণ আলাদা অ্যাডমিন ম্যানেজমেন্ট কনসোল (আইসোলেটেড ড্যাশবোর্ড লেআউট)
  - `src/app/(seller)/seller/`: সেলার ড্যাশবোর্ড ও ভেন্ডর অ্যাপ্লিকেশন পোর্টাল
  - `src/app/api/`: ৯৭টি সুরক্ষিত REST API এন্ডপয়েন্ট
- **Styling & UI:** Tailwind CSS, Lucide Icons, Bornomala (বর্ণমালা) ফন্ট
- **Database & ORM:** Prisma ORM, SQLite (লোকাল ডেভেলপমেন্ট) এবং PostgreSQL (প্রোডাকশন রেডি)
- **Security & RBAC:** JWT HttpOnly Secure Cookie সেশন, CSRF প্রটেকশন, রেট লিমিটিং, ইনভেন্টরি রেস প্রোটেকশন
- **Payment Architecture:** SSLCOMMERZ, bKash মার্চেন্ট চেকআউট ও ক্যাশ অন ডেলিভারি (COD)

---

## ৩. ডেমো ও পরীক্ষামূলক অ্যাকাউন্টস (Demo Credentials)

| রোল (Role) | ইমেইল (Email) | পাসওয়ার্ড (Password) | সুবিধা ও বৈশিষ্ট্য |
|---|---|---|---|
| **সুপার অ্যাডমিন** | `admin@shubban.com` | `admin123` | পূর্ণ অ্যাডমিন প্যানেল, ইনভেন্টরি, অর্ডার ও রোল কন্ট্রোল |
| **চেকার অ্যাডমিন** | `checker_admin@shubban.com` | `admin123` | পেআউট অনুমোদন, কমিশন অডিট ও রিফান্ড প্রসেসিং |
| **ভেন্ডর / বিক্রেতা** | `seller_a@shubban.com` | `seller123` | সেলার সেন্টার, পণ্য আপলোড, পেআউট রিকুয়েস্ট |
| **সাধারণ ক্রেতা** | `reader@shubban.com` | `reader123` | বই ক্রয়, কার্ট, চেকআউট, অর্ডার ট্র্যাকিং ও উইশলিস্ট |

---

## ৪. ইনস্টলেশন ও রান করার নিয়ম (Installation Guide)

### ধাপ ১: রিপোজিটরি সেটআপ ও ডিপেন্ডেন্সি
```bash
npm install
```

### ধাপ ২: এনভায়রনমেন্ট ভেরিয়েবল
`.env.example` থেকে `.env` ফাইল প্রস্তুত করুন:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="shubban-library-secure-jwt-secret-key-2026"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000
```

### ধাপ ৩: ডেটাবেস স্কিমা সিঙ্ক ও সীডিং
```bash
# স্কিমা সিঙ্ক
npx prisma db push

# ডেমো ডেটা ও পণ্য সীড
npm run db:seed
```

### ধাপ ৪: স্বয়ংক্রিয় ভেরিফিকেশন ও টেস্ট রান
```bash
# ১. মাস্টার টেস্ট রানার (১০টি মূল বিজনেস ও প্রোডাকশন স্যুইট)
node scripts/run-all-tests.js

# ২. ডুয়াল PWA ও পুশ নোটিফিকেশন অডিট
node scripts/test-dual-pwa-qa.js

# ৩. কাস্টমার জার্নি ও জিরো-ট্রাস্ট চেকআউট ভেরিফিকেশন
node scripts/test-customer-journey.js

# ৪. প্রোডাক্ট অ্যাট্রিবিউট ও কার্টেসিয়ান ভ্যারিয়েন্ট স্যুইট
node scripts/test-attribute-variant-system.js

# ৫. প্রকাশক, লেখক ও ক্যাটাগরি ম্যানেজমেন্ট স্যুইট
node scripts/test-publisher-management-enhancements.js
node scripts/test-author-management-enhancements.js
node scripts/test-category-management-enhancements.js

# ৬. অ্যাডমিন প্যানেল ৩৮টি রাউট ও UI/UX অডিট
node scripts/test-admin-complete.js
node scripts/test-admin-panel-ui.js

# ৭. সম্পূর্ণ কোডবেস টাইপচেক ও লিন্টিং
node ./node_modules/typescript/bin/tsc --noEmit
npm run lint

# ৮. সিপ্যানেল / ক্লাউডলিনাক্স প্রোডাকশন জিপ তৈরি
node scripts/prepare-cloudlinux-zip.js
```

### ধাপ ৫: সার্ভার চালু
```bash
# ডেভেলপমেন্ট মোড
npm run dev

# প্রোডাকশন বিল্ড ও রান
npm run build
npm start
```
- পাবলিক স্টোরফ্রন্ট: `http://localhost:3000`
- ইসলামিক এআই নলেজ হাব: `http://localhost:3000/islamic-ai`
- কুরআনুল কারীম অনুসন্ধান: `http://localhost:3000/islamic-ai/quran`
- সিহাহ সিত্তাহ হাদিস সার্চ: `http://localhost:3000/islamic-ai/hadith`
- ৪ মাযহাব ফিকহ গবেষণা: `http://localhost:3000/islamic-ai/research`
- অ্যাডমিন প্যানেল: `http://localhost:3000/admin`
- অ্যাডমিন AI কমান্ড সেন্টার: `http://localhost:3000/admin/ai-assistant`
- অ্যাডমিন ইসলামিক AI গভর্নেন্স: `http://localhost:3000/admin/islamic-ai`
- সেলার সেন্টার: `http://localhost:3000/seller/dashboard`

---

## ৫. সর্বমোট রুট ও পেজ সূচি (Complete Route Inventory - 103 Routes)
- **পাবলিক স্টোরফ্রন্ট ও ইসলামিক এআই:** `/`, `/islamic-ai`, `/islamic-ai/quran`, `/islamic-ai/hadith`, `/islamic-ai/research`, `/books`, `/books/[slug]`, `/digital-library`, `/read/[slug]`, `/magazines`, `/articles`, `/research`, `/presentations`, `/questions`, `/authors`, `/publishers`, `/membership`, `/search`, `/donations`, `/about`, `/contact`, `/faq`
- **ই-কমার্স ও চেকআউট:** `/cart`, `/checkout`, `/order-confirmation`, `/orders/track`
- **গ্রাহক অ্যাকাউন্ট:** `/account`, `/account/orders`, `/account/addresses`, `/account/wishlist`, `/account/reading-history`, `/account/reviews`, `/account/notifications`, `/account/settings`
- **মার্কেটপ্লেস ও সেলার:** `/seller/apply`, `/seller/dashboard`, `/sellers/[slug]`
- **অ্যাডমিন স্যুট (৩৪টি মডিউল):** `/admin`, `/admin/ai-assistant`, `/admin/islamic-ai`, `/admin/orders`, `/admin/products`, `/admin/inventory`, `/admin/sellers`, `/admin/sellers/applications`, `/admin/commissions`, `/admin/payouts`, `/admin/shipping`, `/admin/refunds`, `/admin/donations`, `/admin/articles`, `/admin/publications`, `/admin/coupons`, `/admin/users`, `/admin/roles`, `/admin/audit-logs`, `/admin/settings`
- **পলিসি পেজ:** `/terms`, `/privacy-policy`, `/copyright-policy`, `/refund-policy`, `/shipping-policy`

---
© ২০২৬ শুব্বান লাইব্রেরী (Shubban Library)। সর্বস্বত্ব সংরক্ষিত।
