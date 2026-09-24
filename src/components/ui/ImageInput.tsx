import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Loader2, X, CheckCircle2 } from 'lucide-react';
import { uploadImage, getImageUrl } from '../../services/storageService';

interface ImageInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export function ImageInput({ value, onChange, label }: ImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image is too large. Please select a file under 15MB.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);
      const result = await uploadImage(file);
      if (result.url) {
        onChange(result.url);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload image. You can paste an Image URL instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayUrl = value ? getImageUrl(value) : '';

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs sm:text-sm font-bold text-slate-700">{label}</label>
      )}

      <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'upload' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'url' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Image URL
        </button>
      </div>

      {mode === 'url' ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
            value={value}
            onChange={(e) => {
              setErrorMsg(null);
              onChange(e.target.value);
            }}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear Image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-rose-600" /> : <Upload className="h-4 w-4 text-rose-600" />}
            {uploading ? 'Uploading to InsForge Storage...' : 'Choose File from Device'}
          </button>
          {value && !uploading && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Stored in InsForge
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
      )}

      {displayUrl && (
        <div className="mt-3 rounded-2xl border border-slate-200/90 bg-slate-900/5 p-3 max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Image Preview
            </span>
            <span className="text-[10px] font-semibold text-slate-400 font-mono truncate max-w-[200px]">
              {displayUrl.split('/').pop()}
            </span>
          </div>
          <div className="max-h-64 sm:max-h-72 w-full overflow-hidden rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2">
            <img
              src={displayUrl}
              alt="Uploaded Preview"
              className="max-h-60 sm:max-h-68 w-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setErrorMsg('Image failed to render. Please verify the URL or try another file.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
