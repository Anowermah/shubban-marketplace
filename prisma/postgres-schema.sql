-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'REGISTERED_MEMBER',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "customerType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "customerTags" TEXT,
    "adminNotes" TEXT,
    "country" TEXT DEFAULT 'Bangladesh',
    "division" TEXT,
    "city" TEXT,
    "area" TEXT,
    "postalCode" TEXT,
    "fullAddress" TEXT,
    "membershipTier" TEXT NOT NULL DEFAULT 'FREE',
    "membershipExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "bioDetails" TEXT,
    "photoUrl" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "expertise" TEXT,
    "workplace" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "awards" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImage" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "publisherType" TEXT DEFAULT 'COMMERCIAL',
    "description" TEXT,
    "descriptionDetails" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "altPhone" TEXT,
    "website" TEXT,
    "country" TEXT DEFAULT 'বাংলাদেশ',
    "division" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "address" TEXT,
    "regNumber" TEXT,
    "binNumber" TEXT,
    "establishedYear" INTEGER,
    "organizationType" TEXT DEFAULT 'LIMITED',
    "mainCategory" TEXT,
    "specialization" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImage" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BOOK',
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "isbn" TEXT,
    "edition" TEXT,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "pages" INTEGER,
    "bindingType" TEXT,
    "description" TEXT NOT NULL,
    "synopsis" TEXT,
    "toc" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discountPrice" DOUBLE PRECISION,
    "stockQuantity" INTEGER NOT NULL DEFAULT 10,
    "isPhysicalAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDigitalAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT NOT NULL,
    "samplePdfUrl" TEXT,
    "fullPdfUrl" TEXT,
    "pdfFileSize" TEXT,
    "authorId" TEXT NOT NULL,
    "publisherId" TEXT,
    "categoryId" TEXT NOT NULL,
    "vendorId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT true,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isEditorsPick" BOOLEAN NOT NULL DEFAULT false,
    "publishedYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Magazine" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "editor" TEXT,
    "editorialMessage" TEXT,
    "month" TEXT,
    "year" INTEGER,
    "volume" TEXT,
    "issueNumber" TEXT,
    "language" TEXT DEFAULT 'bn',
    "tags" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publisherId" TEXT,
    "categoryId" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "themeColor" TEXT DEFAULT '#c59b27',
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "subdomain" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "establishedYear" INTEGER,
    "isSubscribable" BOOLEAN NOT NULL DEFAULT false,
    "singleIssuePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlySubscriptionPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualSubscriptionPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSubscribers" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Magazine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationIssue" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "issueTitle" TEXT NOT NULL,
    "volume" TEXT,
    "issueNumber" TEXT,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "coverImage" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "fileSize" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "toc" TEXT,
    "authorizedPdfUrl" TEXT,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "allowShare" BOOLEAN NOT NULL DEFAULT true,
    "readOnline" BOOLEAN NOT NULL DEFAULT true,
    "requireLogin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "editorNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "coverImage" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ESSAY',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "issueId" TEXT,
    "magazineId" TEXT,
    "editorialStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "footnotes" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readingTime" INTEGER NOT NULL DEFAULT 5,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "arabicContent" TEXT,
    "references" TEXT,
    "relatedBookIds" TEXT,
    "relatedArticleIds" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "articleId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT,
    "deviceType" TEXT DEFAULT 'desktop',
    "browser" TEXT,
    "os" TEXT,
    "pagesRead" TEXT,
    "totalPagesViewed" INTEGER NOT NULL DEFAULT 1,
    "lastPage" INTEGER NOT NULL DEFAULT 1,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "isMeaningfulReader" BOOLEAN NOT NULL DEFAULT false,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationDownload" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "articleId" TEXT,
    "userId" TEXT,
    "ipHash" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "fileSize" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationShare" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "articleId" TEXT,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER NOT NULL DEFAULT 1,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" TEXT,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "storageType" TEXT NOT NULL DEFAULT 'LOCAL',
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "magazineId" TEXT,
    "publisherId" TEXT,
    "checksum" TEXT,
    "uploadedBy" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#c59b27',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagazineSetting" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagazineSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublisherMember" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublisherMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMember" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AUTHOR',
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationSchedule" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "expectedDay" INTEGER,
    "expectedMonth" INTEGER,
    "nextExpectedDate" TIMESTAMP(3),
    "editorialDeadlineDays" INTEGER NOT NULL DEFAULT 7,
    "numberingScheme" TEXT NOT NULL DEFAULT 'VOL_ISSUE',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "autoReminders" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationRights" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT,
    "issueId" TEXT,
    "rightsHolder" TEXT NOT NULL,
    "publisher" TEXT,
    "licenseType" TEXT NOT NULL DEFAULT 'ALL_RIGHTS_RESERVED',
    "copyrightNotice" TEXT,
    "allowPdfHosting" BOOLEAN NOT NULL DEFAULT true,
    "allowArticleDisplay" BOOLEAN NOT NULL DEFAULT true,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT true,
    "attributionRequirement" TEXT,
    "territory" TEXT NOT NULL DEFAULT 'GLOBAL',
    "licenseStartDate" TIMESTAMP(3),
    "licenseEndDate" TIMESTAMP(3),
    "authorizationProofUrl" TEXT,
    "takedownStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationRights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAuditLog" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT,
    "publisherId" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT,
    "publisherId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationMonths" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT true,
    "allowArchiveAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "magazineId" TEXT,
    "publisherId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPaper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "content" TEXT,
    "pdfUrl" TEXT,
    "doi" TEXT,
    "institution" TEXT,
    "field" TEXT,
    "authorId" TEXT NOT NULL,
    "citationText" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "presenter" TEXT NOT NULL,
    "institution" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "slidesCount" INTEGER NOT NULL DEFAULT 20,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT,
    "answerId" TEXT,
    "voteType" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT,
    "articleId" TEXT,
    "page" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER NOT NULL DEFAULT 100,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT,
    "issueId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PURCHASE',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "DigitalEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "orderStatus" TEXT NOT NULL DEFAULT 'PROCESSING',
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "shippingName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "courierName" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "isGiftWrapped" BOOLEAN NOT NULL DEFAULT false,
    "giftMessage" TEXT,
    "giftWrapFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "variantId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "priceYearly" DOUBLE PRECISION NOT NULL,
    "features" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'bkash',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPct" DOUBLE PRECISION,
    "discountAmt" DOUBLE PRECISION,
    "minAmount" DOUBLE PRECISION,
    "maxUsage" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "nidOrTradeLicense" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankRoutingNumber" TEXT,
    "bkashMerchantNumber" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMember" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopSlug" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "tradeLicense" TEXT,
    "nidNumber" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discountPrice" DOUBLE PRECISION,
    "stockQuantity" INTEGER NOT NULL DEFAULT 10,
    "condition" TEXT NOT NULL DEFAULT 'NEW',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "costPrice" DOUBLE PRECISION,
    "wholesalePrice" DOUBLE PRECISION,
    "stockQuantity" INTEGER NOT NULL DEFAULT 10,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "manageStock" BOOLEAN NOT NULL DEFAULT true,
    "stockStatus" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "allowBackorders" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "gallery" TEXT,
    "description" TEXT,
    "weight" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "shippingClass" TEXT,
    "taxClass" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "attributes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SELECT',
    "displayLabel" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVariant" BOOLEAN NOT NULL DEFAULT true,
    "showOnProduct" BOOLEAN NOT NULL DEFAULT true,
    "useInFilter" BOOLEAN NOT NULL DEFAULT true,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "colorHex" TEXT,
    "swatchImage" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeAssignment" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVariant" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeAssignmentValue" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,

    CONSTRAINT "ProductAttributeAssignmentValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrder" (
    "id" TEXT NOT NULL,
    "subOrderNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "commissionAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payoutAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrderItem" (
    "id" TEXT NOT NULL,
    "subOrderId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categorySlug" TEXT,
    "vendorId" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerLedgerEntry" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "subOrderId" TEXT,
    "payoutId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerPayout" (
    "id" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "accountDetails" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "transactionRef" TEXT,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "processedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "SellerPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "story" TEXT,
    "coverImage" TEXT NOT NULL,
    "goalAmount" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "donorCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donationNumber" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "receiptNumber" TEXT NOT NULL,
    "refundStatus" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "campaignTitle" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taxExemptInfo" TEXT DEFAULT 'শুব্বান ওয়েলফেয়ার ট্রাস্ট ও আস-সুন্নাহ সদকাহ ফান্ড স্বীকৃত',

    CONSTRAINT "DonationReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "variantId" TEXT,
    "vendorId" TEXT,
    "changeType" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "donationId" TEXT,
    "gateway" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "transactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "gatewayResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'বাসার ঠিকানা',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'ঢাকা',
    "zone" TEXT NOT NULL DEFAULT 'DHAKA_METRO',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentTransactionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refundTxnId" TEXT,
    "adminNote" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "bookId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "estimatedDays" TEXT NOT NULL,
    "freeDeliveryMin" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "baseCharge" DOUBLE PRECISION NOT NULL,
    "perKgExtra" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "courierPartner" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierProvider" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIG',
    "apiBaseUrl" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "storeId" TEXT,
    "isCodSupported" BOOLEAN NOT NULL DEFAULT true,
    "autoBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultChargeInsideDhaka" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "defaultChargeOutsideDhaka" DOUBLE PRECISION NOT NULL DEFAULT 120.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierSetting" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourierSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT,
    "providerCode" TEXT,
    "name" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL,
    "district" TEXT,
    "upazila" TEXT,
    "baseWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "baseRate" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "perKgExtraRate" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "codChargePct" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "codChargeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "specialDeliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subOrderId" TEXT,
    "providerId" TEXT,
    "settlementId" TEXT,
    "courierCode" TEXT NOT NULL,
    "courierName" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "consignmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PICKUP',
    "shippingAddress" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "codAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codCollected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courierFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRemittance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRemitted" BOOLEAN NOT NULL DEFAULT false,
    "remittedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "labelPrintedAt" TIMESTAMP(3),
    "invoicePrintedAt" TIMESTAMP(3),
    "deliveryTimeline" TEXT,
    "failedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "courierStatus" TEXT,
    "location" TEXT,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierWebhookLog" (
    "id" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "providerId" TEXT,
    "event" TEXT NOT NULL,
    "consignmentId" TEXT,
    "trackingNumber" TEXT,
    "shipmentId" TEXT,
    "payload" TEXT NOT NULL,
    "signature" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "processedStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourierWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodSettlement" (
    "id" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "courierCode" TEXT NOT NULL,
    "totalCodCollected" DOUBLE PRECISION NOT NULL,
    "totalCourierCharges" DOUBLE PRECISION NOT NULL,
    "totalCodFees" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netSettlementAmount" DOUBLE PRECISION NOT NULL,
    "receivedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bankAccount" TEXT,
    "bankTxnReference" TEXT,
    "settledAt" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnShipment" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "courierCode" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "consignmentId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeBorneBy" TEXT NOT NULL DEFAULT 'PLATFORM',
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subOrderId" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "explanation" TEXT,
    "customerImages" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "inspectionNotes" TEXT,
    "inspectionResult" TEXT,
    "restocked" BOOLEAN NOT NULL DEFAULT false,
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "refundTxnId" TEXT,
    "refundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "condition" TEXT,
    "restocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnDispute" (
    "id" TEXT NOT NULL,
    "disputeNumber" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "raisedByRole" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IslamicResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "authorName" TEXT,
    "publisher" TEXT,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IslamicResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationLedgerEntry" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donationId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "referenceNumber" TEXT,
    "description" TEXT NOT NULL,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "badgeIcon" TEXT NOT NULL DEFAULT 'Flame',
    "headline" TEXT NOT NULL,
    "subhead" TEXT NOT NULL,
    "couponCode" TEXT,
    "primaryCtaText" TEXT NOT NULL DEFAULT 'সকল বই দেখুন',
    "primaryCtaLink" TEXT NOT NULL DEFAULT '/books',
    "secondaryCtaText" TEXT,
    "secondaryCtaLink" TEXT,
    "bgGradient" TEXT NOT NULL DEFAULT 'from-shubban-green via-emerald-950 to-shubban-green',
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT,
    "viewAllUrl" TEXT,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationMenuItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "target" TEXT NOT NULL DEFAULT '_self',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isMegaMenu" BOOLEAN NOT NULL DEFAULT false,
    "badgeText" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterColumn" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "columnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "template" TEXT NOT NULL DEFAULT 'STANDARD',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agentKey" TEXT DEFAULT 'general-ai',
    "mode" TEXT DEFAULT 'AUTO',
    "magazineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "agentKey" TEXT,
    "content" TEXT NOT NULL,
    "evidenceStatus" TEXT,
    "citations" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTask" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "command" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "safetyMode" TEXT NOT NULL DEFAULT 'MODE_B',
    "planSummary" TEXT NOT NULL,
    "beforeState" TEXT,
    "afterState" TEXT,
    "diffPreview" TEXT,
    "rollbackData" TEXT,
    "errorDetails" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskStep" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,

    CONSTRAINT "AiTaskStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiApproval" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolExecution" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "inputParams" TEXT NOT NULL,
    "outputData" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiToolExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'INTERNAL_ORCHESTRATOR',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "compTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "actionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderSetting" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKeyEnc" TEXT,
    "modelName" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranVerse" (
    "id" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "surahNameAr" TEXT NOT NULL,
    "surahNameEn" TEXT NOT NULL,
    "surahNameBn" TEXT NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "textAr" TEXT NOT NULL,
    "textNormalized" TEXT NOT NULL,
    "juzNumber" INTEGER NOT NULL DEFAULT 1,
    "revelationType" TEXT NOT NULL DEFAULT 'MECCAN',

    CONSTRAINT "QuranVerse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuranTranslation" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "translator" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,

    CONSTRAINT "QuranTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TafsirEntry" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "volume" INTEGER,
    "page" INTEGER,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'bn',

    CONSTRAINT "TafsirEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithCollection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "compiler" TEXT NOT NULL,
    "totalHadith" INTEGER NOT NULL DEFAULT 7563,
    "isCanonical" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HadithCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HadithEntry" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "hadithNumber" INTEGER NOT NULL,
    "chapterNameBn" TEXT,
    "chapterNameAr" TEXT,
    "chapterNameEn" TEXT,
    "narrator" TEXT,
    "textAr" TEXT NOT NULL,
    "textBn" TEXT NOT NULL,
    "textEn" TEXT,
    "authenticity" TEXT NOT NULL,
    "gradingAuthority" TEXT NOT NULL,
    "topicTag" TEXT NOT NULL,
    "sourceUrl" TEXT,

    CONSTRAINT "HadithEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarlyReference" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "topicEn" TEXT,
    "madhhabViewHanafi" TEXT,
    "madhhabViewMaliki" TEXT,
    "madhhabViewShafii" TEXT,
    "madhhabViewHanbali" TEXT,
    "consensusNotes" TEXT,
    "classicalSources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarlyReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IslamicAiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "mode" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IslamicAiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IslamicAiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "evidenceStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "mode" TEXT NOT NULL DEFAULT 'STANDARD',
    "recommendedBookIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IslamicAiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IslamicAiCitation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "arabicText" TEXT,
    "translation" TEXT NOT NULL,
    "grading" TEXT,
    "sourceBook" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IslamicAiCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IslamicAiFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "isHelpful" BOOLEAN NOT NULL,
    "reportedError" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IslamicAiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "applicationType" TEXT NOT NULL DEFAULT 'MAIN',
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL DEFAULT 'MAIN',
    "notificationCategory" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT,
    "applicationType" TEXT NOT NULL DEFAULT 'MAIN',
    "notificationCategory" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
    "providerResponse" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bot',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "providerId" TEXT,
    "modelName" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "knowledgeScope" TEXT,
    "allowedTools" TEXT,
    "permissions" TEXT,
    "safetyMode" TEXT NOT NULL DEFAULT 'MODE_A',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiEndpoint" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "modelsSupported" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "description" TEXT,
    "tenantScope" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "lastIndexedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAutomationWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "cronExpression" TEXT,
    "eventName" TEXT,
    "agentKey" TEXT NOT NULL DEFAULT 'general-ai',
    "actionType" TEXT NOT NULL,
    "parameters" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAutomationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "headId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "departmentId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "supervisorId" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workResponsibilities" TEXT,
    "emergencyContact" TEXT,
    "professionalBio" TEXT,
    "internalNotes" TEXT,
    "salaryGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffApproval" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "details" TEXT,
    "remarks" TEXT,
    "decisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLeaveRequest" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL DEFAULT 'CASUAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysCount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "decisionRemarks" TEXT,
    "decisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Bangladesh',
    "taxId" TEXT,
    "verificationDocUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserMember" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertiserMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlacement" (
    "id" TEXT NOT NULL,
    "placementKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pageType" TEXT NOT NULL DEFAULT 'HOME',
    "desktopWidth" INTEGER NOT NULL DEFAULT 728,
    "desktopHeight" INTEGER NOT NULL DEFAULT 90,
    "tabletWidth" INTEGER DEFAULT 468,
    "tabletHeight" INTEGER DEFAULT 60,
    "mobileWidth" INTEGER NOT NULL DEFAULT 320,
    "mobileHeight" INTEGER NOT NULL DEFAULT 50,
    "supportedFormats" TEXT NOT NULL DEFAULT '["LEADERBOARD_BANNER","RESPONSIVE_BANNER"]',
    "maxAds" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT DEFAULT 'TOP',
    "rotationRule" TEXT NOT NULL DEFAULT 'WEIGHTED',
    "frequencyCap" INTEGER NOT NULL DEFAULT 5,
    "isLazyLoad" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPricingPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "placementId" TEXT,
    "pricingModel" TEXT NOT NULL DEFAULT 'FIXED_TENURE',
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "includedImpressions" INTEGER,
    "includedClicks" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPricingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'LEADERBOARD_BANNER',
    "mediaUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
    "mediaSize" INTEGER,
    "headline" TEXT,
    "description" TEXT,
    "ctaText" TEXT DEFAULT 'বিস্তারিত দেখুন',
    "destinationUrl" TEXT NOT NULL,
    "altText" TEXT,
    "mobileMediaUrl" TEXT,
    "desktopMediaUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "campaignNumber" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL DEFAULT 'BRAND_AWARENESS',
    "campaignType" TEXT NOT NULL DEFAULT 'BANNER',
    "pricingModel" TEXT NOT NULL DEFAULT 'FIXED_TENURE',
    "pricingPackageId" TEXT,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "agreedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "deliveryPriority" INTEGER NOT NULL DEFAULT 5,
    "frequencyCapPerUser" INTEGER NOT NULL DEFAULT 3,
    "dailyDeliveryLimit" INTEGER,
    "targetingRules" TEXT DEFAULT '{}',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "billingStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaignPlacement" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaignPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaignCreative" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaignCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPayment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "paymentGateway" TEXT NOT NULL DEFAULT 'BKASH',
    "gatewayRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "rawResponse" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdImpressionEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'IMPRESSION',
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "userIpHash" TEXT NOT NULL,
    "deviceClass" TEXT NOT NULL DEFAULT 'DESKTOP',
    "pageUrl" TEXT,
    "anonymousSessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdImpressionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdClickEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "userIpHash" TEXT NOT NULL,
    "anonymousSessionId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "invalidReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDailyMetric" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "campaignId" TEXT,
    "placementId" TEXT,
    "advertiserId" TEXT,
    "requestsCount" INTEGER NOT NULL DEFAULT 0,
    "impressionsCount" INTEGER NOT NULL DEFAULT 0,
    "viewableImpressionsCount" INTEGER NOT NULL DEFAULT 0,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "spendAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "uniqueUsersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdStaffAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "advertiserId" TEXT,
    "campaignId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ACCOUNT_MANAGER',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdStaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPolicySetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPolicySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "color" TEXT DEFAULT '#C49A45',
    "icon" TEXT DEFAULT 'folder',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT 'LOCAL',
    "publicUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediumUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "fileSizeFormatted" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "aspectRatio" TEXT,
    "duration" DOUBLE PRECISION,
    "pageCount" INTEGER,
    "checksum" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isTrash" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" TIMESTAMP(3),
    "folderId" TEXT,
    "uploadedBy" TEXT,
    "publisherId" TEXT,
    "magazineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaReference" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT,
    "field" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT DEFAULT '#C49A45',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssetTag" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MediaAssetTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAuditLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_customerType_idx" ON "User"("customerType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_name_key" ON "CustomerTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_slug_key" ON "CustomerTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_userId_key" ON "Author"("userId");

-- CreateIndex
CREATE INDEX "Author_slug_idx" ON "Author"("slug");

-- CreateIndex
CREATE INDEX "Author_status_idx" ON "Author"("status");

-- CreateIndex
CREATE INDEX "Author_isActive_idx" ON "Author"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_slug_key" ON "Publisher"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_userId_key" ON "Publisher"("userId");

-- CreateIndex
CREATE INDEX "Publisher_slug_idx" ON "Publisher"("slug");

-- CreateIndex
CREATE INDEX "Publisher_status_idx" ON "Publisher"("status");

-- CreateIndex
CREATE INDEX "Publisher_isActive_idx" ON "Publisher"("isActive");

-- CreateIndex
CREATE INDEX "Publisher_isVerified_idx" ON "Publisher"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");

-- CreateIndex
CREATE INDEX "Book_authorId_idx" ON "Book"("authorId");

-- CreateIndex
CREATE INDEX "Book_publisherId_idx" ON "Book"("publisherId");

-- CreateIndex
CREATE INDEX "Book_vendorId_idx" ON "Book"("vendorId");

-- CreateIndex
CREATE INDEX "Book_isFeatured_createdAt_idx" ON "Book"("isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "Book_isNewArrival_createdAt_idx" ON "Book"("isNewArrival", "createdAt");

-- CreateIndex
CREATE INDEX "Book_isBestSeller_createdAt_idx" ON "Book"("isBestSeller", "createdAt");

-- CreateIndex
CREATE INDEX "Book_isFree_isDigitalAvailable_idx" ON "Book"("isFree", "isDigitalAvailable");

-- CreateIndex
CREATE INDEX "Book_price_idx" ON "Book"("price");

-- CreateIndex
CREATE INDEX "Book_stockQuantity_idx" ON "Book"("stockQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "Magazine_slug_key" ON "Magazine"("slug");

-- CreateIndex
CREATE INDEX "Magazine_slug_idx" ON "Magazine"("slug");

-- CreateIndex
CREATE INDEX "Magazine_categoryId_idx" ON "Magazine"("categoryId");

-- CreateIndex
CREATE INDEX "Magazine_status_idx" ON "Magazine"("status");

-- CreateIndex
CREATE INDEX "PublicationIssue_magazineId_idx" ON "PublicationIssue"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationIssue_publicationDate_idx" ON "PublicationIssue"("publicationDate");

-- CreateIndex
CREATE INDEX "PublicationIssue_status_idx" ON "PublicationIssue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_issueId_idx" ON "Article"("issueId");

-- CreateIndex
CREATE INDEX "Article_magazineId_idx" ON "Article"("magazineId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_editorialStatus_idx" ON "Article"("editorialStatus");

-- CreateIndex
CREATE INDEX "Article_type_idx" ON "Article"("type");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "ReadingSession_issueId_idx" ON "ReadingSession"("issueId");

-- CreateIndex
CREATE INDEX "ReadingSession_articleId_idx" ON "ReadingSession"("articleId");

-- CreateIndex
CREATE INDEX "ReadingSession_sessionId_idx" ON "ReadingSession"("sessionId");

-- CreateIndex
CREATE INDEX "ReadingSession_createdAt_idx" ON "ReadingSession"("createdAt");

-- CreateIndex
CREATE INDEX "ReadingSession_isMeaningfulReader_idx" ON "ReadingSession"("isMeaningfulReader");

-- CreateIndex
CREATE INDEX "PublicationDownload_issueId_idx" ON "PublicationDownload"("issueId");

-- CreateIndex
CREATE INDEX "PublicationDownload_articleId_idx" ON "PublicationDownload"("articleId");

-- CreateIndex
CREATE INDEX "PublicationDownload_createdAt_idx" ON "PublicationDownload"("createdAt");

-- CreateIndex
CREATE INDEX "PublicationShare_issueId_idx" ON "PublicationShare"("issueId");

-- CreateIndex
CREATE INDEX "PublicationShare_articleId_idx" ON "PublicationShare"("articleId");

-- CreateIndex
CREATE INDEX "PublicationShare_platform_idx" ON "PublicationShare"("platform");

-- CreateIndex
CREATE INDEX "PublicationShare_createdAt_idx" ON "PublicationShare"("createdAt");

-- CreateIndex
CREATE INDEX "IssueReadingProgress_userId_idx" ON "IssueReadingProgress"("userId");

-- CreateIndex
CREATE INDEX "IssueReadingProgress_issueId_idx" ON "IssueReadingProgress"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueReadingProgress_userId_issueId_key" ON "IssueReadingProgress"("userId", "issueId");

-- CreateIndex
CREATE INDEX "PublicationFile_fileName_idx" ON "PublicationFile"("fileName");

-- CreateIndex
CREATE INDEX "PublicationFile_storageType_idx" ON "PublicationFile"("storageType");

-- CreateIndex
CREATE INDEX "PublicationFile_magazineId_idx" ON "PublicationFile"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationFile_createdAt_idx" ON "PublicationFile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationTag_name_key" ON "PublicationTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationTag_slug_key" ON "PublicationTag"("slug");

-- CreateIndex
CREATE INDEX "PublicationTag_name_idx" ON "PublicationTag"("name");

-- CreateIndex
CREATE INDEX "PublicationTag_slug_idx" ON "PublicationTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationSetting_key_key" ON "PublicationSetting"("key");

-- CreateIndex
CREATE INDEX "MagazineSetting_magazineId_idx" ON "MagazineSetting"("magazineId");

-- CreateIndex
CREATE UNIQUE INDEX "MagazineSetting_magazineId_key_key" ON "MagazineSetting"("magazineId", "key");

-- CreateIndex
CREATE INDEX "PublisherMember_publisherId_idx" ON "PublisherMember"("publisherId");

-- CreateIndex
CREATE INDEX "PublisherMember_userId_idx" ON "PublisherMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublisherMember_publisherId_userId_key" ON "PublisherMember"("publisherId", "userId");

-- CreateIndex
CREATE INDEX "PublicationMember_magazineId_idx" ON "PublicationMember"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationMember_userId_idx" ON "PublicationMember"("userId");

-- CreateIndex
CREATE INDEX "PublicationMember_role_idx" ON "PublicationMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationMember_magazineId_userId_key" ON "PublicationMember"("magazineId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationSchedule_magazineId_key" ON "PublicationSchedule"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationSchedule_frequency_idx" ON "PublicationSchedule"("frequency");

-- CreateIndex
CREATE INDEX "PublicationSchedule_nextExpectedDate_idx" ON "PublicationSchedule"("nextExpectedDate");

-- CreateIndex
CREATE INDEX "PublicationRights_magazineId_idx" ON "PublicationRights"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationRights_issueId_idx" ON "PublicationRights"("issueId");

-- CreateIndex
CREATE INDEX "PublicationRights_takedownStatus_idx" ON "PublicationRights"("takedownStatus");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_magazineId_idx" ON "PublicationAuditLog"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_publisherId_idx" ON "PublicationAuditLog"("publisherId");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_userId_idx" ON "PublicationAuditLog"("userId");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_targetType_idx" ON "PublicationAuditLog"("targetType");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_action_idx" ON "PublicationAuditLog"("action");

-- CreateIndex
CREATE INDEX "PublicationAuditLog_createdAt_idx" ON "PublicationAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationSubscriptionPlan_slug_key" ON "PublicationSubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "PublicationSubscriptionPlan_magazineId_idx" ON "PublicationSubscriptionPlan"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationSubscriptionPlan_isActive_idx" ON "PublicationSubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "PublicationSubscription_userId_idx" ON "PublicationSubscription"("userId");

-- CreateIndex
CREATE INDEX "PublicationSubscription_planId_idx" ON "PublicationSubscription"("planId");

-- CreateIndex
CREATE INDEX "PublicationSubscription_magazineId_idx" ON "PublicationSubscription"("magazineId");

-- CreateIndex
CREATE INDEX "PublicationSubscription_status_idx" ON "PublicationSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchPaper_slug_key" ON "ResearchPaper"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Presentation_slug_key" ON "Presentation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_questionId_answerId_key" ON "Vote"("userId", "questionId", "answerId");

-- CreateIndex
CREATE INDEX "Review_bookId_idx" ON "Review"("bookId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Comment_articleId_idx" ON "Comment"("articleId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_bookId_articleId_page_key" ON "Bookmark"("userId", "bookId", "articleId", "page");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_bookId_key" ON "ReadingProgress"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalEntitlement_userId_bookId_issueId_key" ON "DigitalEntitlement"("userId", "bookId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_bookId_idx" ON "OrderItem"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_code_key" ON "MembershipPlan"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VendorMember_vendorId_userId_key" ON "VendorMember"("vendorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_vendorId_bookId_key" ON "VendorProduct"("vendorId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_bookId_idx" ON "ProductVariant"("bookId");

-- CreateIndex
CREATE INDEX "ProductVariant_status_idx" ON "ProductVariant"("status");

-- CreateIndex
CREATE INDEX "ProductVariant_stockStatus_idx" ON "ProductVariant"("stockStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeGroup_slug_key" ON "ProductAttributeGroup"("slug");

-- CreateIndex
CREATE INDEX "ProductAttributeGroup_status_idx" ON "ProductAttributeGroup"("status");

-- CreateIndex
CREATE INDEX "ProductAttributeGroup_displayOrder_idx" ON "ProductAttributeGroup"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_slug_key" ON "ProductAttribute"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_code_key" ON "ProductAttribute"("code");

-- CreateIndex
CREATE INDEX "ProductAttribute_groupId_idx" ON "ProductAttribute"("groupId");

-- CreateIndex
CREATE INDEX "ProductAttribute_type_idx" ON "ProductAttribute"("type");

-- CreateIndex
CREATE INDEX "ProductAttribute_status_idx" ON "ProductAttribute"("status");

-- CreateIndex
CREATE INDEX "ProductAttribute_displayOrder_idx" ON "ProductAttribute"("displayOrder");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_idx" ON "ProductAttributeValue"("attributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_status_idx" ON "ProductAttributeValue"("status");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_displayOrder_idx" ON "ProductAttributeValue"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValue_attributeId_slug_key" ON "ProductAttributeValue"("attributeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValue_attributeId_name_key" ON "ProductAttributeValue"("attributeId", "name");

-- CreateIndex
CREATE INDEX "ProductAttributeAssignment_bookId_idx" ON "ProductAttributeAssignment"("bookId");

-- CreateIndex
CREATE INDEX "ProductAttributeAssignment_attributeId_idx" ON "ProductAttributeAssignment"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeAssignment_bookId_attributeId_key" ON "ProductAttributeAssignment"("bookId", "attributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeAssignmentValue_assignmentId_idx" ON "ProductAttributeAssignmentValue"("assignmentId");

-- CreateIndex
CREATE INDEX "ProductAttributeAssignmentValue_valueId_idx" ON "ProductAttributeAssignmentValue"("valueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeAssignmentValue_assignmentId_valueId_key" ON "ProductAttributeAssignmentValue"("assignmentId", "valueId");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrder_subOrderNumber_key" ON "SubOrder"("subOrderNumber");

-- CreateIndex
CREATE INDEX "SubOrder_orderId_idx" ON "SubOrder"("orderId");

-- CreateIndex
CREATE INDEX "SubOrder_vendorId_idx" ON "SubOrder"("vendorId");

-- CreateIndex
CREATE INDEX "SubOrder_status_idx" ON "SubOrder"("status");

-- CreateIndex
CREATE INDEX "SubOrder_createdAt_idx" ON "SubOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SubOrderItem_subOrderId_idx" ON "SubOrderItem"("subOrderId");

-- CreateIndex
CREATE INDEX "SubOrderItem_bookId_idx" ON "SubOrderItem"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_categorySlug_key" ON "CommissionRule"("categorySlug");

-- CreateIndex
CREATE INDEX "SellerLedgerEntry_vendorId_idx" ON "SellerLedgerEntry"("vendorId");

-- CreateIndex
CREATE INDEX "SellerLedgerEntry_type_idx" ON "SellerLedgerEntry"("type");

-- CreateIndex
CREATE INDEX "SellerLedgerEntry_createdAt_idx" ON "SellerLedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerPayout_payoutNumber_key" ON "SellerPayout"("payoutNumber");

-- CreateIndex
CREATE INDEX "SellerPayout_vendorId_idx" ON "SellerPayout"("vendorId");

-- CreateIndex
CREATE INDEX "SellerPayout_status_idx" ON "SellerPayout"("status");

-- CreateIndex
CREATE INDEX "SellerPayout_requestedAt_idx" ON "SellerPayout"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationCampaign_slug_key" ON "DonationCampaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_donationNumber_key" ON "Donation"("donationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_receiptNumber_key" ON "Donation"("receiptNumber");

-- CreateIndex
CREATE INDEX "Donation_campaignId_idx" ON "Donation"("campaignId");

-- CreateIndex
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");

-- CreateIndex
CREATE INDEX "Donation_paymentStatus_idx" ON "Donation"("paymentStatus");

-- CreateIndex
CREATE INDEX "Donation_createdAt_idx" ON "Donation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_receiptNumber_key" ON "DonationReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_donationId_key" ON "DonationReceipt"("donationId");

-- CreateIndex
CREATE INDEX "InventoryLog_bookId_idx" ON "InventoryLog"("bookId");

-- CreateIndex
CREATE INDEX "InventoryLog_createdAt_idx" ON "InventoryLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionId_key" ON "PaymentTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_donationId_idx" ON "PaymentTransaction"("donationId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundTxnId_key" ON "Refund"("refundTxnId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "StockReservation_bookId_idx" ON "StockReservation"("bookId");

-- CreateIndex
CREATE INDEX "StockReservation_orderId_idx" ON "StockReservation"("orderId");

-- CreateIndex
CREATE INDEX "StockReservation_status_idx" ON "StockReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_code_key" ON "ShippingZone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourierProvider_code_key" ON "CourierProvider"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourierSetting_providerId_key_key" ON "CourierSetting"("providerId", "key");

-- CreateIndex
CREATE INDEX "ShippingRate_destinationType_idx" ON "ShippingRate"("destinationType");

-- CreateIndex
CREATE INDEX "ShippingRate_district_idx" ON "ShippingRate"("district");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_consignmentId_idx" ON "Shipment"("consignmentId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "CourierWebhookLog_providerCode_event_idx" ON "CourierWebhookLog"("providerCode", "event");

-- CreateIndex
CREATE INDEX "CourierWebhookLog_consignmentId_idx" ON "CourierWebhookLog"("consignmentId");

-- CreateIndex
CREATE INDEX "CourierWebhookLog_trackingNumber_idx" ON "CourierWebhookLog"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CodSettlement_settlementNumber_key" ON "CodSettlement"("settlementNumber");

-- CreateIndex
CREATE INDEX "CodSettlement_courierCode_idx" ON "CodSettlement"("courierCode");

-- CreateIndex
CREATE INDEX "CodSettlement_status_idx" ON "CodSettlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnShipment_returnRequestId_key" ON "ReturnShipment"("returnRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_returnNumber_key" ON "ReturnRequest"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnDispute_disputeNumber_key" ON "ReturnDispute"("disputeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IslamicResource_slug_key" ON "IslamicResource"("slug");

-- CreateIndex
CREATE INDEX "IslamicResource_topic_idx" ON "IslamicResource"("topic");

-- CreateIndex
CREATE INDEX "IslamicResource_category_idx" ON "IslamicResource"("category");

-- CreateIndex
CREATE INDEX "IslamicResource_isFeatured_idx" ON "IslamicResource"("isFeatured");

-- CreateIndex
CREATE INDEX "IslamicResource_createdAt_idx" ON "IslamicResource"("createdAt");

-- CreateIndex
CREATE INDEX "DonationLedgerEntry_campaignId_idx" ON "DonationLedgerEntry"("campaignId");

-- CreateIndex
CREATE INDEX "DonationLedgerEntry_type_idx" ON "DonationLedgerEntry"("type");

-- CreateIndex
CREATE INDEX "DonationLedgerEntry_createdAt_idx" ON "DonationLedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "HeroSlide_isPublished_displayOrder_idx" ON "HeroSlide"("isPublished", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_sectionKey_key" ON "HomepageSection"("sectionKey");

-- CreateIndex
CREATE INDEX "HomepageSection_isEnabled_displayOrder_idx" ON "HomepageSection"("isEnabled", "displayOrder");

-- CreateIndex
CREATE INDEX "NavigationMenuItem_isEnabled_displayOrder_idx" ON "NavigationMenuItem"("isEnabled", "displayOrder");

-- CreateIndex
CREATE INDEX "FooterLink_columnId_displayOrder_idx" ON "FooterLink"("columnId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug");

-- CreateIndex
CREATE INDEX "CustomPage_slug_isPublished_idx" ON "CustomPage"("slug", "isPublished");

-- CreateIndex
CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AiConversation_agentKey_idx" ON "AiConversation"("agentKey");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiTask_messageId_key" ON "AiTask"("messageId");

-- CreateIndex
CREATE INDEX "AiTask_status_safetyMode_idx" ON "AiTask"("status", "safetyMode");

-- CreateIndex
CREATE INDEX "AiTaskStep_taskId_stepOrder_idx" ON "AiTaskStep"("taskId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AiApproval_taskId_key" ON "AiApproval"("taskId");

-- CreateIndex
CREATE INDEX "AiToolExecution_toolName_createdAt_idx" ON "AiToolExecution"("toolName", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderSetting_providerKey_key" ON "AiProviderSetting"("providerKey");

-- CreateIndex
CREATE INDEX "QuranVerse_surahNumber_idx" ON "QuranVerse"("surahNumber");

-- CreateIndex
CREATE INDEX "QuranVerse_textNormalized_idx" ON "QuranVerse"("textNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "QuranVerse_surahNumber_ayahNumber_key" ON "QuranVerse"("surahNumber", "ayahNumber");

-- CreateIndex
CREATE INDEX "QuranTranslation_verseId_language_idx" ON "QuranTranslation"("verseId", "language");

-- CreateIndex
CREATE INDEX "TafsirEntry_verseId_sourceName_idx" ON "TafsirEntry"("verseId", "sourceName");

-- CreateIndex
CREATE UNIQUE INDEX "HadithCollection_slug_key" ON "HadithCollection"("slug");

-- CreateIndex
CREATE INDEX "HadithEntry_collectionId_hadithNumber_idx" ON "HadithEntry"("collectionId", "hadithNumber");

-- CreateIndex
CREATE INDEX "HadithEntry_topicTag_idx" ON "HadithEntry"("topicTag");

-- CreateIndex
CREATE INDEX "HadithEntry_authenticity_idx" ON "HadithEntry"("authenticity");

-- CreateIndex
CREATE INDEX "ScholarlyReference_topic_idx" ON "ScholarlyReference"("topic");

-- CreateIndex
CREATE INDEX "IslamicAiConversation_userId_updatedAt_idx" ON "IslamicAiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "IslamicAiConversation_sessionId_idx" ON "IslamicAiConversation"("sessionId");

-- CreateIndex
CREATE INDEX "IslamicAiMessage_conversationId_createdAt_idx" ON "IslamicAiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "IslamicAiCitation_messageId_idx" ON "IslamicAiCitation"("messageId");

-- CreateIndex
CREATE INDEX "IslamicAiFeedback_messageId_idx" ON "IslamicAiFeedback"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_applicationType_idx" ON "PushSubscription"("applicationType");

-- CreateIndex
CREATE INDEX "PushSubscription_subscriptionStatus_idx" ON "PushSubscription"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "PushNotificationPreference_userId_idx" ON "PushNotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationPreference_userId_applicationType_notificat_key" ON "PushNotificationPreference"("userId", "applicationType", "notificationCategory");

-- CreateIndex
CREATE INDEX "PushNotificationLog_applicationType_idx" ON "PushNotificationLog"("applicationType");

-- CreateIndex
CREATE INDEX "PushNotificationLog_deliveryStatus_idx" ON "PushNotificationLog"("deliveryStatus");

-- CreateIndex
CREATE INDEX "PushNotificationLog_createdAt_idx" ON "PushNotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "PushNotificationLog_recipientId_idx" ON "PushNotificationLog"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_key_key" ON "AiAgent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderConfig_providerKey_key" ON "AiProviderConfig"("providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_status_idx" ON "Department"("status");

-- CreateIndex
CREATE INDEX "Designation_departmentId_idx" ON "Designation"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_employeeId_key" ON "StaffProfile"("employeeId");

-- CreateIndex
CREATE INDEX "StaffProfile_departmentId_idx" ON "StaffProfile"("departmentId");

-- CreateIndex
CREATE INDEX "StaffProfile_designationId_idx" ON "StaffProfile"("designationId");

-- CreateIndex
CREATE INDEX "StaffProfile_employmentStatus_idx" ON "StaffProfile"("employmentStatus");

-- CreateIndex
CREATE INDEX "StaffProfile_employeeId_idx" ON "StaffProfile"("employeeId");

-- CreateIndex
CREATE INDEX "StaffTask_departmentId_idx" ON "StaffTask"("departmentId");

-- CreateIndex
CREATE INDEX "StaffTask_creatorId_idx" ON "StaffTask"("creatorId");

-- CreateIndex
CREATE INDEX "StaffTask_assigneeId_idx" ON "StaffTask"("assigneeId");

-- CreateIndex
CREATE INDEX "StaffTask_status_idx" ON "StaffTask"("status");

-- CreateIndex
CREATE INDEX "StaffTask_priority_idx" ON "StaffTask"("priority");

-- CreateIndex
CREATE INDEX "StaffTaskComment_taskId_idx" ON "StaffTaskComment"("taskId");

-- CreateIndex
CREATE INDEX "StaffTaskComment_authorId_idx" ON "StaffTaskComment"("authorId");

-- CreateIndex
CREATE INDEX "StaffApproval_status_idx" ON "StaffApproval"("status");

-- CreateIndex
CREATE INDEX "StaffApproval_type_idx" ON "StaffApproval"("type");

-- CreateIndex
CREATE INDEX "StaffApproval_requestedById_idx" ON "StaffApproval"("requestedById");

-- CreateIndex
CREATE INDEX "StaffApproval_reviewerId_idx" ON "StaffApproval"("reviewerId");

-- CreateIndex
CREATE INDEX "StaffAttendance_staffProfileId_idx" ON "StaffAttendance"("staffProfileId");

-- CreateIndex
CREATE INDEX "StaffAttendance_date_idx" ON "StaffAttendance"("date");

-- CreateIndex
CREATE INDEX "StaffAttendance_status_idx" ON "StaffAttendance"("status");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_staffProfileId_idx" ON "StaffLeaveRequest"("staffProfileId");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_status_idx" ON "StaffLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_leaveType_idx" ON "StaffLeaveRequest"("leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_slug_key" ON "Advertiser"("slug");

-- CreateIndex
CREATE INDEX "Advertiser_status_idx" ON "Advertiser"("status");

-- CreateIndex
CREATE INDEX "Advertiser_ownerId_idx" ON "Advertiser"("ownerId");

-- CreateIndex
CREATE INDEX "Advertiser_email_idx" ON "Advertiser"("email");

-- CreateIndex
CREATE INDEX "AdvertiserMember_advertiserId_idx" ON "AdvertiserMember"("advertiserId");

-- CreateIndex
CREATE INDEX "AdvertiserMember_userId_idx" ON "AdvertiserMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserMember_advertiserId_userId_key" ON "AdvertiserMember"("advertiserId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlacement_placementKey_key" ON "AdPlacement"("placementKey");

-- CreateIndex
CREATE INDEX "AdPlacement_pageType_idx" ON "AdPlacement"("pageType");

-- CreateIndex
CREATE INDEX "AdPlacement_status_idx" ON "AdPlacement"("status");

-- CreateIndex
CREATE INDEX "AdPlacement_position_idx" ON "AdPlacement"("position");

-- CreateIndex
CREATE INDEX "AdPricingPackage_placementId_idx" ON "AdPricingPackage"("placementId");

-- CreateIndex
CREATE INDEX "AdPricingPackage_pricingModel_idx" ON "AdPricingPackage"("pricingModel");

-- CreateIndex
CREATE INDEX "AdPricingPackage_status_idx" ON "AdPricingPackage"("status");

-- CreateIndex
CREATE INDEX "AdCreative_advertiserId_idx" ON "AdCreative"("advertiserId");

-- CreateIndex
CREATE INDEX "AdCreative_format_idx" ON "AdCreative"("format");

-- CreateIndex
CREATE INDEX "AdCreative_approvalStatus_idx" ON "AdCreative"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaign_campaignNumber_key" ON "AdCampaign"("campaignNumber");

-- CreateIndex
CREATE INDEX "AdCampaign_advertiserId_idx" ON "AdCampaign"("advertiserId");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_approvalStatus_idx" ON "AdCampaign"("approvalStatus");

-- CreateIndex
CREATE INDEX "AdCampaign_billingStatus_idx" ON "AdCampaign"("billingStatus");

-- CreateIndex
CREATE INDEX "AdCampaign_startDate_endDate_idx" ON "AdCampaign"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AdCampaign_deliveryPriority_idx" ON "AdCampaign"("deliveryPriority");

-- CreateIndex
CREATE INDEX "AdCampaignPlacement_campaignId_idx" ON "AdCampaignPlacement"("campaignId");

-- CreateIndex
CREATE INDEX "AdCampaignPlacement_placementId_idx" ON "AdCampaignPlacement"("placementId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaignPlacement_campaignId_placementId_key" ON "AdCampaignPlacement"("campaignId", "placementId");

-- CreateIndex
CREATE INDEX "AdCampaignCreative_campaignId_idx" ON "AdCampaignCreative"("campaignId");

-- CreateIndex
CREATE INDEX "AdCampaignCreative_creativeId_idx" ON "AdCampaignCreative"("creativeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaignCreative_campaignId_creativeId_key" ON "AdCampaignCreative"("campaignId", "creativeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdInvoice_invoiceNumber_key" ON "AdInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "AdInvoice_advertiserId_idx" ON "AdInvoice"("advertiserId");

-- CreateIndex
CREATE INDEX "AdInvoice_campaignId_idx" ON "AdInvoice"("campaignId");

-- CreateIndex
CREATE INDEX "AdInvoice_status_idx" ON "AdInvoice"("status");

-- CreateIndex
CREATE INDEX "AdInvoice_invoiceNumber_idx" ON "AdInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdPayment_transactionId_key" ON "AdPayment"("transactionId");

-- CreateIndex
CREATE INDEX "AdPayment_advertiserId_idx" ON "AdPayment"("advertiserId");

-- CreateIndex
CREATE INDEX "AdPayment_campaignId_idx" ON "AdPayment"("campaignId");

-- CreateIndex
CREATE INDEX "AdPayment_invoiceId_idx" ON "AdPayment"("invoiceId");

-- CreateIndex
CREATE INDEX "AdPayment_status_idx" ON "AdPayment"("status");

-- CreateIndex
CREATE INDEX "AdPayment_transactionId_idx" ON "AdPayment"("transactionId");

-- CreateIndex
CREATE INDEX "AdRefund_paymentId_idx" ON "AdRefund"("paymentId");

-- CreateIndex
CREATE INDEX "AdRefund_advertiserId_idx" ON "AdRefund"("advertiserId");

-- CreateIndex
CREATE INDEX "AdRefund_status_idx" ON "AdRefund"("status");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_campaignId_idx" ON "AdImpressionEvent"("campaignId");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_placementId_idx" ON "AdImpressionEvent"("placementId");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_creativeId_idx" ON "AdImpressionEvent"("creativeId");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_advertiserId_idx" ON "AdImpressionEvent"("advertiserId");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_timestamp_idx" ON "AdImpressionEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AdImpressionEvent_eventType_idx" ON "AdImpressionEvent"("eventType");

-- CreateIndex
CREATE INDEX "AdClickEvent_campaignId_idx" ON "AdClickEvent"("campaignId");

-- CreateIndex
CREATE INDEX "AdClickEvent_placementId_idx" ON "AdClickEvent"("placementId");

-- CreateIndex
CREATE INDEX "AdClickEvent_creativeId_idx" ON "AdClickEvent"("creativeId");

-- CreateIndex
CREATE INDEX "AdClickEvent_advertiserId_idx" ON "AdClickEvent"("advertiserId");

-- CreateIndex
CREATE INDEX "AdClickEvent_timestamp_idx" ON "AdClickEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AdClickEvent_isValid_idx" ON "AdClickEvent"("isValid");

-- CreateIndex
CREATE INDEX "AdDailyMetric_date_idx" ON "AdDailyMetric"("date");

-- CreateIndex
CREATE INDEX "AdDailyMetric_campaignId_idx" ON "AdDailyMetric"("campaignId");

-- CreateIndex
CREATE INDEX "AdDailyMetric_placementId_idx" ON "AdDailyMetric"("placementId");

-- CreateIndex
CREATE INDEX "AdDailyMetric_advertiserId_idx" ON "AdDailyMetric"("advertiserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdDailyMetric_date_campaignId_placementId_key" ON "AdDailyMetric"("date", "campaignId", "placementId");

-- CreateIndex
CREATE INDEX "AdStaffAssignment_staffId_idx" ON "AdStaffAssignment"("staffId");

-- CreateIndex
CREATE INDEX "AdStaffAssignment_advertiserId_idx" ON "AdStaffAssignment"("advertiserId");

-- CreateIndex
CREATE INDEX "AdStaffAssignment_campaignId_idx" ON "AdStaffAssignment"("campaignId");

-- CreateIndex
CREATE INDEX "AdAuditLog_actorId_idx" ON "AdAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AdAuditLog_action_idx" ON "AdAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdAuditLog_entityType_idx" ON "AdAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AdAuditLog_createdAt_idx" ON "AdAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdPolicySetting_key_key" ON "AdPolicySetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_slug_key" ON "MediaFolder"("slug");

-- CreateIndex
CREATE INDEX "MediaFolder_parentId_idx" ON "MediaFolder"("parentId");

-- CreateIndex
CREATE INDEX "MediaFolder_slug_idx" ON "MediaFolder"("slug");

-- CreateIndex
CREATE INDEX "MediaFolder_createdAt_idx" ON "MediaFolder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_mediaType_idx" ON "MediaAsset"("mediaType");

-- CreateIndex
CREATE INDEX "MediaAsset_visibility_idx" ON "MediaAsset"("visibility");

-- CreateIndex
CREATE INDEX "MediaAsset_isTrash_idx" ON "MediaAsset"("isTrash");

-- CreateIndex
CREATE INDEX "MediaAsset_folderId_idx" ON "MediaAsset"("folderId");

-- CreateIndex
CREATE INDEX "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- CreateIndex
CREATE INDEX "MediaVariant_assetId_idx" ON "MediaVariant"("assetId");

-- CreateIndex
CREATE INDEX "MediaVariant_variantName_idx" ON "MediaVariant"("variantName");

-- CreateIndex
CREATE INDEX "MediaReference_assetId_idx" ON "MediaReference"("assetId");

-- CreateIndex
CREATE INDEX "MediaReference_module_entityId_idx" ON "MediaReference"("module", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaReference_assetId_module_entityId_field_key" ON "MediaReference"("assetId", "module", "entityId", "field");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTag_name_key" ON "MediaTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTag_slug_key" ON "MediaTag"("slug");

-- CreateIndex
CREATE INDEX "MediaTag_name_idx" ON "MediaTag"("name");

-- CreateIndex
CREATE INDEX "MediaTag_slug_idx" ON "MediaTag"("slug");

-- CreateIndex
CREATE INDEX "MediaAssetTag_assetId_idx" ON "MediaAssetTag"("assetId");

-- CreateIndex
CREATE INDEX "MediaAssetTag_tagId_idx" ON "MediaAssetTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAssetTag_assetId_tagId_key" ON "MediaAssetTag"("assetId", "tagId");

-- CreateIndex
CREATE INDEX "MediaAuditLog_assetId_idx" ON "MediaAuditLog"("assetId");

-- CreateIndex
CREATE INDEX "MediaAuditLog_action_idx" ON "MediaAuditLog"("action");

-- CreateIndex
CREATE INDEX "MediaAuditLog_createdAt_idx" ON "MediaAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publisher" ADD CONSTRAINT "Publisher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Magazine" ADD CONSTRAINT "Magazine_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Magazine" ADD CONSTRAINT "Magazine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationIssue" ADD CONSTRAINT "PublicationIssue_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDownload" ADD CONSTRAINT "PublicationDownload_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDownload" ADD CONSTRAINT "PublicationDownload_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDownload" ADD CONSTRAINT "PublicationDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationShare" ADD CONSTRAINT "PublicationShare_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationShare" ADD CONSTRAINT "PublicationShare_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationShare" ADD CONSTRAINT "PublicationShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReadingProgress" ADD CONSTRAINT "IssueReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReadingProgress" ADD CONSTRAINT "IssueReadingProgress_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagazineSetting" ADD CONSTRAINT "MagazineSetting_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublisherMember" ADD CONSTRAINT "PublisherMember_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublisherMember" ADD CONSTRAINT "PublisherMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMember" ADD CONSTRAINT "PublicationMember_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMember" ADD CONSTRAINT "PublicationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationSchedule" ADD CONSTRAINT "PublicationSchedule_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationRights" ADD CONSTRAINT "PublicationRights_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationRights" ADD CONSTRAINT "PublicationRights_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuditLog" ADD CONSTRAINT "PublicationAuditLog_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuditLog" ADD CONSTRAINT "PublicationAuditLog_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuditLog" ADD CONSTRAINT "PublicationAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationSubscriptionPlan" ADD CONSTRAINT "PublicationSubscriptionPlan_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationSubscription" ADD CONSTRAINT "PublicationSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationSubscription" ADD CONSTRAINT "PublicationSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PublicationSubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationSubscription" ADD CONSTRAINT "PublicationSubscription_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchPaper" ADD CONSTRAINT "ResearchPaper_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "PublicationIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMember" ADD CONSTRAINT "VendorMember_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMember" ADD CONSTRAINT "VendorMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductAttributeGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeAssignment" ADD CONSTRAINT "ProductAttributeAssignment_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeAssignment" ADD CONSTRAINT "ProductAttributeAssignment_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeAssignmentValue" ADD CONSTRAINT "ProductAttributeAssignmentValue_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProductAttributeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeAssignmentValue" ADD CONSTRAINT "ProductAttributeAssignmentValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrderItem" ADD CONSTRAINT "SubOrderItem_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerLedgerEntry" ADD CONSTRAINT "SellerLedgerEntry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationReceipt" ADD CONSTRAINT "DonationReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingMethod" ADD CONSTRAINT "ShippingMethod_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierSetting" ADD CONSTRAINT "CourierSetting_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CourierProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CourierProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CodSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierWebhookLog" ADD CONSTRAINT "CourierWebhookLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CourierProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierWebhookLog" ADD CONSTRAINT "CourierWebhookLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnShipment" ADD CONSTRAINT "ReturnShipment_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDispute" ADD CONSTRAINT "ReturnDispute_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationMenuItem" ADD CONSTRAINT "NavigationMenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "FooterColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskStep" ADD CONSTRAINT "AiTaskStep_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiApproval" ADD CONSTRAINT "AiApproval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiToolExecution" ADD CONSTRAINT "AiToolExecution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuranTranslation" ADD CONSTRAINT "QuranTranslation_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "QuranVerse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TafsirEntry" ADD CONSTRAINT "TafsirEntry_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "QuranVerse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HadithEntry" ADD CONSTRAINT "HadithEntry_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "HadithCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IslamicAiMessage" ADD CONSTRAINT "IslamicAiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "IslamicAiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IslamicAiCitation" ADD CONSTRAINT "IslamicAiCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "IslamicAiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IslamicAiFeedback" ADD CONSTRAINT "IslamicAiFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "IslamicAiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationPreference" ADD CONSTRAINT "PushNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTaskComment" ADD CONSTRAINT "StaffTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "StaffTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTaskComment" ADD CONSTRAINT "StaffTaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffApproval" ADD CONSTRAINT "StaffApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffApproval" ADD CONSTRAINT "StaffApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertiser" ADD CONSTRAINT "Advertiser_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserMember" ADD CONSTRAINT "AdvertiserMember_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserMember" ADD CONSTRAINT "AdvertiserMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPricingPackage" ADD CONSTRAINT "AdPricingPackage_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_pricingPackageId_fkey" FOREIGN KEY ("pricingPackageId") REFERENCES "AdPricingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignPlacement" ADD CONSTRAINT "AdCampaignPlacement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignPlacement" ADD CONSTRAINT "AdCampaignPlacement_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignCreative" ADD CONSTRAINT "AdCampaignCreative_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignCreative" ADD CONSTRAINT "AdCampaignCreative_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "AdCreative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdInvoice" ADD CONSTRAINT "AdInvoice_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdInvoice" ADD CONSTRAINT "AdInvoice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AdInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdRefund" ADD CONSTRAINT "AdRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "AdPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdRefund" ADD CONSTRAINT "AdRefund_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpressionEvent" ADD CONSTRAINT "AdImpressionEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpressionEvent" ADD CONSTRAINT "AdImpressionEvent_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "AdCreative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpressionEvent" ADD CONSTRAINT "AdImpressionEvent_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClickEvent" ADD CONSTRAINT "AdClickEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClickEvent" ADD CONSTRAINT "AdClickEvent_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "AdCreative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClickEvent" ADD CONSTRAINT "AdClickEvent_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdStaffAssignment" ADD CONSTRAINT "AdStaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdStaffAssignment" ADD CONSTRAINT "AdStaffAssignment_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdStaffAssignment" ADD CONSTRAINT "AdStaffAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAuditLog" ADD CONSTRAINT "AdAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaReference" ADD CONSTRAINT "MediaReference_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MediaTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

