// Regular expressions for matching various data types
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g; // Basic international-ish format
const socialDomains = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  youtube: ["youtube.com"],
  // Others will be grouped
  twitter: ["twitter.com", "x.com"],
  linkedin: ["linkedin.com"],
  tiktok: ["tiktok.com"]
};

function extractName() {
  // Try Open Graph Site Name
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName && ogSiteName.content) return ogSiteName.content;

  // Try H1
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText.length > 0 && h1.innerText.length < 50) return h1.innerText.trim();

  // Fallback to Title
  const title = document.title.split(/[-|]/)[0].trim();
  if (title) return title;

  // Final fallback: Hostname
  return window.location.hostname;
}

function extractFromSelectors() {
  const emails = [];
  const phones = [];
  const socialMedia = {};

  // Initialize social media arrays
  Object.keys(socialDomains).forEach(key => socialMedia[key] = []);

  // 1. Selector-based Email Extraction
  // Look for mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    const email = a.href.replace("mailto:", "").split("?")[0];
    if (email) emails.push(email);
  });
  // Look for structured data (itemprop)
  document.querySelectorAll('[itemprop="email"]').forEach(el => {
    if (el.textContent) emails.push(el.textContent.trim());
  });

  // 2. Selector-based Phone Extraction
  // Look for tel links
  document.querySelectorAll('a[href^="tel:"]').forEach(a => {
    const phone = a.href.replace("tel:", "").split("?")[0];
    if (phone) phones.push(phone);
  });
  // Look for structured data
  document.querySelectorAll('[itemprop="telephone"]').forEach(el => {
    if (el.textContent) phones.push(el.textContent.trim());
  });

  // 3. Social Media (Link based)
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.href;
    let urlObj;
    try {
      urlObj = new URL(href);
    } catch (e) { return; }

    for (const [platform, domains] of Object.entries(socialDomains)) {
      if (domains.some(d => urlObj.hostname.includes(d))) {
        socialMedia[platform].push(href);
      }
    }
  });

  return { emails, phones, socialMedia };
}

function scanAndSend() {
  const data = extractFromSelectors();
  const name = extractName();
  const url = window.location.href;

  // Combine and Deduplicate
  const combinedData = {
    name: name,
    url: url,
    emails: [...new Set(data.emails)],
    phones: [...new Set(data.phones)],
    socialMedia: {}
  };

  // Deduplicate social media
  Object.keys(socialDomains).forEach(platform => {
    combinedData.socialMedia[platform] = [...new Set(data.socialMedia[platform] || [])];
  });

  // Send to background safely
  try {
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated");
    }
    chrome.runtime.sendMessage({
      type: "EXTRACTED_DATA",
      payload: combinedData
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Ignore errors that proceed from the background script not being ready yet or closed
        console.debug("Background communication error:", chrome.runtime.lastError.message);
      }
    });
  } catch (e) {
    console.log("Extension context invalidated. Stopping observer.");
    if (observer) observer.disconnect();
  }
}

// Run immediately
scanAndSend();

// Optional: Run again if the DOM changes effectively (debounced)
let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(scanAndSend, 2000);
});
observer.observe(document.body, { childList: true, subtree: true });