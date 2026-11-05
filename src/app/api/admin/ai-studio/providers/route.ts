import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const providers = await prisma.aiProviderConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ success: true, providers });
  } catch (error: any) {
    console.error('Fetch Providers Error:', error);
    return NextResponse.json({ error: 'প্রোভাইডার তালিকা আনতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { id, isActive, isDefault, apiKey, apiEndpoint } = body;

    if (!id) {
      return NextResponse.json({ error: 'প্রোভাইডার আইডি আবশ্যক' }, { status: 400 });
    }

    if (isDefault) {
      // Unset previous defaults
      await prisma.aiProviderConfig.updateMany({
        data: { isDefault: false },
      });
    }

    const dataToUpdate: any = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (typeof isDefault === 'boolean') dataToUpdate.isDefault = isDefault;
    if (apiKey !== undefined) dataToUpdate.apiKey = apiKey;
    if (apiEndpoint !== undefined) dataToUpdate.apiEndpoint = apiEndpoint;

    const updated = await prisma.aiProviderConfig.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, provider: updated });
  } catch (error: any) {
    console.error('Update Provider Error:', error);
    return NextResponse.json({ error: error?.message || 'আপডেট করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

