const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDatabase() {
  console.log('--- DATABASE INVENTORY AUDIT ---');

  const models = [
    'User', 'Profile', 'Address', 'CustomerTag', 'CustomerMembership', 'CustomerCommunication',
    'Category', 'Publisher', 'Author', 'AttributeGroup', 'Attribute', 'AttributeValue',
    'Book', 'BookAttributeValue', 'InventoryLog', 'Coupon', 'Order', 'OrderItem',
    'PaymentTransaction', 'Refund', 'Review', 'ReviewVote', 'DonationCampaign', 'Donation',
    'DonationDisbursement', 'SellerApplication', 'SellerStatement', 'CommissionRule',
    'CommissionAdjustment', 'CourierProvider', 'Shipment', 'CourierSettlement',
    'CourierWebhookLog', 'HomepageBanner', 'HomepageSection', 'StaticPage',
    'WebsiteSetting', 'AuditLog', 'Notification', 'PushSubscription', 'ResearchPaper',
    'IslamicAiConversation', 'IslamicAiMessage', 'IslamicAiTask', 'IslamicKnowledgeSource',
    'Magazine', 'PublicationIssue', 'PublicationArticle', 'PublicationFile', 'PublicationTag',
    'PublicationCategory', 'Article', 'ArticleRevision', 'ReadingProgress', 'Bookmark',
    'PublisherMember', 'PublicationMember', 'PublicationSchedule', 'PublicationRights',
    'PublicationAuditLog', 'PublicationSubscriptionPlan', 'PublicationSubscription', 'MagazineSetting'
  ];

  const results = {};
  for (const m of models) {
    const key = m.charAt(0).toLowerCase() + m.slice(1);
    try {
      if (prisma[key]) {
        results[m] = await prisma[key].count();
      } else {
        results[m] = 'MODEL_NOT_FOUND_ON_CLIENT';
      }
    } catch (e) {
      results[m] = `ERROR: ${e.message}`;
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}

auditDatabase();

