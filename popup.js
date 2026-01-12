// Connect to background script
const port = chrome.runtime.connect({ name: "popup" });

let currentData = null;

// Request data when popup opens
port.postMessage({ type: "GET_DATA" });

// Load settings
const urlInput = document.getElementById('sheet-script-url');
const saveSettingsBtn = document.getElementById('save-settings');

chrome.storage.local.get(['sheetScriptUrl'], (result) => {
  if (result.sheetScriptUrl) {
    urlInput.value = result.sheetScriptUrl;
  }
});

saveSettingsBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (url) {
    chrome.storage.local.set({ sheetScriptUrl: url }, () => {
      showStatus('Settings saved!', 'green');
    });
  }
});

// Handle incoming data
port.onMessage.addListener((msg) => {
  if (msg.type === "DATA") {
    currentData = msg.data;
    displayData(msg.data);
  }
});

// Export CSV
document.getElementById('export-csv').addEventListener('click', () => {
  if (!currentData) return;
  const csvContent = generateCSV(currentData);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `extracted_data_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Save to Sheet
document.getElementById('save-sheet').addEventListener('click', () => {
  if (!currentData) {
    showStatus('No data to save', 'red');
    return;
  }

  if (!urlInput.value.trim()) {
    showStatus('Please set Google Apps Script URL in settings', 'red');
    document.querySelector('details').open = true;
    return;
  }

  // Pass true to format for Google Sheets (avoids formula errors with +)
  const payload = prepareRowData(currentData, true);

  showStatus('Saving...', 'blue');

  fetch(urlInput.value.trim(), {
    method: 'POST',
    mode: 'no-cors', // Important for Google Apps Script Web App
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
    .then(() => {
      showStatus('Sent to Google Sheet!', 'green');
    })
    .catch(err => {
      console.error(err);
      showStatus('Error sending data', 'red');
    });
});

function showStatus(msg, color) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.style.color = color || 'black';
  setTimeout(() => el.textContent = '', 3000);
}

function prepareRowData(data, forSheet = false) {
  // Format: Name, Full-Number, Email, facebook, instagram, Youtube, les autre Social Media
  const facebook = (data.socialMedia.facebook || []).join(', ');
  const instagram = (data.socialMedia.instagram || []).join(', ');
  const youtube = (data.socialMedia.youtube || []).join(', ');

  // Others
  const others = [
    ...(data.socialMedia.twitter || []),
    ...(data.socialMedia.linkedin || []),
    ...(data.socialMedia.tiktok || [])
  ].join(', ');

  // We combine Name and URL to fit the "Name" column requirement while providing the "siteweb" (URL) info.
  const nameField = data.name
    ? `${data.name} (${data.url})`
    : data.url;

  let numberField = data.phones.join(', ');

  // FIX: Prepend ' for Google Sheets to prevent it from interpreting +123 as a formula
  if (forSheet && numberField.length > 0) {
    numberField = "'" + numberField;
  }

  return {
    name: nameField,
    number: numberField,
    email: data.emails.join(', '),
    facebook: facebook,
    instagram: instagram,
    youtube: youtube,
    others: others
  };
}

function generateCSV(data) {
  const row = prepareRowData(data, false);
  const headers = ["Name", "Full-Number", "Email", "facebook", "instagram", "Youtube", "les autre Social Media"];
  const values = [
    `"${row.name.replace(/"/g, '""')}"`,
    `"${row.number.replace(/"/g, '""')}"`,
    `"${row.email.replace(/"/g, '""')}"`,
    `"${row.facebook.replace(/"/g, '""')}"`,
    `"${row.instagram.replace(/"/g, '""')}"`,
    `"${row.youtube.replace(/"/g, '""')}"`,
    `"${row.others.replace(/"/g, '""')}"`
  ];
  return headers.join(",") + "\n" + values.join(",");
}

// Display the extracted data
function displayData(data) {
  if (!data) {
    document.getElementById('emails').innerHTML = '<div class="no-data">No data found for this tab. Try refreshing.</div>';
    document.getElementById('phones').innerHTML = '';
    document.getElementById('social-media').innerHTML = '';
    document.getElementById('page-name').textContent = '';
    document.getElementById('page-url').textContent = '';
    return;
  }

  document.getElementById('page-name').textContent = data.name || 'Not Detected';
  document.getElementById('page-url').textContent = data.url || '';
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