# How to Connect Google Sheets

To save data to your Google Sheet (`15wRNErgTG0ZNJHnAo6vUUnpN7DkFgJ8o3foh7FZS6BI`), follow these steps:

1. **Open Google Apps Script**:
   - Go to [script.google.com](https://script.google.com/) or open your Google Sheet while logged in.
   - Click **Extensions** > **Apps Script**.

2. **Paste the Code**:
   - Delete any code in `Code.gs`.
   - Open `APPS_SCRIPT_CODE.gs` from this folder and copy the content.
   - Paste it into the Google Apps Script editor.

3. **Deploy as Web App**:
   - Click the blue **Deploy** button > **New deployment**.
   - Select **type**: **Web app**.
   - Description: "Data Savor".
   - **Execute as**: Me (your email).
   - **Who has access**: **Anyone** (This is crucial for the extension to work without complex login).
   - Click **Deploy**.

4. **Copy URL**:
   - Copy the "Web App URL" (starts with `https://script.google.com/macros/s/...`).

5. **Configure Extension**:
   - Open the Extension Popup.
   - Click **Settings (Google Sheet)**.
   - Paste the URL.
   - Click **Save URL**.

Now you can click "Save to Sheet" and it will add a row to your specific sheet.
