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

function extractFromText() {
  const text = document.body.innerText;
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  return { emails, phones };
}

function extractFromHrefs() {
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const emails = [];
  const phones = [];
  const socialMedia = {};

  // Initialize social media arrays
  Object.keys(socialDomains).forEach(key => socialMedia[key] = []);

  anchors.forEach(a => {
    const href = a.href;

    // Email (mailto)
    if (href.startsWith("mailto:")) {
      emails.push(href.replace("mailto:", "").split("?")[0]);
    }

    // Phone (tel)
    if (href.startsWith("tel:")) {
      phones.push(href.replace("tel:", ""));
    }

    // Social Media
    let urlObj;
    try {
      urlObj = new URL(href);
    } catch (e) { return; } // Invalid URL

    for (const [platform, domains] of Object.entries(socialDomains)) {
      if (domains.some(d => urlObj.hostname.includes(d))) {
        socialMedia[platform].push(href);
      }
    }
  });

  return { emails, phones, socialMedia };
}

function scanAndSend() {
  const textData = extractFromText();
  const linkData = extractFromHrefs();
  const name = extractName();
  const url = window.location.href;

  // Combine and Deduplicate
  const combinedData = {
    name: name,
    url: url,
    emails: [...new Set([...textData.emails, ...linkData.emails])],
    phones: [...new Set([...textData.phones, ...linkData.phones])],
    socialMedia: {}
  };

  // For social media, we only extracted from links
  Object.keys(socialDomains).forEach(platform => {
    combinedData.socialMedia[platform] = [...new Set(linkData.socialMedia[platform] || [])];
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