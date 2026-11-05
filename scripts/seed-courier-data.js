/**
 * Shubban Library Marketplace — Courier & Delivery Logistics Seeder
 */

require('./load-env');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCourierData() {
  console.log('='.repeat(65));
  console.log('SHUBBAN MARKETPLACE: SEEDING COURIER & LOGISTICS DATA');
  console.log('='.repeat(65));

  // 1. Seed Courier Providers
  const providers = [
    {
      code: 'STEADFAST',
      name: 'Steadfast Courier',
      logoUrl: '/images/couriers/steadfast.png',
      isEnabled: true,
      isDefault: true,
      status: 'PENDING_CONFIG', // Set to PENDING_CONFIG if live API keys not injected yet
      apiBaseUrl: 'https://portal.steadfast.com.bd/api/v1',
      webhookUrl: 'https://atrbd.com/api/webhooks/courier/steadfast',
      isCodSupported: true,
      autoBookingEnabled: false,
      defaultChargeInsideDhaka: 60.0,
      defaultChargeOutsideDhaka: 120.0,
      settings: [
        { key: 'api_key', value: 'CONFIG_PENDING_STEADFAST_API_KEY' },
        { key: 'secret_key', value: 'CONFIG_PENDING_STEADFAST_SECRET_KEY' },
      ],
    },
    {
      code: 'PATHAO',
      name: 'Pathao Courier',
      logoUrl: '/images/couriers/pathao.png',
      isEnabled: true,
      isDefault: false,
      status: 'PENDING_CONFIG',
      apiBaseUrl: 'https://api-hermes.pathao.com',
      webhookUrl: 'https://atrbd.com/api/webhooks/courier/pathao',
      isCodSupported: true,
      autoBookingEnabled: false,
      defaultChargeInsideDhaka: 60.0,
      defaultChargeOutsideDhaka: 120.0,
      settings: [
        { key: 'client_id', value: 'CONFIG_PENDING_PATHAO_CLIENT_ID' },
        { key: 'client_secret', value: 'CONFIG_PENDING_PATHAO_CLIENT_SECRET' },
        { key: 'username', value: 'CONFIG_PENDING_PATHAO_USERNAME' },
        { key: 'password', value: 'CONFIG_PENDING_PATHAO_PASSWORD' },
        { key: 'store_id', value: 'CONFIG_PENDING_PATHAO_STORE_ID' },
      ],
    },
    {
      code: 'REDX',
      name: 'REDX Delivery',
      logoUrl: '/images/couriers/redx.png',
      isEnabled: true,
      isDefault: false,
      status: 'PENDING_CONFIG',
      apiBaseUrl: 'https://openapi.redx.com.bd/v1.0.0-beta',
      webhookUrl: 'https://atrbd.com/api/webhooks/courier/redx',
      isCodSupported: true,
      autoBookingEnabled: false,
      defaultChargeInsideDhaka: 60.0,
      defaultChargeOutsideDhaka: 130.0,
      settings: [
        { key: 'access_token', value: 'CONFIG_PENDING_REDX_TOKEN' },
      ],
    },
  ];

  for (const prov of providers) {
    const existing = await prisma.courierProvider.findUnique({
      where: { code: prov.code },
    });

    if (!existing) {
      const created = await prisma.courierProvider.create({
        data: {
          code: prov.code,
          name: prov.name,
          logoUrl: prov.logoUrl,
          isEnabled: prov.isEnabled,
          isDefault: prov.isDefault,
          status: prov.status,
          apiBaseUrl: prov.apiBaseUrl,
          webhookUrl: prov.webhookUrl,
          isCodSupported: prov.isCodSupported,
          autoBookingEnabled: prov.autoBookingEnabled,
          defaultChargeInsideDhaka: prov.defaultChargeInsideDhaka,
          defaultChargeOutsideDhaka: prov.defaultChargeOutsideDhaka,
        },
      });

      for (const s of prov.settings) {
        await prisma.courierSetting.create({
          data: {
            providerId: created.id,
            key: s.key,
            value: s.value,
          },
        });
      }
      console.log(`✓ Created Courier Provider: ${prov.name} (${prov.code})`);
    } else {
      console.log(`✓ Existing Courier Provider: ${prov.name} (${prov.code})`);
    }
  }

  // 2. Seed Dynamic Shipping Rates
  const rates = [
    {
      name: 'ঢাকা মেট্রোপলিটন (Inside Dhaka)',
      destinationType: 'INSIDE_DHAKA',
      district: 'ঢাকা',
      baseWeightKg: 1.0,
      baseRate: 60.0,
      perKgExtraRate: 20.0,
      codChargePct: 0.0, // 0% COD inside Dhaka
      codChargeFixed: 0.0,
      specialDeliveryFee: 0.0,
      isActive: true,
    },
    {
      name: 'ঢাকা উপশহর (Dhaka Suburbs)',
      destinationType: 'SUB_DHAKA',
      district: 'ঢাকা',
      baseWeightKg: 1.0,
      baseRate: 90.0,
      perKgExtraRate: 20.0,
      codChargePct: 1.0,
      codChargeFixed: 0.0,
      specialDeliveryFee: 0.0,
      isActive: true,
    },
    {
      name: 'ঢাকার বাইরে সারাদেশে (Outside Dhaka)',
      destinationType: 'OUTSIDE_DHAKA',
      baseWeightKg: 1.0,
      baseRate: 120.0,
      perKgExtraRate: 25.0,
      codChargePct: 1.0, // 1% COD outside Dhaka
      codChargeFixed: 0.0,
      specialDeliveryFee: 0.0,
      isActive: true,
    },
    {
      name: 'পার্বত্য ও প্রত্যন্ত অঞ্চল (Remote / Hill Tracts)',
      destinationType: 'DISTRICT',
      district: 'রাঙ্গামাটি',
      baseWeightKg: 1.0,
      baseRate: 150.0,
      perKgExtraRate: 30.0,
      codChargePct: 1.0,
      codChargeFixed: 20.0,
      specialDeliveryFee: 30.0,
      isActive: true,
    },
  ];

  for (const r of rates) {
    const existing = await prisma.shippingRate.findFirst({
      where: {
        destinationType: r.destinationType,
        district: r.district || null,
      },
    });

    if (!existing) {
      await prisma.shippingRate.create({ data: r });
      console.log(`✓ Created Shipping Rate: ${r.name}`);
    }
  }

  console.log('\nCourier & Logistics Seed Completed Successfully!');
  await prisma.$disconnect();
}

seedCourierData().catch(async (e) => {
  console.error('Courier Seed Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});

