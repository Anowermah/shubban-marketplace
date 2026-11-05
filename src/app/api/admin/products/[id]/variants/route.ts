import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function generateSku(prefix: string, parts: string[], index: number): string {
  const cleanParts = parts.map((p) =>
    p
      .toUpperCase()
      .replace(/[^\w]/g, '')
      .slice(0, 4)
  ).filter(Boolean);
  const cleanPrefix = (prefix || 'PROD').toUpperCase().replace(/[^\w]/g, '').slice(0, 6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${cleanParts.join('-') || 'VAR'}-${randomSuffix}`;
}

// Cartesian Product helper
function cartesianProduct(arrays: any[][]): any[][] {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
    [[]]
  );
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        coverImage: true,
        price: true,
        discountPrice: true,
        stockQuantity: true,
        attributeAssignments: {
          where: { isVariant: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            attribute: true,
            values: {
              include: { value: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { bookId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      product,
      variants,
    });
  } catch (error: any) {
    console.error('Product Variants GET error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্ট লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const {
      mode = 'generate', // 'preview' or 'generate' or 'single'
      attributes = [], // Array of { name: string, values: string[] }
      excludedCombinations = [], // Array of combination keys to skip
      preserveExisting = true, // If true, skips duplicates without overwriting custom pricing
      defaultPrice = product.price,
      defaultStock = 10,
      baseSku = product.slug,
      singleVariantData, // When adding a single custom variant
    } = body;

    // Single custom variant addition
    if (mode === 'single' && singleVariantData) {
      const {
        name,
        sku,
        barcode,
        price,
        salePrice,
        costPrice,
        wholesalePrice,
        stockQuantity = 10,
        lowStockThreshold = 5,
        manageStock = true,
        stockStatus = 'IN_STOCK',
        allowBackorders = false,
        image,
        description,
        weight,
        length,
        width,
        height,
        shippingClass,
        taxClass,
        status = 'ACTIVE',
        variantAttributes,
      } = singleVariantData;

      if (!name || price === undefined) {
        return NextResponse.json({ error: 'ভ্যারিয়েন্টের নাম ও মূল্য আবশ্যক।' }, { status: 400 });
      }

      const variantSku = (sku?.trim() || generateSku(baseSku, [name], 1)).toUpperCase();

      const newVariant = await prisma.productVariant.create({
        data: {
          bookId: params.id,
          name: name.trim(),
          sku: variantSku,
          barcode: barcode?.trim() || null,
          price: parseFloat(String(price)),
          salePrice: salePrice ? parseFloat(String(salePrice)) : null,
          costPrice: costPrice ? parseFloat(String(costPrice)) : null,
          wholesalePrice: wholesalePrice ? parseFloat(String(wholesalePrice)) : null,
          stockQuantity: parseInt(String(stockQuantity), 10) || 0,
          lowStockThreshold: parseInt(String(lowStockThreshold), 10) || 5,
          manageStock: Boolean(manageStock),
          stockStatus,
          allowBackorders: Boolean(allowBackorders),
          image: image?.trim() || null,
          description: description?.trim() || null,
          weight: weight ? parseFloat(String(weight)) : null,
          length: length ? parseFloat(String(length)) : null,
          width: width ? parseFloat(String(width)) : null,
          height: height ? parseFloat(String(height)) : null,
          shippingClass: shippingClass?.trim() || null,
          taxClass: taxClass?.trim() || null,
          status,
          attributes: variantAttributes ? JSON.stringify(variantAttributes) : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'ভ্যারিয়েন্ট সফলভাবে যোগ করা হয়েছে!',
        variant: newVariant,
      }, { status: 201 });
    }

    // Cartesian product combinations generator
    if (!Array.isArray(attributes) || attributes.length === 0) {
      return NextResponse.json({ error: 'ভ্যারিয়েন্ট তৈরির জন্য অন্তত একটি অ্যাট্রিবিউট নির্বাচন করুন।' }, { status: 400 });
    }

    // Prepare arrays for Cartesian product
    const validAttributeLists = attributes
      .filter((attr) => attr.values && Array.isArray(attr.values) && attr.values.length > 0)
      .map((attr) =>
        attr.values.map((val: string) => ({
          attributeName: attr.name,
          valueName: typeof val === 'string' ? val : (val as any).name,
          valueCode: (val as any).code || null,
        }))
      );

    if (validAttributeLists.length === 0) {
      return NextResponse.json({ error: 'নির্বাচিত অ্যাট্রিবিউটে কোনো সক্রিয় ভ্যালু পাওয়া যায়নি।' }, { status: 400 });
    }

    // Compute all combinations
    const rawCombinations = cartesianProduct(validAttributeLists);

    // Limit safeguard to prevent memory overload
    const MAX_COMBINATIONS = 250;
    if (rawCombinations.length > MAX_COMBINATIONS) {
      return NextResponse.json({
        error: `একসাথে সর্বোচ্চ ${MAX_COMBINATIONS}টি ভ্যারিয়েন্ট তৈরি করা সম্ভব। আপনার নির্বাচিত কম্বিনেশন সংখ্যা: ${rawCombinations.length}। অনুগ্রহ করে ভ্যালুর সংখ্যা হ্রাস করুন।`,
      }, { status: 400 });
    }

    // Fetch existing variants to detect duplicates
    const existingVariants = await prisma.productVariant.findMany({
      where: { bookId: params.id },
      select: { id: true, name: true, sku: true, attributes: true },
    });
    const existingNames = new Set(existingVariants.map((v) => v.name.toLowerCase()));

    const excludedSet = new Set((excludedCombinations || []).map((k: string) => k.toLowerCase()));

    const preparedCombinations = rawCombinations.map((combo, idx) => {
      // E.g. Name: "Size: M / Color: Red"
      const name = combo.map((c) => `${c.attributeName}: ${c.valueName}`).join(' / ');
      const attrObj: Record<string, string> = {};
      combo.forEach((c) => {
        attrObj[c.attributeName] = c.valueName;
      });

      const valueCodes = combo.map((c) => c.valueCode || c.valueName);
      const sku = generateSku(baseSku, valueCodes, idx + 1);
      const isExisting = existingNames.has(name.toLowerCase());
      const isExcluded = excludedSet.has(name.toLowerCase());

      return {
        key: name,
        name,
        sku,
        price: parseFloat(String(defaultPrice)),
        stockQuantity: parseInt(String(defaultStock), 10) || 10,
        attributes: attrObj,
        isExisting,
        isExcluded,
      };
    });

    // If PREVIEW MODE: return without creating in database
    if (mode === 'preview') {
      return NextResponse.json({
        success: true,
        mode: 'preview',
        totalCombinations: preparedCombinations.length,
        combinations: preparedCombinations,
      });
    }

    // GENERATE MODE: Filter out excluded and existing (if preserveExisting is true)
    const toCreate = preparedCombinations.filter((c) => {
      if (c.isExcluded) return false;
      if (preserveExisting && c.isExisting) return false;
      return true;
    });

    if (toCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'কোনো নতুন কম্বিনেশন অবশিষ্ট নেই (সবগুলো ইতিমধ্যে বিদ্যমান বা বাদ দেওয়া হয়েছে)।',
        createdCount: 0,
      });
    }

    // Insert new variants in transaction
    const createdVariants = await prisma.$transaction(
      toCreate.map((item) =>
        prisma.productVariant.create({
          data: {
            bookId: params.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            stockQuantity: item.stockQuantity,
            attributes: JSON.stringify(item.attributes),
            status: 'ACTIVE',
            stockStatus: item.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          },
        })
      )
    );

    const allVariants = await prisma.productVariant.findMany({
      where: { bookId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: `${createdVariants.length}টি নতুন ভ্যারিয়েন্ট সফলভাবে তৈরি করা হয়েছে!`,
      createdCount: createdVariants.length,
      variants: allVariants,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Product Variants POST error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্ট তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

// Bulk Variant Operations
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { action, variantIds = [], payload = {} } = body;

    if (!action) {
      return NextResponse.json({ error: 'বাল্ক অ্যাকশন আবশ্যক।' }, { status: 400 });
    }

    const whereClause: any = { bookId: params.id };
    if (Array.isArray(variantIds) && variantIds.length > 0) {
      whereClause.id = { in: variantIds };
    }

    if (action === 'bulk_delete') {
      const deleted = await prisma.productVariant.deleteMany({
        where: whereClause,
      });
      return NextResponse.json({
        success: true,
        message: `${deleted.count}টি ভ্যারিয়েন্ট সফলভাবে মুছে ফেলা হয়েছে।`,
      });
    }

    if (action === 'bulk_status') {
      const { status, stockStatus } = payload;
      const dataToUpdate: any = {};
      if (status) dataToUpdate.status = status;
      if (stockStatus) dataToUpdate.stockStatus = stockStatus;

      const updated = await prisma.productVariant.updateMany({
        where: whereClause,
        data: dataToUpdate,
      });
      return NextResponse.json({
        success: true,
        message: `${updated.count}টি ভ্যারিয়েন্টের স্ট্যাটাস আপডেট করা হয়েছে।`,
      });
    }

    if (action === 'bulk_stock') {
      const { type = 'set', value = 0 } = payload;
      const numericVal = parseInt(String(value), 10) || 0;

      if (type === 'set') {
        const updated = await prisma.productVariant.updateMany({
          where: whereClause,
          data: {
            stockQuantity: numericVal,
            stockStatus: numericVal > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          },
        });
        return NextResponse.json({
          success: true,
          message: `${updated.count}টি ভ্যারিয়েন্টের স্টক সফলভাবে ${numericVal} এ নির্ধারণ করা হয়েছে।`,
        });
      } else if (type === 'adjust') {
        // Increment/decrement requires individual updates
        const targetVariants = await prisma.productVariant.findMany({
          where: whereClause,
          select: { id: true, stockQuantity: true },
        });

        await prisma.$transaction(
          targetVariants.map((v) => {
            const newStock = Math.max(0, v.stockQuantity + numericVal);
            return prisma.productVariant.update({
              where: { id: v.id },
              data: {
                stockQuantity: newStock,
                stockStatus: newStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
              },
            });
          })
        );

        return NextResponse.json({
          success: true,
          message: `${targetVariants.length}টি ভ্যারিয়েন্টের স্টক সফলভাবে সমন্বয় করা হয়েছে।`,
        });
      }
    }

    if (action === 'bulk_price') {
      const { type = 'set', value = 0, isSalePrice = false } = payload;
      const numericVal = parseFloat(String(value)) || 0;

      if (type === 'set') {
        const field = isSalePrice ? 'salePrice' : 'price';
        const updated = await prisma.productVariant.updateMany({
          where: whereClause,
          data: { [field]: numericVal },
        });
        return NextResponse.json({
          success: true,
          message: `${updated.count}টি ভ্যারিয়েন্টের মূল্য ${numericVal} টাকায় নির্ধারণ করা হয়েছে।`,
        });
      } else if (type === 'adjust_fixed' || type === 'adjust_percent') {
        const targetVariants = await prisma.productVariant.findMany({
          where: whereClause,
          select: { id: true, price: true, salePrice: true },
        });

        await prisma.$transaction(
          targetVariants.map((v) => {
            const currentPrice = isSalePrice ? (v.salePrice || v.price) : v.price;
            let finalPrice = currentPrice;
            if (type === 'adjust_fixed') {
              finalPrice = Math.max(1, currentPrice + numericVal);
            } else if (type === 'adjust_percent') {
              finalPrice = Math.max(1, currentPrice + (currentPrice * (numericVal / 100)));
            }
            finalPrice = Math.round(finalPrice * 100) / 100;

            const field = isSalePrice ? 'salePrice' : 'price';
            return prisma.productVariant.update({
              where: { id: v.id },
              data: { [field]: finalPrice },
            });
          })
        );

        return NextResponse.json({
          success: true,
          message: `${targetVariants.length}টি ভ্যারিয়েন্টের মূল্য সফলভাবে সমন্বয় করা হয়েছে।`,
        });
      }
    }

    if (action === 'bulk_sku') {
      const targetVariants = await prisma.productVariant.findMany({
        where: whereClause,
      });

      await prisma.$transaction(
        targetVariants.map((v, i) => {
          const newSku = `SKU-${Date.now().toString().slice(-6)}-${i + 1}`;
          return prisma.productVariant.update({
            where: { id: v.id },
            data: { sku: newSku },
          });
        })
      );

      return NextResponse.json({
        success: true,
        message: `${targetVariants.length}টি ভ্যারিয়েন্টের নতুন SKU সফলভাবে তৈরি করা হয়েছে।`,
      });
    }

    return NextResponse.json({ error: 'অজ্ঞাত বাল্ক অপারেশন।' }, { status: 400 });
  } catch (error: any) {
    console.error('Product Variants PUT error:', error);
    return NextResponse.json({ error: error.message || 'বাল্ক অপারেশন ব্যর্থ।' }, { status: 500 });
  }
}

