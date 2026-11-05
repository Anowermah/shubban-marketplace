# শুব্বান লাইব্রেরী — cPanel-এ Next.js প্রজেক্ট ডিপ্লয়মেন্ট গাইড
## Shubban Libery Marketplace: Complete cPanel Production Deployment Manual

এই গাইডে আপনার **শুব্বান লাইব্রেরী (Next.js + TypeScript + Prisma)** প্রজেক্টটি cPanel হোস্টিংয়ে সফলভাবে আপলোড ও লাইভ করার সম্পূর্ণ সহজ পদ্ধতি বিস্তারিত বর্ণনা করা হলো।

---

### 📌 মূল পদ্ধতি নির্বাচন (দুইটি কার্যকর উপায়)

cPanel-এ Next.js প্রজেক্ট চালানোর জন্য সবচেয়ে কার্যকর ও জনপ্রিয় উপায় হলো:
1. **পদ্ধতি ১ (সুপারিশকৃত - সবচেয়ে সহজ):** cPanel **"Setup Node.js App"** (CloudLinux / Phusion Passenger) ব্যবহার করে।
2. **পদ্ধতি ২ (VPS / SSH ব্যবহারকারীদের জন্য):** **PM2** প্রসেস ম্যানেজার + Apache **`.htaccess`** Reverse Proxy ব্যবহার করে।

---

## 🚀 পদ্ধতি ১: cPanel "Setup Node.js App" দিয়ে ডিপ্লয়মেন্ট (সহজ ও নিরাপদ)

### ধাপ ১: প্রজেক্ট প্রস্তুত ও বিল্ড (Build on Local PC)
আপনার কম্পিউটারের টার্মিনালে নিচের কমান্ডটি দিয়ে প্রোডাকশন বিল্ড তৈরি করে নিন:
```bash
# ১. প্রিজমা ক্লায়েন্ট তৈরি
npx prisma generate

# ২. নেক্সট.জেএস প্রোডাকশন বিল্ড
npm run build
```

---

### ধাপ ২: প্রয়োজনীয় ফাইল জিপ (Zip) করা
আপনার প্রোজেক্ট ফোল্ডার থেকে ফাইলগুলো জিপ (`shubban-build.zip`) করুন।

**যে ফাইলগুলো অবশ্যই জিপে রাখতে হবে:**
* `.next/` (বিল্ড ফোল্ডার)
* `public/` (ছবি, আইকন ও পিডব্লিউএ ফাইল)
* `prisma/` (`schema.prisma` এবং `dev.db` ডাটাবেজ)
* `src/` (প্রয়োজনীয় কম্পোনেন্ট ও রুটস)
* `package.json` ও `package-lock.json`
* `server.js` (cPanel স্টার্টআপ ফাইল, যা আমরা তৈরি করে দিয়েছি)
* `next.config.mjs`
* `postcss.config.js` ও `tailwind.config.js`
* `tsconfig.json`

> ⚠️ **যেগুলো কখনো জিপে রাখবেন না:**
> * `node_modules` (এটি অনেক ভারী, সার্ভারে গিয়ে `npm install` হবে)
> * `.git` ফোল্ডার

---

### ধাপ ৩: cPanel-এ Node.js App তৈরি করা
১. আপনার **cPanel** ড্যাশবোর্ডে লগইন করুন।
২. **Software** সেকশনে যান এবং **Setup Node.js App**-এ ক্লিক করুন।
৩. উপরে ডানপাশে **Create Application** বাটনে ক্লিক করুন:
   * **Node.js version:** `20.x` বা `18.x` সিলেক্ট করুন (প্রজেক্টে ১৮ বা ২০ সাপোর্ট করে)।
   * **Application mode:** `Production` নির্বাচন করুন।
   * **Application root:** ফোল্ডারের নাম দিন, যেমন: `shubban-app` (এটি `public_html`-এর বাইরে থাকবে, যা সবচেয়ে নিরাপদ)।
   * **Application URL:** আপনার ডোমেন নির্বাচন করুন (যেমন: `atrbd.com` বা সাবডোমেন)।
   * **Application startup file:** `server.js` লিখুন।
৪. **CREATE** বাটনে ক্লিক করুন। অ্যাপ্লিকেশনটি তৈরি হয়ে স্টপ অবস্থায় থাকবে।

---

### ধাপ ৪: ফাইল আপলোড ও এক্সট্র্যাক্ট করা (File Manager)
১. cPanel থেকে **File Manager** খুলুন।
২. আপনার ইউজার রুট ডিরেক্টরিতে যান (যেখানে `public_html` দেখা যায়)। সেখানে `shubban-app` নামের ফোল্ডার দেখতে পাবেন।
৩. `shubban-app` ফোল্ডারের ভেতর ঢুকুন।
৪. **Upload** বাটনে ক্লিক করে আপনার কম্পিউটার থেকে তৈরি করা `shubban-build.zip` ফাইলটি আপলোড করুন।
৫. আপলোড শেষ হলে ফাইলটির উপর রাইট ক্লিক করে **Extract** করে নিন।
৬. সব ফাইল ঠিকমতো `shubban-app`-এর ভেতরে আছে কি না তা যাচাই করুন।

---

### ধাপ ৫: এনভায়রনমেন্ট ভ্যারিয়েবল (.env) সেটআপ
cPanel **Setup Node.js App** পেজে যান এবং আপনার অ্যাপ্লিকেশনের এডিটে গিয়ে **Environment Variables** সেকশনে নিচের ভ্যারিয়েবলগুলো যোগ করুন (অথবা `shubban-app` ফোল্ডারে একটি `.env` ফাইল তৈরি করে এগুলো লিখুন):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="shubban-library-secret-key-328904712895719827591823"
NEXTAUTH_URL="https://atrbd.com"
```
*(আপনার ডোমেন নাম `https://atrbd.com` অনুযায়ী `NEXTAUTH_URL` সেট করুন)*

---

### ধাপ ৬: ডিপেন্ডেন্সি ইনস্টল ও প্রিজমা ক্লায়েন্ট চালু
১. **Setup Node.js App** পেজের উপরে একটি কমান্ড দেখতে পাবেন, যেমন:
   `source /home/username/nodevenv/shubban-app/20/bin/activate && cd /home/username/shubban-app`
   (ক্লিক করে কমান্ডটি কপি করুন)।
২. cPanel-এর **Terminal** খুলুন এবং কপি করা কমান্ডটি পেস্ট করে এন্টার দিন।
৩. এবার নিচের দুটি কমান্ড দিন:
   ```bash
   # প্যাকেজসমূহ ইনস্টল
   npm install --production

   # প্রিজমা ও ডাটাবেস প্রস্তুত
   npx prisma generate
   ```
*(যদি টার্মিনাল এক্সেস না থাকে, তবে Node.js App ইন্টারফেসে **Run NPM Install** বাটনে ক্লিক করতে পারেন)*

---

### ধাপ ৭: অ্যাপ্লিকেশন চালু করা (Restart App)
১. **Setup Node.js App** পেজে যান।
২. উপরে **Restart** বাটনে ক্লিক করুন।
৩. স্ট্যাটাস **Running** দেখাবে।
৪. ব্রাউজারে আপনার ডোমেন (`https://atrbd.com`) ভিজিট করুন! 🎉

---

## 🛠️ পদ্ধতি ২: PM2 ও Apache Reverse Proxy (.htaccess) পদ্ধতি (VPS ব্যবহারকারীদের জন্য)

যদি আপনার হোস্টিংয়ে SSH বা রুট এক্সেস থাকে এবং ব্যাকগ্রাউন্ডে PM2 চালাতে চান:

### ১. সার্ভারে প্রজেক্ট চালিয়ে রাখা (PM2):
SSH টার্মিনালে প্রজেক্ট ফোল্ডারে গিয়ে:
```bash
npm install
npx prisma generate
npm run build
pm2 start server.js --name "shubban"
pm2 save
pm2 startup
```

### ২. `public_html/.htaccess` ফাইলে রিভার্স প্রক্সি কনফিগারেশন:
আপনার `public_html/.htaccess` ফাইলে নিচের কোডটি পেস্ট করুন:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
```
এটি যেকোনো রিকোয়েস্টকে অভ্যন্তরীণ `localhost:3000`-এ ফরোয়ার্ড করবে।

---

## 🔍 সাধারণ সমস্যা ও সমাধান (Troubleshooting)

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| **503 Service Unavailable** | Node.js অ্যাপ্লিকেশন বন্ধ রয়েছে বা ক্র্যাশ করেছে | cPanel Node.js App-এ গিয়ে **Restart** দিন এবং `stderr.log` চেক করুন। |
| **Prisma Client not found** | সার্ভারে প্রিজমা ক্লায়েন্ট জেনারেট হয়নি | টার্মিনালে `npx prisma generate` রান করুন। |
| **Images / CSS লোড হচ্ছে না** | `.next` ফোল্ডার আপলোড হয়নি | লোকাল কম্পিউটারে `npm run build` করে সম্পূর্ণ `.next` ফোল্ডার সার্ভারে আপলোড করুন। |
| **Database Lock Error** | `prisma/dev.db` ফাইলের পারমিশন নেই | `prisma/dev.db` ফাইলের ফাইল পারমিশন `644` বা `664` নিশ্চিত করুন। |
