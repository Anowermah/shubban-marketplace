import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyPublicationAccess } from '@/lib/cms';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    const access = await verifyPublicationAccess({
      issueId: params.id,
      userId: session?.id,
      userRole: session?.role,
    });

    return NextResponse.json({
      success: true,
      ...access,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, allowed: false, error: error.message },
      { status: 400 }
    );
  }
}

