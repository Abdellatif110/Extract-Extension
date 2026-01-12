// Connect to background script
const port = chrome.runtime.connect({ name: "popup" });

// Request data when popup opens
port.postMessage({ type: "GET_DATA" });

// Handle incoming data
port.onMessage.addListener((msg) => {
  if (msg.type === "DATA") {
    displayData(msg.data);
  }
});

// Display the extracted data
function displayData(data) {
  if (!data) {
    document.getElementById('emails').innerHTML = '<div class="no-data">No data found for this tab. Try refreshing.</div>';
    document.getElementById('phones').innerHTML = '';
    document.getElementById('social-media').innerHTML = '';
    return;
  }

  displayItems('emails', data.emails);
  displayItems('phones', data.phones);
  displaySocialMedia(data.socialMedia);
}

function displayItems(elementId, items) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-data">None found</div>';
    return;
  }

  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'data-item';

    const textElement = document.createElement('span');
    textElement.textContent = item;
    textElement.title = item; // Tooltip for long text

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(item);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    };

    itemElement.appendChild(textElement);
    itemElement.appendChild(copyBtn);
    container.appendChild(itemElement);
  });
}

function displaySocialMedia(socialMedia) {
  const container = document.getElementById('social-media');
  container.innerHTML = '';

  let hasData = false;

  for (const [platform, links] of Object.entries(socialMedia)) {
    if (links.length > 0) {
      hasData = true;
      const platformHeader = document.createElement('h3');
      platformHeader.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
      container.appendChild(platformHeader);

      const listContainer = document.createElement('div');
      listContainer.id = `social-${platform}`; // Unique ID for consistency logic, though not used by displayItems direct call here

      // We'll reuse displayItems logic or custom logic. 
      // displayItems adds to an ID, but here we want to append directly. 
      // Let's modify displayItems or write a loop here. 
      // Re-using displayItems requires the element to be in DOM.
      container.appendChild(listContainer);
      displayItemsHelper(listContainer, links);
    }
  }

  if (!hasData) {
    container.innerHTML = '<div class="no-data">None found</div>';
  }
}

// Helper since displayItems by ID was rigid
function displayItemsHelper(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-data">None found</div>';
    return;
  }

  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'data-item';

    const textElement = document.createElement('span');
    textElement.textContent = item;
    textElement.title = item;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(item);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    };

    itemElement.appendChild(textElement);
    itemElement.appendChild(copyBtn);
    container.appendChild(itemElement);
  });
}