import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 font-bengali">
      <div className="w-10 h-10 border-4 border-shubban-green/20 border-t-shubban-green rounded-full animate-spin" />
      <p className="text-xs text-stone-500 animate-pulse">লোড হচ্ছে...</p>
    </div>
  );
}
