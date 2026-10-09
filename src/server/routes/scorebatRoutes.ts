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

    // Clean CSS to hide only branding headers and external footer links without deleting React DOM nodes
    const inAppScript = `
<style id="scorebat-clean-styles">
  /* Cleanly hide the ScoreBat top branding bar and footer links while preserving match cards */
  div._36895710,
  div[class*="_36895710"],
  header,
  .WidgetFt,
  .WidgetFtB,
  .WidgetBy {
    display: none !important;
    visibility: hidden !important;
    height: 0px !important;
    max-height: 0px !important;
    padding: 0px !important;
    margin: 0px !important;
    overflow: hidden !important;
  }

  /* Reset content container top padding so matches start right at top */
  div._8736d9fb,
  div[class*="_8736d9fb"] {
    padding-top: 0px !important;
    top: 0px !important;
  }
</style>
`;

    // Inject script right after <head>
    html = html.replace("<head>", `<head>${inAppScript}`);

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      res.setHeader("Set-Cookie", setCookie);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Allow framing and full video playback capabilities
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' *");
    res.setHeader("Permissions-Policy", "autoplay=(self '*'), fullscreen=(self '*'), picture-in-picture=(self '*')");
    return res.send(html);
  } catch (err: any) {
    console.error("ScoreBat proxy error:", err);
    return res.status(500).send("Error loading livescore widget");
  }
});

export default router;
