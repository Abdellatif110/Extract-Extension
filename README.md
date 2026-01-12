# DataSniffer Extension

A browser extension to extract emails, phone numbers, and social media links from websites.

## Development Setup

1. Open Chrome/Edge/Brave.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select this folder (`Project-Extract`).

## Features

- **Website Info**: Extracts the Page Name and URL.
- **Contact Info**: Extracts emails (`mailto:` & regex) and phone numbers (`tel:` & regex).
- **Social Media**: Identifies Facebook, Instagram, YouTube, Twitter/X, LinkedIn, TikTok, etc.
- **Export Options**:
  - **Copy** individual items to clipboard.
  - **Export CSV** for one-click download.
  - **Save to Google Sheets** for centralized data collection.

## Google Sheets Setup

To use the "Save to Sheet" feature, you need to deploy a small script to your Google Account.
👉 **[Read the Setup Guide (GOOGLE_SHEETS_SETUP.md)](GOOGLE_SHEETS_SETUP.md)**

## Structure

- `manifest.json`: Configuration (v1.1).
- `content.js`: Scrapes data (Name, URL, Emails, Phones, Socials).
- `background.js`: Manages unique data per tab.
- `popup.html/js`: The interface with Export and Settings.
- `APPS_SCRIPT_CODE.gs`: The backend code for Google Sheets.

