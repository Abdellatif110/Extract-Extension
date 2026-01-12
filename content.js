// Social media platform definitions
const socialDomains = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  youtube: ["youtube.com"],
  twitter: ["twitter.com", "x.com"],
  linkedin: ["linkedin.com"],
  tiktok: ["tiktok.com"],
  pinterest: ["pinterest.com"],
  snapchat: ["snapchat.com"],
  whatsapp: ["whatsapp.com", "wa.me"],
  telegram: ["telegram.me", "t.me"]
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
  const emails = new Set();
  const phones = new Set();
  const socialMedia = {};

  // Initialize social media arrays
  Object.keys(socialDomains).forEach(key => socialMedia[key] = []);

  // ========== EMAIL EXTRACTION ==========
  // Mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    const email = a.href.replace("mailto:", "").split("?")[0];
    if (email && email.includes('@')) emails.add(email);
  });

  // Schema.org structured data
  document.querySelectorAll('[itemprop="email"]').forEach(el => {
    const text = (el.textContent || el.getAttribute('content') || '').trim();
    if (text && text.includes('@')) emails.add(text);
  });

  // Data attributes
  document.querySelectorAll('[data-email], [data-mail]').forEach(el => {
    const emailData = el.getAttribute('data-email') || el.getAttribute('data-mail');
    if (emailData && emailData.includes('@')) emails.add(emailData);
  });

  // Common class patterns
  document.querySelectorAll('.email, .e-mail, .u-email, [class*="email"]').forEach(el => {
    const text = el.textContent.trim();
    if (text && text.includes('@') && !text.includes(' ') && text.length < 100) {
      emails.add(text);
    }
  });

  // ========== PHONE EXTRACTION ==========
  // Tel links
  document.querySelectorAll('a[href^="tel:"], a[href^="callto:"]').forEach(a => {
    const phone = a.href.replace("tel:", "").replace("callto:", "").split("?")[0];
    if (phone) phones.add(phone);
  });

  // Schema.org structured data
  document.querySelectorAll('[itemprop="telephone"], [itemprop="phone"], [itemprop="faxNumber"]').forEach(el => {
    const text = (el.textContent || el.getAttribute('content') || '').trim();
    if (text) phones.add(text);
  });

  // Data attributes
  document.querySelectorAll('[data-phone], [data-tel], [data-telephone]').forEach(el => {
    const phoneData = el.getAttribute('data-phone') || el.getAttribute('data-tel') || el.getAttribute('data-telephone');
    if (phoneData) phones.add(phoneData);
  });

  // Common class patterns
  document.querySelectorAll('.tel, .phone, .u-tel, .p-tel, [class*="phone"], [class*="tel"]').forEach(el => {
    const text = el.textContent.trim();
    // Basic validation: contains numbers and common phone chars
    if (text && /[\d\s\-\+\(\)]+/.test(text) && text.length < 30) {
      phones.add(text);
    }
  });

  // ARIA labels with phone
  document.querySelectorAll('[aria-label*="phone" i], [aria-label*="tel" i]').forEach(el => {
    const text = el.textContent.trim();
    if (text && /[\d\s\-\+\(\)]+/.test(text) && text.length < 30) {
      phones.add(text);
    }
  });

  // ========== SOCIAL MEDIA EXTRACTION ==========
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

  // Also check sameAs schema.org property (often used for social profiles)
  document.querySelectorAll('[itemprop="sameAs"]').forEach(el => {
    const url = el.getAttribute('href') || el.getAttribute('content') || el.textContent.trim();
    if (!url) return;

    try {
      const urlObj = new URL(url);
      for (const [platform, domains] of Object.entries(socialDomains)) {
        if (domains.some(d => urlObj.hostname.includes(d))) {
          socialMedia[platform].push(url);
        }
      }
    } catch (e) { }
  });

  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
    socialMedia
  };
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