import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tranId = searchParams.get('tran_id') || 'TXN-BKASH-DEMO';
  const amount = searchParams.get('amount') || '0';
  const orderNumber = searchParams.get('order') || '';

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>bKash Tokenized Sandbox Simulator | শুব্বান লাইব্রেরী</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #fff0f5; padding: 2rem; color: #1e293b; }
        .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 2px solid #e11d48; }
        h1 { font-size: 1.25rem; font-weight: bold; color: #e11d48; margin-bottom: 0.5rem; }
        .meta { background: #fdf2f8; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; font-size: 0.875rem; border: 1px solid #fbcfe8; }
        .btn { display: block; width: 100%; padding: 0.75rem; margin-top: 0.75rem; border-radius: 0.5rem; font-weight: bold; font-size: 0.875rem; cursor: pointer; text-align: center; border: none; text-decoration: none; }
        .btn-success { background: #e11d48; color: white; }
        .btn-fail { background: #64748b; color: white; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📱 bKash Payment Simulation</h1>
        <p style="font-size: 13px; color: #64748b;">শুব্বান লাইব্রেরী বিকাশ মার্চেন্ট পেমেন্ট গেটওয়ে</p>
        
        <div class="meta">
          <p><strong>অর্ডার:</strong> #${orderNumber}</p>
          <p><strong>ট্রানজেকশন আইডি:</strong> <code>${tranId}</code></p>
          <p><strong>প্রদেয় পরিমাণ:</strong> ৳ ${amount} BDT</p>
          <p><strong>মার্চেন্ট:</strong> Shubban Library Official</p>
        </div>

        <form action="/api/payments/bkash/callback" method="POST">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="paymentID" value="SANDBOX_BKASH_${Date.now()}">
          <input type="hidden" name="status" value="success">
          <button type="submit" class="btn btn-success">✅ বিকাশ পিন দিয়ে পেমেন্ট নিশ্চিত করুন</button>
        </form>

        <form action="/api/payments/bkash/callback" method="POST">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="status" value="cancel">
          <button type="submit" class="btn btn-fail">❌ পেমেন্ট বাতিল করুন</button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

