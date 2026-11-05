import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, subtitle, badge, viewAllUrl, isEnabled, displayOrder, config } = body;

    const dataToUpdate: any = {};
    if (typeof title === 'string') dataToUpdate.title = title.trim();
    if (subtitle !== undefined) dataToUpdate.subtitle = subtitle ? subtitle.trim() : null;
    if (badge !== undefined) dataToUpdate.badge = badge ? badge.trim() : null;
    if (viewAllUrl !== undefined) dataToUpdate.viewAllUrl = viewAllUrl ? viewAllUrl.trim() : null;
    if (typeof isEnabled === 'boolean') dataToUpdate.isEnabled = isEnabled;
    if (typeof displayOrder === 'number') dataToUpdate.displayOrder = displayOrder;
    if (config !== undefined) {
      dataToUpdate.config = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null;
    }

    const updated = await prisma.homepageSection.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath('/');
    return NextResponse.json({ section: updated, message: 'সেকশন সফলভাবে হালনাগাদ করা হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { id } = params;
    await prisma.homepageSection.delete({ where: { id } });

    revalidatePath('/');
    return NextResponse.json({ message: 'সেকশন মুছে ফেলা হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

