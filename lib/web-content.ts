import puppeteer, { Browser } from "puppeteer-core";
import { getUserAgent } from "./userAgents";
import { htmlToText } from "html-to-text";
import chromium from "@sparticuz/chromium-min";

// Use the stealth plugin to avoid detection

async function fetchPlainTextContentBrowser(url: string): Promise<string> {
  const htmlContent = await fetchPageContent(url);
  const plainText = htmlToText(htmlContent, {
    wordwrap: 130,
  });
  return plainText;
}

async function fetchPageContent(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: chromium.headless, // Set to false if you want to see the browser in action
    ignoreHTTPSErrors: true,
    executablePath: await chromium.executablePath(
      `https://fritzprix.github.io/assets/chromium-126-pack.tar`
    ),
    args: [
      ...chromium.args,
      "--hide-scrollbars",
      "--disable-web-security",
      `--user-agent=${getUserAgent()}`,
    ],
  });

  const page = await browser.newPage();

  // Set a custom user-agent
  await page.setUserAgent(getUserAgent());

  // Set viewport size
  await page.setViewport({
    width: 1280,
    height: 800,
  });
  await page.setJavaScriptEnabled(true);

  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.google.com/",
  });

  // Enable plugins and languages
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5], // Mimic having plugins installed
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Get page content
    const content = await page.content();
    return content;
  } catch (error: any) {
    console.error(`Failed to fetch page content: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

export { fetchPageContent, fetchPlainTextContentBrowser };
