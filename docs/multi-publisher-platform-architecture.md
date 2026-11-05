# SHUBBAN LIBERY — CENTRALIZED MULTI-PUBLISHER ISLAMIC DIGITAL MAGAZINE & JOURNAL PLATFORM
## Technical Architecture & Developer Reference

---

### 1. Architectural Overview

Shubban Libery's Centralized Multi-Publisher Digital Publishing Platform integrates multi-tenant digital magazine, newspaper, journal, article, essay, and research publishing directly within the existing Shubban Libery Marketplace architecture.

The platform provides:
1. **Central Super Admin Control Center (`/admin/publishing`)**: Platform-wide metrics, publisher governance, frequency-wise publication distribution, and centralized shortcuts.
2. **Multi-Tenant Publisher Management (`/admin/publishing/publishers`)**: Registering organizations, commercial and research publishing houses, verification badges, and organizational members.
3. **Automated Magazine Workspace Generation Engine**: Transactional auto-generator (`initializeMagazineWorkspace` in `src/lib/services/publishingService.ts`) that provisions:
   - Publication Profile (`Magazine`)
   - Independent Schedule (`PublicationSchedule`) supporting Daily, Weekly, Fortnightly, Monthly, Bimonthly, Quarterly, Half-Yearly, Annual, Special Edition, and Irregular frequencies
   - Intellectual Property & Rights (`PublicationRights`)
   - Default Scoped Settings (`MagazineSetting` with 10 default keys)
   - Publication Admin assignment (`PublicationMember` with `PUBLICATION_ADMIN` role)
   - Default Subscriptions (`PublicationSubscriptionPlan`)
   - Immutable Audit Log (`PublicationAuditLog`)
4. **Dedicated Magazine Workspace (`/admin/publishing/workspaces/[id]`)**: Full-featured publication dashboard with tabs for Overview, Issues, Articles, Schedule, Team & Roles, Pricing & Subscriptions, Rights & Licenses, PDF Library, Workspace Settings, and Audit Log.
5. **Fast Workspace Switcher (`WorkspaceSwitcher`)**: Dropdown switch between any publication workspace the user has access to.
6. **Central Copyright & Legal License Monitor (`/admin/publishing/rights`)**: Platform-wide IP governance, takedown management, and copyright attribution enforcement.
7. **Central Subscriptions & Revenue (`/admin/publishing/subscriptions`)**: Unified subscriber management, extension, payment verification, and revenue analytics.
8. **Central Audit History (`/admin/publishing/audit-logs`)**: Immutable audit trail of all workspace events, overrides, and administrative actions.

---

### 2. Dual Database Schema Compatibility

Both `prisma/schema.prisma` (SQLite for local development) and `prisma/schema.postgresql.prisma` (PostgreSQL for production) remain 100% in sync:

```prisma
model PublisherMember {
  id          String    @id @default(cuid())
  publisherId String
  publisher   Publisher @relation(fields: [publisherId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        String    @default("MEMBER") // OWNER, ADMIN, EDITOR, MEMBER
  permissions String?
  createdAt   DateTime  @default(now())

  @@unique([publisherId, userId])
}

model PublicationMember {
  id          String    @id @default(cuid())
  magazineId  String
  magazine    Magazine  @relation(fields: [magazineId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        String    @default("AUTHOR") // PUBLICATION_ADMIN, EDITOR_IN_CHIEF, MANAGING_EDITOR, SECTION_EDITOR, AUTHOR, REVIEWER, PROOFREADER, TRANSLATOR, DESIGNER, CONTRIBUTOR, ANALYST
  permissions String?
  createdAt   DateTime  @default(now())

  @@unique([magazineId, userId])
}

model PublicationSchedule {
  id                     String    @id @default(cuid())
  magazineId             String    @unique
  magazine               Magazine  @relation(fields: [magazineId], references: [id], onDelete: Cascade)
  frequency              String    @default("MONTHLY") // DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, BIMONTHLY, QUARTERLY, HALF_YEARLY, ANNUAL, SPECIAL_EDITION, IRREGULAR, CUSTOM
  expectedDay            Int       @default(1)
  expectedMonth          Int       @default(1)
  nextExpectedDate       DateTime?
  editorialDeadlineDays  Int       @default(5)
  numberingScheme        String    @default("VOL_ISSUE") // VOL_ISSUE, CONTINUOUS_ISSUE, YEAR_MONTH, HIJRI_YEAR
  timeZone               String    @default("Asia/Dhaka")
  autoReminders          Boolean   @default(true)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}

model PublicationRights {
  id                     String            @id @default(cuid())
  magazineId             String?
  magazine               Magazine?         @relation(fields: [magazineId], references: [id], onDelete: Cascade)
  rightsHolder           String
  licenseType            String            @default("ALL_RIGHTS_RESERVED")
  copyrightNotice        String?
  allowPdfHosting        Boolean           @default(true)
  allowArticleDisplay    Boolean           @default(true)
  allowDownloads         Boolean           @default(true)
  attributionRequirement String?
  territory              String            @default("GLOBAL")
  takedownStatus         String            @default("ACTIVE") // ACTIVE, SUSPENDED, TAKEN_DOWN, UNDER_REVIEW
  notes                  String?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt
}

model MagazineSetting {
  id         String   @id @default(cuid())
  magazineId String
  magazine   Magazine @relation(fields: [magazineId], references: [id], onDelete: Cascade)
  key        String
  value      String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([magazineId, key])
}
```

---

### 3. Server-Side Security & Tenant Isolation

Tenant isolation is strictly verified at the service layer:
```typescript
// src/lib/services/publishingService.ts
export async function verifyMagazineAccess(magazineId: string, user: { id: string; role: string }) {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return { authorized: true, isSuperAdmin: true };
  }

  const member = await prisma.publicationMember.findUnique({
    where: {
      magazineId_userId: {
        magazineId,
        userId: user.id,
      },
    },
  });

  if (member) {
    return { authorized: true, isSuperAdmin: false, role: member.role };
  }

  return { authorized: false };
}
```

Every workspace mutation, issue creation, pricing plan modification, and settings update enforces this check before querying or modifying database records.

---

### 4. Admin Navigation Structure

The Admin Panel Sidebar (`src/components/admin/AdminSidebar.tsx`) integrates the publishing suite into a unified expandable section:
- **সেন্ট্রাল কন্ট্রোল সেন্টার** (`/admin/publishing`)
- **প্রকাশক প্রতিষ্ঠান** (`/admin/publishing/publishers`)
- **সকল প্রকাশনা ও সাময়িকী** (`/admin/publishing/magazines`)
- **নতুন প্রকাশনা তৈরি** (`/admin/publishing/magazines/create`)
- **কপিরাইট ও লাইসেন্স** (`/admin/publishing/rights`)
- **সাবস্ক্রিপশন ও রেভিনিউ** (`/admin/publishing/subscriptions`)
- **অডিট ও ইভেন্ট লগ** (`/admin/publishing/audit-logs`)
- **প্রকাশনা ড্যাশবোর্ড** (`/admin/publications`)
- **মাসিক পত্রিকা** (`/admin/magazines`)
- **প্রবন্ধ ও আর্টিকেল** (`/admin/articles`)
- **রচনা ও গবেষণাপত্র** (`/admin/essays`)
- **PDF লাইব্রেরি** (`/admin/publications/files`)
- **লেখক ও সম্পাদক** (`/admin/publications/authors`)
- **ক্যাটাগরি ও ট্যাগ** (`/admin/publications/categories`, `/admin/publications/tags`)
- **পাঠক, ডাউনলোড ও শেয়ার রিপোর্ট** (`/admin/publications/analytics`, `/admin/publications/downloads`, `/admin/publications/shares`)

