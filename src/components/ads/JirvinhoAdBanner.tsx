import React from 'react';
import { ExternalLink, Globe, Mail, Phone, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface JirvinhoAdBannerProps {
  variant?: 'featured' | 'feed' | 'compact' | 'article' | 'matchday' | 'promo';
  className?: string;
  badgeText?: string;
}

const TARGET_URL = 'https://jirvinho-software-ug.vercel.app/';
const BANNER_IMAGE_URL = '/assets/aistudio/Jirvinho_Software_World_Banner_5ed34b31.png';
const PHONE_NUMBER = '+256700400063';
const SECONDARY_PHONE = '0760289823';
const EMAIL_ADDRESS = 'kisakyesaron72@gmail.com';

export function JirvinhoAdBanner({
  variant = 'featured',
  className = '',
  badgeText = 'Official Technology Partner',
}: JirvinhoAdBannerProps) {

  // 1. COMPACT RIBBON (Pure Light Mode)
  if (variant === 'compact') {
    return (
      <aside aria-label="Sponsored Technology Partner" className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-sm backdrop-blur-md transition-all hover:border-rose-300 hover:shadow-md ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-rose-200 bg-white shadow-2xs">
              <img
                src={BANNER_IMAGE_URL}
                alt="Jirvinho Software World"
                className="h-full w-full object-cover object-left"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/70">
                  {badgeText}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ad</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                Jirvinho Software World
              </h4>
              <p className="text-xs text-slate-500 truncate">
                Websites, Mobile Apps &amp; Custom Software Solutions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <a
              href={`https://wa.me/256700400063?text=${encodeURIComponent('Hello Jirvinho Software World! I saw your ad on SportsHub.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 shadow-xs hover:shadow transition-all"
            >
              <span>Explore Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 2. IN-FEED SPONSOR TILE (Pure Light Mode)
  if (variant === 'feed') {
    return (
      <aside aria-label="Sponsored Technology Partner" className={`group relative col-span-1 md:col-span-2 overflow-hidden rounded-3xl border border-rose-200/90 bg-white shadow-md hover:shadow-xl transition-all duration-300 ${className}`}>
        {/* Top Header Label - Pure Light Theme */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-rose-50 via-white to-rose-50/70 border-b border-rose-100 text-slate-800 text-[11px] font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span className="uppercase tracking-wider text-rose-700 font-black">{badgeText}</span>
            <span className="text-slate-400 font-medium hidden sm:inline">• Jirvinho Software World</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-white border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs">
            Featured Sponsor
          </span>
        </div>

        {/* Banner Clickable Image */}
        <a
          href={TARGET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-[2/1] sm:aspect-[2.3/1] md:aspect-[2.5/1] w-full overflow-hidden bg-slate-50 cursor-pointer"
        >
          <img
            src={BANNER_IMAGE_URL}
            alt="Jirvinho Software World Banner"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-6 backdrop-blur-[2px]">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-black shadow-lg border border-slate-200">
              Visit jirvinho-software-ug.vercel.app
              <ExternalLink className="w-4 h-4 text-rose-600" />
            </span>
          </div>
        </a>

        {/* Action and Info Footer */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-rose-100 bg-white">
          <div className="text-center sm:text-left">
            <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
              <span>Turning Ideas Into Digital Solutions</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Custom Web &amp; Mobile Apps, Database Design, Cloud Systems &amp; IT Solutions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-colors"
              title="Call Jirvinho Software"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xs:inline">Call:</span> {PHONE_NUMBER}
            </a>
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-rose-600 hover:bg-rose-700 shadow-sm hover:shadow transition-all"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 3. ARTICLE READER CARD (Pure Light Mode)
  if (variant === 'article') {
    return (
      <aside aria-label="Sponsored Technology Partner" className={`my-8 overflow-hidden rounded-3xl border border-rose-200/90 bg-gradient-to-br from-white via-rose-50/30 to-emerald-50/20 text-slate-900 shadow-md ${className}`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100/80 text-rose-700 border border-rose-200">
                <Sparkles className="w-3 h-3 text-rose-600" />
                {badgeText}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white border border-slate-200/80 px-2 py-0.5 rounded">
              Advertisement
            </span>
          </div>

          <a
            href={TARGET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-2xl border border-rose-100 bg-slate-50 shadow-sm cursor-pointer"
          >
            <img
              src={BANNER_IMAGE_URL}
              alt="Jirvinho Software World"
              className="w-full aspect-[2/1] sm:aspect-[2.2/1] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors flex items-end p-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-black text-slate-950 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-slate-200">
                  Web, Mobile, Database &amp; Cloud IT
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md hover:bg-rose-700">
                  Visit Site <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </a>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-black text-slate-900">
                Need a modern website, mobile app, or software for your business?
              </h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs text-slate-600">
                <a href={`tel:${PHONE_NUMBER}`} className="hover:text-rose-600 font-bold transition-colors flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" /> {PHONE_NUMBER}
                </a>
                <span className="text-slate-300">•</span>
                <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:text-rose-600 font-bold transition-colors flex items-center gap-1">
                  <Mail className="w-3 h-3 text-rose-600" /> {EMAIL_ADDRESS}
                </a>
              </div>
            </div>

            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
            >
              <span>Explore jirvinho-software-ug</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 4. MATCHDAY SPONSOR BANNER (Pure Light Mode)
  if (variant === 'matchday') {
    return (
      <aside aria-label="Official Matchday Sponsor" className={`relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-r from-white via-rose-50/40 to-emerald-50/20 text-slate-900 p-3 sm:p-4 shadow-sm transition-all hover:border-rose-300 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="relative h-12 w-20 sm:h-14 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-rose-200 bg-white shadow-2xs">
              <img
                src={BANNER_IMAGE_URL}
                alt="Jirvinho Software World"
                className="h-full w-full object-cover object-left"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                  Matchday Sponsor
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden xs:inline">Official Partner</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
                Jirvinho Software World
              </h4>
              <p className="text-xs text-slate-600 truncate">
                Turning Ideas Into Digital Solutions • Web, Mobile &amp; Cloud IT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <a
              href={`https://wa.me/256700400063?text=${encodeURIComponent('Hello Jirvinho Software World! I am contacting you from the Match Centre.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">WhatsApp</span>
            </a>
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow transition-all"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 5. VIP PROMO PERK OFFER (Pure Light Mode)
  if (variant === 'promo') {
    return (
      <aside aria-label="VIP Partner Promo Offer" className={`relative overflow-hidden rounded-3xl border border-rose-200/90 bg-gradient-to-br from-white via-rose-50/40 to-slate-50 text-slate-900 shadow-md ${className}`}>
        {/* Glow & Badge Header - Pure Light Theme */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-rose-50 to-rose-100/70 border-b border-rose-200 text-rose-900 text-[11px] font-black uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600 animate-spin" />
            <span>VIP Member Partner Perk</span>
          </div>
          <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-black text-[10px] shadow-2xs">
            EXCLUSIVE OFFER
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-5 items-center">
            {/* Banner Preview */}
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative w-full md:w-5/12 aspect-[2/1] rounded-2xl overflow-hidden border border-rose-100 shadow-sm shrink-0 cursor-pointer bg-white"
            >
              <img
                src={BANNER_IMAGE_URL}
                alt="Jirvinho Software World VIP Offer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow-md border border-slate-200">
                  Click to View
                </span>
              </div>
            </a>

            {/* Offer Copy & CTA */}
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Trusted Technology Partner
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Building a Sports, Betting, or Custom Business App?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">Jirvinho Software World</span> offers high-performance website development, mobile apps, database architecture, and custom IT systems designed to scale your business.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <a
                  href={`https://wa.me/256700400063?text=${encodeURIComponent('Hello Jirvinho Software World! I am a SportsHub VIP member interested in your services.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href={TARGET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all"
                >
                  <span>Explore jirvinho-software-ug</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 6. DEFAULT FEATURED SHOWCASE (Pure Light Mode)
  return (
    <aside aria-label="Official Technology Partner" className={`relative overflow-hidden rounded-3xl border border-rose-200/90 bg-white shadow-[0_10px_30px_rgba(225,29,72,0.06)] transition-all hover:shadow-[0_14px_38px_rgba(225,29,72,0.1)] ${className}`}>
      {/* Top Header Badge - Pure Light Theme */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-rose-50 via-white to-rose-50/80 border-b border-rose-100 text-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
            {badgeText}
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-xs text-slate-600 font-bold hidden sm:inline">
            Jirvinho Software World
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded shadow-2xs">
            Partner Spotlight
          </span>
        </div>
      </div>

      {/* Main Image with Link */}
      <a
        href={TARGET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-[2/1] sm:aspect-[2.35/1] w-full overflow-hidden bg-slate-50 cursor-pointer"
        title="Open Jirvinho Software World website"
      >
        <img
          src={BANNER_IMAGE_URL}
          alt="Jirvinho Software World - Turning Ideas Into Digital Solutions"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Light Hover overlay hint */}
        <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-95 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-black shadow-xl border border-slate-200">
            <Globe className="w-4 h-4 text-rose-600" />
            Visit jirvinho-software-ug.vercel.app
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
      </a>

      {/* Detail Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-white to-rose-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Jirvinho Software World
              </h3>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                Tech Partner
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Turning Ideas Into Digital Solutions • Websites, Mobile Applications, Custom Software &amp; Cloud Infrastructure.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="inline-flex items-center gap-1 hover:text-rose-600 font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{PHONE_NUMBER} / {SECONDARY_PHONE}</span>
              </a>
              <span className="text-slate-300">•</span>
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="inline-flex items-center gap-1 hover:text-rose-600 font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>{EMAIL_ADDRESS}</span>
              </a>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <a
              href={`https://wa.me/256700400063?text=${encodeURIComponent('Hello Jirvinho Software World! I am contacting you from SportsHub.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Us</span>
            </a>
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-md hover:shadow-lg transition-all"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default JirvinhoAdBanner;
