import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত।' }, { status: 401 });
    }

    const body = await req.json();
    const { title, name, phone, address, city, zone, isDefault } = body;

    const existing = await prisma.address.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: 'ঠিকানাটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: params.id },
      data: {
        ...(title ? { title } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
        ...(city ? { city } : {}),
        ...(zone ? { zone } : {}),
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'ঠিকানা আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত।' }, { status: 401 });
    }

    const existing = await prisma.address.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: 'ঠিকানাটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'ঠিকানা সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'ঠিকানা মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

