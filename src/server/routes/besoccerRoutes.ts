import { Router } from "express";
import https from "https";
import http from "http";

const router = Router();

// Follow redirects automatically and send valid subscription cookies
function fetchBeSoccer(pathStr: string, redirectCount = 0): Promise<{ statusCode: number; html: string }> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error("Too many redirects from BeSoccer"));
    }

    const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    const options = {
      hostname: "www.besoccer.com",
      path: cleanPath,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.besoccer.com/",
        // Preset cookies so BeSoccer server-side considers this session subscribed and cookies accepted
        Cookie: "subscription=active; bs_consent=1; noCookiesAccepted=1; euconsent-v2=CP_ok; bs_geo=de|200|HE"
      }
    };

    const req = https.request(options, (res) => {
      // Handle redirects (e.g. 301, 302, 307, 308)
      if (
        (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) &&
        res.headers.location
      ) {
        try {
          const loc = res.headers.location;
          let newPath = loc;
          if (loc.startsWith("http")) {
            const parsed = new URL(loc);
            newPath = parsed.pathname + parsed.search;
          }
          return resolve(fetchBeSoccer(newPath, redirectCount + 1));
        } catch (e) {
          // If URL parse fails, continue
        }
      }

      let data = "";
      res.setEncoding("utf-8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode || 200, html: data });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error("BeSoccer request timed out"));
    });

    req.end();
  });
}

// Proxy BeSoccer to completely bypass third-party cookie restrictions,
// neutralize InMobi CMP error popups, strip ads, and enable seamless navigation
router.get("/proxy", async (req, res) => {
  try {
    let targetPath = (req.query.path as string) || "/livescore";
    if (!targetPath.startsWith("/")) {
      targetPath = `/${targetPath}`;
    }

    const { statusCode, html: rawHtml } = await fetchBeSoccer(targetPath);

    if (statusCode >= 400 || !rawHtml) {
      return res.status(statusCode || 500).send("Failed to load BeSoccer feed.");
    }

    let html = rawHtml;

    // 1. Ensure all assets, stylesheets, scripts, and team badges load from besoccer.com
    if (!html.includes("<base ")) {
      html = html.replace("<head>", '<head>\n<base href="https://www.besoccer.com/">');
    }

    // 2. Strip CMP and Cookie-blocker scripts (InMobi Choice, Quantcast, noCookies.js, adIframeGuard.js)
    html = html.replace(/<!-- InMobi Choice[\s\S]*?<\/script>/gi, "<!-- InMobi Choice bypassed -->");
    html = html.replace(/<script[^>]*src=[\"'][^\"']*(?:inmobi|quantcast|choice\.js|noCookies\.js)[^\"']*[\"'][^>]*><\/script>/gi, "<!-- CMP script bypassed -->");
    html = html.replace(/<script[\s\S]*?(?:cmp\.inmobi\.com|choice\.js|noCookies\.js)[\s\S]*?<\/script>/gi, "<!-- CMP inline script bypassed -->");
    html = html.replace(/<script[^>]*adIframeGuard[^>]*><\/script>/gi, "<!-- adIframeGuard bypassed -->");
    html = html.replace(/<script[^>]*adk-init[^>]*><\/script>/gi, "<!-- adk-init bypassed -->");
    html = html.replace(/loadScript\(['"][^'"]*noCookies[^'"]*['"]\);?/gi, "");

    // 3. Strip ad scripts, anti-iframe blockers, and tracking networks
    html = html.replace(/<script[^>]*src=[\"'][^\"']*(?:google-analytics|googletagservices|doubleclick|criteo|amazon-adsystem|adkaora|imasdk|prebid|adnxs|smartadserver|taboola|outbrain|teads|pubmatic|casalemedia)[^\"']*[\"'][^>]*><\/script>/gi, "<!-- ad-script-blocked -->");
    html = html.replace(/<ins[^>]*class=[\"'][^\"']*adsbygoogle[^\"']*[\"'][^>]*>.*?<\/ins>/gi, "<!-- ad-ins-blocked -->");

    // 4. Force BeSoccer inline script subscriptionCookie variable to 'active'
    html = html.replace(/let subscriptionCookie = '';/g, "let subscriptionCookie = 'active';");

    // 5. Inject client environment fixes: Cookies, TCF/USP CMP stubs, Ad mocks, and in-app navigation router
    const injectedFix = `
<script>
(function() {
  try {
    // A. Intercept and proxy document.cookie in memory so cookie checks NEVER fail inside iframe
    var cookieJar = {};
    try {
      var raw = document.cookie || "";
      if (raw) {
        raw.split(';').forEach(function(pair) {
          var parts = pair.split('=');
          if (parts[0]) cookieJar[parts[0].trim()] = parts.slice(1).join('=');
        });
      }
    } catch(e) {}

    // Preset essential tokens
    cookieJar["subscription"] = "active";
    cookieJar["bs_consent"] = "1";
    cookieJar["noCookiesAccepted"] = "1";
    cookieJar["euconsent-v2"] = "CP_ok";
    cookieJar["bs_geo"] = "de|200|HE";
    cookieJar["cookie_test"] = "1";
    cookieJar["test"] = "1";

    try {
      var originalCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                               Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

      Object.defineProperty(document, 'cookie', {
        get: function() {
          var res = [];
          for (var k in cookieJar) {
            res.push(k + '=' + cookieJar[k]);
          }
          return res.join('; ');
        },
        set: function(val) {
          if (!val) return;
          var parts = val.split(';')[0].split('=');
          var key = parts[0] ? parts[0].trim() : '';
          var value = parts.slice(1).join('=');
          if (key) {
            cookieJar[key] = value;
          }
          if (originalCookieDesc && originalCookieDesc.set) {
            try { originalCookieDesc.set.call(document, val); } catch(e) {}
          }
        },
        configurable: true
      });
    } catch(e) {}

    // Ensure navigator.cookieEnabled is unconditionally true
    try {
      Object.defineProperty(navigator, 'cookieEnabled', {
        get: function() { return true; },
        configurable: true
      });
    } catch(e) {}

    // Ensure localStorage and sessionStorage never throw SecurityError
    try {
      var testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
    } catch(e) {
      var memStore = {};
      try {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: function(k) { return memStore[k] !== undefined ? memStore[k] : null; },
            setItem: function(k, v) { memStore[k] = String(v); },
            removeItem: function(k) { delete memStore[k]; },
            clear: function() { memStore = {}; },
            get length() { return Object.keys(memStore).length; },
            key: function(i) { return Object.keys(memStore)[i] || null; }
          },
          configurable: true
        });
      } catch(e2) {}
    }

    // B. Mock TCF and USP Consent APIs so any script checking CMP gets immediate approval
    window.__tcfapi = function(command, version, callback) {
      if (typeof callback === 'function') {
        callback({
          gdprApplies: false,
          eventStatus: 'tcloaded',
          cmpLoaded: true,
          cmpStatus: 'loaded',
          purpose: { consents: {} },
          vendor: { consents: {} }
        }, true);
      }
    };
    window.__uspapi = function(command, version, callback) {
      if (typeof callback === 'function') {
        callback({ uspString: '1---' }, true);
      }
    };

    // C. Mock ad networks so caller scripts do not fail or try fallback ads
    window.googletag = window.googletag || {
      cmd: [],
      display: function() {},
      pubads: function() {
        return {
          addEventListener: function() {},
          clear: function() {},
          collapseEmptyDivs: function() {},
          disableInitialLoad: function() {},
          enableSingleRequest: function() {},
          enableAsyncRendering: function() {},
          refresh: function() {},
          setTargeting: function() {},
          setCategoryExclusion: function() {},
          setCentering: function() {},
          setCookieOptions: function() {}
        };
      },
      defineSlot: function() {
        return {
          addService: function() { return this; },
          setTargeting: function() { return this; },
          setCollapseEmptyDiv: function() { return this; }
        };
      },
      enableServices: function() {}
    };
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push = function(fn) {
      if (typeof fn === 'function') {
        try { fn(); } catch(e) {}
      }
      return 1;
    };

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push = function() { return 1; };
    window.pbjs = window.pbjs || { que: [] };
    
    // D. Neutralize frame-busting
    try {
      Object.defineProperty(window, 'top', { get: function() { return window.self; } });
      Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
    } catch(e) {}

    // E. In-app navigation router: Keeps ALL link clicks (matches, dates, teams, leagues) inside the proxy
    document.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (!a) return;

      var href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      try {
        var url = new URL(a.href, window.location.href);
        // If clicking within besoccer.com or relative path, navigate through proxy
        if (url.hostname.includes('besoccer.com') || url.hostname === window.location.hostname) {
          e.preventDefault();
          e.stopPropagation();
          var path = url.pathname + url.search;
          window.location.href = '/api/besoccer/proxy?path=' + encodeURIComponent(path);
        }
      } catch(err) {
        console.warn("Proxy routing navigation:", err);
      }
    }, true);

    // F. Strip target="_blank" from links so they don't break out into popups or trigger browser cookie warnings
    function sanitizeLinks() {
      try {
        var links = document.querySelectorAll('a[target]');
        for (var i = 0; i < links.length; i++) {
          links[i].removeAttribute('target');
        }
      } catch(e) {}
    }

    // G. Real-time Ad & CMP purger + Cookie Warning Eliminator
    var adSelectors = [
      '[id^="div-gpt-ad"]',
      '[id*="google_ads"]',
      'iframe[src*="google"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="adnxs"]',
      'iframe[src*="criteo"]',
      'ins.adsbygoogle',
      '.banner-bet',
      '.ad-container',
      '.ad-slot',
      '.pub-box',
      '.sponsor-box',
      '.app-download-banner',
      '#popup_radio',
      '[id^="radio-rewarded"]',
      '#qc-cmp2-container',
      '.qc-cmp2-container',
      '.qc-cmp-cleanslate',
      '[class*="qc-cmp"]',
      '#inmobi-choice',
      '.inmobi-choice'
    ].join(',');

    function purgeAdsAndWarnings() {
      try {
        var ads = document.querySelectorAll(adSelectors);
        for (var i = 0; i < ads.length; i++) {
          ads[i].remove();
        }
        sanitizeLinks();

        // Search for and eliminate any cookie warning prompts
        var candidates = document.querySelectorAll('div, section, article, p, dialog');
        for (var j = 0; j < candidates.length; j++) {
          var el = candidates[j];
          var text = el.textContent || '';
          if (text.includes('cookies are disabled in your browser') || text.includes('Please enable cookies to continue')) {
            var modal = el.closest('[class*="modal"], [class*="popup"], [class*="overlay"], [class*="dialog"]') || el;
            modal.remove();
          }
        }
      } catch(e) {}
    }

    // H. Keep dates and sub-filter bar (all, televised, live) always active and visible
    function ensureDatesAndFilterBar() {
      try {
        var daysTab = document.querySelectorAll('.panel.days-tab, .days-tab, .menu-types');
        for (var i = 0; i < daysTab.length; i++) {
          daysTab[i].style.setProperty('display', 'block', 'important');
          daysTab[i].style.setProperty('visibility', 'visible', 'important');
          daysTab[i].style.setProperty('opacity', '1', 'important');
        }
        var fixedMenu = document.querySelectorAll('.fixed-menu, #mod_sticky, .new-sticky');
        for (var j = 0; j < fixedMenu.length; j++) {
          fixedMenu[j].style.setProperty('display', 'none', 'important');
        }
      } catch(e) {}
    }

    function runAllFixes() {
      purgeAdsAndWarnings();
      ensureDatesAndFilterBar();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runAllFixes);
    } else {
      runAllFixes();
    }

    window.addEventListener('load', runAllFixes);

    var observer = new MutationObserver(function(mutations) {
      runAllFixes();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

  } catch(e) {
    console.warn("Proxy AdBlock / Cookie handler:", e);
  }
})();
</script>
<style>
/* Universal Ad & CMP Blocker Stylesheet */
#qc-cmp2-container,
.qc-cmp2-container,
.qc-cmp-cleanslate,
[class*="qc-cmp"],
#inmobi-choice,
.inmobi-choice,
#didomi-host,
.didomi-popup-container,
.qc-cmp2-container,
#onetrust-consent-sdk,
.cookie-banner,
.no-cookies-modal,
[id^="div-gpt-ad"],
[id*="google_ads"],
[id*="-ad-slot"],
[id*="banner-bet"],
[class*="banner-bet"],
[class*="ad-container"],
[class*="ad_slot"],
.banner,
.banner-bet,
.ad-container,
.ad-slot,
.ad-box,
.ad-wrapper,
.ad_unit,
.publi,
.publicidad,
.advertising,
.advertisement,
.adsbygoogle,
.sponsor-box,
.sponsorship,
.app-download-banner,
.radio-popup,
.rr-ad-blocker,
iframe[id*="google_ads"],
iframe[src*="doubleclick"],
iframe[src*="adnxs"],
iframe[src*="criteo"],
iframe[src*="amazon-ad"],
#popup_radio,
[id^="radio-rewarded"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  max-height: 0 !important;
  min-height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

/* Remove blur from header/footer that InMobi / CMP attaches */
header.bet-blur,
footer.bet-blur,
.bet-blur {
  filter: none !important;
}

/* Hide BeSoccer top website header so the match dates bar appears cleanly at the top */
header.header-search,
header.header,
#header {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Hide the duplicate fixed-menu overlay and ads that obscure the dates and filters on mobile */
.fixed-menu,
.fixed-menu.top,
.fixed-menu.bottom,
#mod_sticky,
.new-sticky,
#BS_MOBILE_STICKY_PARENT,
#BS_DESKTOP_STICKY_PARENT {
  display: none !important;
  height: 0 !important;
  pointer-events: none !important;
}

/* Override BeSoccer mobile media query (max-width: 1023px) that sets .panel.days-tab { display: none } */
.matches .panel.days-tab,
.panel.days-tab,
div.days-tab {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

.matches .days-tab .panel-head,
.panel.days-tab .panel-head {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
}

.matches .days-tab .panel-head .panel-tab,
.panel.days-tab .panel-head .panel-tab {
  display: flex !important;
  width: 100% !important;
  overflow-x: auto !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Ensure the match filter bar below the dates (all, televised, live) is ALWAYS visible, styled, and centered */
.matches .days-tab .menu-types,
div.menu-types {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: #ffffff !important;
  border-top: 1px solid #e5e7eb !important;
  border-bottom: 1px solid #e5e7eb !important;
  padding: 8px 12px !important;
  margin: 0 !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
}

.matches .days-tab .menu-types ul,
div.menu-types ul {
  display: flex !important;
  align-items: center !important;
  justify-content: space-around !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
  gap: 12px !important;
}

.matches .days-tab .menu-types li,
div.menu-types li {
  display: inline-flex !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 0 !important;
}

.matches .days-tab .menu-types a,
div.menu-types a {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #374151 !important;
  text-decoration: none !important;
  padding: 4px 10px !important;
  border-radius: 9999px !important;
  transition: all 0.15s ease !important;
}

.matches .days-tab .menu-types a:hover,
div.menu-types a:hover {
  background: #f3f4f6 !important;
  color: #111827 !important;
}

/* Force count circle pills (green for all, grey for televised, red for live) to always show */
.matches .days-tab .circle,
.matches .days-tab .menu-types .circle,
div.menu-types .circle,
div.menu-types span.circle {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 22px !important;
  height: 20px !important;
  padding: 0 6px !important;
  border-radius: 9999px !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  margin-left: 6px !important;
  box-sizing: border-box !important;
}

.matches .days-tab .circle.green,
div.menu-types .circle.green {
  background-color: #2e7d32 !important;
  color: #ffffff !important;
  border: 1px solid #1b5e20 !important;
}

.matches .days-tab .circle.red,
div.menu-types .circle.red {
  background-color: #d32f2f !important;
  color: #ffffff !important;
  border: 1px solid #b71c1c !important;
}

.matches .days-tab .circle:not(.green):not(.red),
div.menu-types .circle:not(.green):not(.red) {
  background-color: #f3f4f6 !important;
  color: #374151 !important;
  border: 1px solid #d1d5db !important;
}
</style>
`;
    html = html.replace("</head>", `${injectedFix}\n</head>`);

    // Set cookies in response header tailored for iframe security policies
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    const sameSitePolicy = isSecure ? "SameSite=None; Secure" : "SameSite=Lax";
    res.setHeader("Set-Cookie", [
      `subscription=active; Path=/; ${sameSitePolicy}`,
      `bs_consent=1; Path=/; ${sameSitePolicy}`,
      `noCookiesAccepted=1; Path=/; ${sameSitePolicy}`,
      `euconsent-v2=CP_ok; Path=/; ${sameSitePolicy}`
    ]);
    res.setHeader("Permissions-Policy", "storage-access=(self), cross-origin-isolated=(self)");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    return res.send(html);
  } catch (error: any) {
    console.error("BeSoccer proxy error:", error?.message || error);
    return res.status(502).send("Unable to load BeSoccer match feed at this moment.");
  }
});

export default router;
