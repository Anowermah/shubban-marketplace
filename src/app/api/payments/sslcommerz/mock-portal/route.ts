import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tranId = searchParams.get('tran_id') || 'TXN-DEMO';
  const amount = searchParams.get('amount') || '0';
  const orderNumber = searchParams.get('order') || '';

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>SSLCOMMERZ Sandbox Gateway Simulator | শুব্বান লাইব্রেরী</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f4f6f8; padding: 2rem; color: #1e293b; }
        .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        h1 { font-size: 1.25rem; font-weight: bold; color: #0284c7; margin-bottom: 0.5rem; }
        .meta { background: #f8fafc; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; font-size: 0.875rem; border: 1px solid #e2e8f0; }
        .btn { display: block; width: 100%; padding: 0.75rem; margin-top: 0.75rem; border-radius: 0.5rem; font-weight: bold; font-size: 0.875rem; cursor: pointer; text-align: center; border: none; text-decoration: none; }
        .btn-success { background: #059669; color: white; }
        .btn-fail { background: #e11d48; color: white; }
        .btn-cancel { background: #64748b; color: white; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🔒 SSLCOMMERZ Sandbox Simulator</h1>
        <p style="font-size: 13px; color: #64748b;">শুব্বান লাইব্রেরী পেমেন্ট টেস্ট গেটওয়ে</p>
        
        <div class="meta">
          <p><strong>অর্ডার নম্বর:</strong> ${orderNumber}</p>
          <p><strong>ট্রানজেকশন আইডি:</strong> <code>${tranId}</code></p>
          <p><strong>মোট প্রদেয়:</strong> ৳ ${amount} BDT</p>
          <p><strong>মোড:</strong> Sandbox Integration Protocol</p>
        </div>

        <form action="/api/payments/sslcommerz/callback" method="POST">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="val_id" value="SANDBOX_VAL_${Date.now()}">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="card_type" value="VISA-SSLCOMMERZ">
          <input type="hidden" name="bank_tran_id" value="BANK_${Date.now()}">
          <input type="hidden" name="status" value="VALID">
          <button type="submit" class="btn btn-success">✅ সফল পেমেন্ট সিমুলেট করুন (Simulate Success)</button>
        </form>

        <form action="/api/payments/sslcommerz/callback" method="POST">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="status" value="FAILED">
          <input type="hidden" name="error" value="Insufficient funds or user cancel">
          <button type="submit" class="btn btn-fail">❌ ব্যর্থ পেমেন্ট সিমুলেট করুন (Simulate Fail)</button>
        </form>

        <form action="/api/payments/sslcommerz/callback" method="POST">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="status" value="CANCELLED">
          <button type="submit" class="btn btn-cancel">⏹️ বাতিল সিমুলেট করুন (Cancel)</button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

