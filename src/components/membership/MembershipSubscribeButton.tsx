'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface MembershipSubscribeButtonProps {
  plan: {
    id: string;
    code: string;
    name: string;
    priceMonthly: number;
  };
  isPopular?: boolean;
}

export default function MembershipSubscribeButton({
  plan,
  isPopular = false,
}: MembershipSubscribeButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push(`/login?redirect=/membership`);
      return;
    }

    if (plan.code === 'FREE') {
      router.push('/digital-library?free=true');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval: 'MONTHLY',
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/account/subscriptions');
          router.refresh();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow">
        <CheckCircle2 className="w-4 h-4" />
        <span>সদস্যপদ সক্রিয় হয়েছে!</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
        isPopular
          ? 'bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 shadow-shubban-gold/30'
          : 'bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory'
      }`}
    >
      <span>
        {isLoading
          ? 'প্রক্রিয়াধীন...'
          : plan.code === 'FREE'
          ? 'বিনামূল্যে পড়ুন'
          : `${plan.name} হিসেবে যুক্ত হোন`}
      </span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
