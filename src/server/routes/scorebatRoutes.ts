import { Router } from "express";

const router = Router();

// Proxy ScoreBat Embed to prevent opening new tabs outside the app
// and force all hamburger menu league navigations to remain within the iframe
router.get("/proxy", async (req, res) => {
  try {
    let targetPath = (req.query.path as string) || "/embed/livescore/";
    let targetUrl = req.query.url as string;

    if (!targetUrl) {
      if (!targetPath.startsWith("/")) {
        targetPath = `/${targetPath}`;
      }
      targetUrl = `https://www.scorebat.com${targetPath}`;
    }

    // Security check: only proxy scorebat.com
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith("scorebat.com")) {
      return res.status(403).send("Forbidden domain");
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch from ScoreBat: ${response.statusText}`);
    }

    let html = await response.text();

    // Ensure all relative assets resolve against scorebat.com
    if (!html.includes("<base ")) {
      html = html.replace("<head>", '<head>\n<base href="https://www.scorebat.com/">');
    }

    // Inject in-app navigation script to intercept link clicks and keep user within the app
    const inAppScript = `
<script>
(function() {
  function routeScoreBatUrl(rawUrl) {
    try {
      var u = new URL(rawUrl, window.location.href);
      var pathname = u.pathname;

      // When user clicks leagues in the 3-line hamburger menu:
      // (e.g. /premier-league-live-stream/, /la-liga-live-stream/, /champions-league-live-stream/)
      var leagueMatch = pathname.match(/\\/([a-z0-9-]+)-(live-stream|livescore)\\/?/);
      if (leagueMatch) {
        window.location.href = '/api/scorebat/proxy?path=/embed/' + leagueMatch[1] + '/';
        return;
      }

      // If it is already an embed URL
      if (pathname.startsWith('/embed/')) {
        window.location.href = '/api/scorebat/proxy?path=' + pathname;
        return;
      }

      // Any other ScoreBat internal page
      if (u.hostname.indexOf('scorebat.com') !== -1) {
        window.location.href = '/api/scorebat/proxy?url=' + encodeURIComponent(u.href);
        return;
      }

      window.location.href = u.href;
    } catch(err) {
      console.warn("Navigation route error:", err);
      window.location.href = rawUrl;
    }
  }

  // Override window.open so popup calls stay in this frame
  window.open = function(url) {
    if (url) {
      routeScoreBatUrl(url);
    }
    return window;
  };

  // Intercept anchor clicks in capture phase to prevent target="_blank" new tabs
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a) {
      var href = a.getAttribute('href') || a.href;
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        a.target = '_self';
        routeScoreBatUrl(href);
        return false;
      }
    }
  }, true);
})();
</script>
`;

    // Inject script right after <head>
    html = html.replace("<head>", `<head>${inAppScript}`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Allow framing from own origin
    res.removeHeader("X-Frame-Options");
    return res.send(html);
  } catch (err: any) {
    console.error("ScoreBat proxy error:", err);
    return res.status(500).send("Error loading livescore widget");
  }
});

export default router;
