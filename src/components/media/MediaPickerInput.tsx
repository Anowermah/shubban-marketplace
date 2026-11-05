'use client';

import React, { useState } from 'react';
import { ImageIcon, Upload, X, Eye, FileText, Check } from 'lucide-react';
import MediaPickerModal, { MediaPickerAsset } from './MediaPickerModal';

export interface MediaPickerInputProps {
  label?: string;
  value: string;
  onChange: (url: string, asset?: MediaPickerAsset) => void;
  allowedTypes?: Array<'IMAGE' | 'PDF' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'ALL'>;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

export default function MediaPickerInput({
  label,
  value,
  onChange,
  allowedTypes = ['IMAGE'],
  placeholder = 'ছবির লিঙ্ক লিখুন বা লাইব্রেরি থেকে সিলেক্ট করুন',
  helpText,
  required = false,
}: MediaPickerInputProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isImage =
    value &&
    (value.match(/\.(jpeg|jpg|png|webp|avif|gif|svg)($|\?)/i) ||
      value.startsWith('data:image') ||
      allowedTypes.includes('IMAGE'));

  const isPdf = value && value.match(/\.pdf($|\?)/i);

  const handleSelect = (assets: MediaPickerAsset[]) => {
    if (assets.length > 0) {
      onChange(assets[0].publicUrl, assets[0]);
    }
  };

  return (
    <div className="space-y-1.5 font-bengali">
      {label && (
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-start gap-3">
        {/* Visual Preview Thumbnail Box */}
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex-shrink-0 overflow-hidden flex items-center justify-center relative group">
          {value ? (
            isImage ? (
              <img
                src={value}
                alt="Selected media preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
            ) : isPdf ? (
              <FileText className="w-8 h-8 text-rose-500" />
            ) : (
              <FileText className="w-8 h-8 text-amber-600" />
            )
          ) : (
            <ImageIcon className="w-6 h-6 text-stone-400 stroke-1" />
          )}

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="মুছে ফেলুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons & Manual URL */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>মিডিয়া লাইব্রেরি থেকে সিলেক্ট করুন</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-stone-400 hover:text-red-600 text-xs px-2 py-1"
                title="রিমুভ করুন"
              >
                রিমুভ
              </button>
            )}
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 font-mono"
          />

          {helpText && <p className="text-[10px] text-stone-400">{helpText}</p>}
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        allowedTypes={allowedTypes}
        multiple={false}
        initialSelectedUrl={value}
      />
    </div>
  );
}

