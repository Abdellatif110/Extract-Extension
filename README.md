# DataSniffer Extension

A browser extension to extract emails, phone numbers, and social media links from websites.

## Development Setup

1. Open Chrome/Edge/Brave.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select this folder (`Project-Extract`).

## Features

- Extracts emails using regex and `mailto:` links.
- Extracts phone numbers using regex and `tel:` links.
- Identifies social media profiles (Facebook, Instagram, Twitter/X, LinkedIn, etc).
- Displays data in a popup with a "Copy" button.

## Structure

- `manifest.json`: Configuration.
- `content.js`: Script injected into pages to scrape data.
- `background.js`: Manages data storage per tab.
- `popup.html/js/css`: The user interface.
