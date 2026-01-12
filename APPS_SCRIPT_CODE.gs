function doPost(e) {
  // Replace with your Sheet ID if you want to hardcode it, 
  // or use the 'Active' sheet if this script is container-bound.
  // The user provided ID: 15wRNErgTG0ZNJHnAo6vUUnpN7DkFgJ8o3foh7FZS6BI
  const SHEET_ID = '15wRNErgTG0ZNJHnAo6vUUnpN7DkFgJ8o3foh7FZS6BI';
  
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0]; // Use the first sheet
    
    // Append row
    // Columns: Name, Full-Number, Email, facebook, instagram, Youtube, les autre Social Media
    sheet.appendRow([
      data.name,
      data.number,
      data.email,
      data.facebook,
      data.instagram,
      data.youtube,
      data.others,
      new Date() // Added timestamp for reference
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
