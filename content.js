// Regular expressions for matching various data types
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g; // Basic international-ish format
const socialDomains = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  twitter: ["twitter.com", "x.com"],
  linkedin: ["linkedin.com"],
  youtube: ["youtube.com"],
  tiktok: ["tiktok.com"]
};

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

  // Combine and Deduplicate
  const combinedData = {
    emails: [...new Set([...textData.emails, ...linkData.emails])],
    phones: [...new Set([...textData.phones, ...linkData.phones])],
    socialMedia: {}
  };

  // For social media, we only extracted from links (usually more reliable than text for URLs)
  Object.keys(socialDomains).forEach(platform => {
    combinedData.socialMedia[platform] = [...new Set(linkData.socialMedia[platform] || [])];
  });

  // Send to background
  chrome.runtime.sendMessage({
    type: "EXTRACTED_DATA",
    payload: combinedData
  });
}

// Run immediately
scanAndSend();

// Optional: Run again if the DOM changes effectively (debounced) (Simulated simplified version)
let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(scanAndSend, 2000);
});
observer.observe(document.body, { childList: true, subtree: true });