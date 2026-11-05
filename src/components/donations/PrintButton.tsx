'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-1.5 transition-all"
    >
      <Printer className="w-4 h-4 text-shubban-gold" />
      <span>রসিদ প্রিন্ট বা ডাউনলোড করুন</span>
    </button>
  );
}

