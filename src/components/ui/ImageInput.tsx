import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { insforge } from '../../lib/insforge';

export function ImageInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const res = await insforge.storage.from('images').upload(fileName, file);
      
      if (res.error) throw res.error;
      
      if (res.data?.key) {
        const { data } = insforge.storage.from('images').getPublicUrl(res.data.key);
        if (data?.publicUrl) onChange(data.publicUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. You can try using an Image URL instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          Image URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-4">
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
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Choose Image File'}
          </button>
          {value && mode === 'upload' && !uploading && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> File selected
            </span>
          )}
        </div>
      )}

      {value && (
        <div className="mt-2 h-32 w-48 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          <img src={value} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
      )}
    </div>
  );
}
