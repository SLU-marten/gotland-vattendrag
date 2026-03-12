/**
 * Google Apps Script - Klistra in denna kod i ditt spreadsheets Apps Script-editor.
 * Se GOOGLE_SHEETS_SETUP.md för instruktioner.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Lägg till rubrikrad om bladet är tomt
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Vattendrag ID', 'Vattendrag', 'Granskare', 'Arter', 'Övriga kommentarer']);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.waterway_id || '',
      data.waterway_name || '',
      data.reviewer || '',
      data.species || '',
      data.comment || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
