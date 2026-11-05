import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CourierManager } from '@/lib/courier/manager';
import { SteadfastAdapter } from '@/lib/courier/adapters/steadfast';
import { PathaoAdapter } from '@/lib/courier/adapters/pathao';
import { RedxAdapter } from '@/lib/courier/adapters/redx';
import { CourierCode } from '@/lib/courier/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const body = await req.json();
    const code = (body.code || '').toUpperCase() as CourierCode;

    if (!code) {
      return NextResponse.json({ error: 'কুরিয়ার কোড আবশ্যক।' }, { status: 400 });
    }

    const provider = await prisma.courierProvider.findUnique({
      where: { code },
      include: { settings: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'প্রোভাইডার পাওয়া যায়নি।' }, { status: 404 });
    }

    // Merge DB settings with any temporary settings sent from form
    const settingsMap: Record<string, string> = {};
    provider.settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    if (body.settings && typeof body.settings === 'object') {
      Object.entries(body.settings).forEach(([k, v]) => {
        if (typeof v === 'string' && v.trim() && !v.includes('••••')) {
          settingsMap[k] = v.trim();
        }
      });
    }

    let testResult: { success: boolean; message: string; balance?: number; mode: string };

    if (code === 'STEADFAST') {
      const apiKey = settingsMap['api_key'];
      const secretKey = settingsMap['secret_key'];

      if (!apiKey || !secretKey) {
        return NextResponse.json({
          success: false,
          isPendingConfig: true,
          mode: 'PENDING_CONFIG',
          message: 'Steadfast API Key বা Secret Key প্রদান করা হয়নি। অনুগ্রহ করে ক্রেডেনশিয়াল প্রদান করে সেভ করুন।',
        });
      }

      const adapter = new SteadfastAdapter(apiKey, secretKey, provider.apiBaseUrl);
      const testRes = await adapter.testConnection();
      testResult = {
        success: testRes.success,
        message: testRes.message || (testRes.success ? 'Steadfast API সংযোগ সফল!' : 'Steadfast API সংযোগ ব্যর্থ'),
        balance: testRes.balance,
        mode: provider.status,
      };
    } else if (code === 'PATHAO') {
      const clientId = settingsMap['client_id'];
      const clientSecret = settingsMap['client_secret'];
      const username = settingsMap['username'];
      const password = settingsMap['password'];
      const storeId = settingsMap['store_id'];

      if (!clientId || !clientSecret || !username || !password) {
        return NextResponse.json({
          success: false,
          isPendingConfig: true,
          mode: 'PENDING_CONFIG',
          message: 'Pathao OAuth ক্রেডেনশিয়াল (Client ID, Client Secret, Username, Password) অসম্পূর্ণ।',
        });
      }

      const adapter = new PathaoAdapter(clientId, clientSecret, username, password, storeId, provider.apiBaseUrl);
      const testRes = await adapter.testConnection();
      testResult = {
        success: testRes.success,
        message: testRes.message || (testRes.success ? 'Pathao Courier API সংযোগ সফল!' : 'Pathao API সংযোগ ব্যর্থ'),
        balance: testRes.balance,
        mode: provider.status,
      };
    } else if (code === 'REDX') {
      const accessToken = settingsMap['access_token'];
      if (!accessToken) {
        return NextResponse.json({
          success: false,
          isPendingConfig: true,
          mode: 'PENDING_CONFIG',
          message: 'REDX Access Token প্রদান করা হয়নি। অনুগ্রহ করে Access Token প্রদান করুন।',
        });
      }

      const adapter = new RedxAdapter(accessToken, provider.apiBaseUrl);
      const testRes = await adapter.testConnection();
      testResult = {
        success: testRes.success,
        message: testRes.message || (testRes.success ? 'REDX API সংযোগ সফল!' : 'REDX API সংযোগ ব্যর্থ'),
        balance: testRes.balance,
        mode: provider.status,
      };
    } else {
      testResult = {
        success: false,
        message: 'অপরিচিত কুরিয়ার প্রোভাইডার।',
        mode: 'UNKNOWN',
      };
    }

    return NextResponse.json({
      ...testResult,
      providerName: provider.name,
      testedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Courier Connection Test Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'API টেস্ট করার সময় সার্ভার সংযোগে ত্রুটি ঘটেছে।',
    }, { status: 500 });
  }
}
