import React from 'react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="text-slate-500 max-w-sm">
        This section is currently under development. Please check back later during the next stages of development.
      </p>
    </div>
  );
}
