# Google Sheets Setup

## Steg 1: Öppna Apps Script

1. Öppna ditt Google Spreadsheet
2. Gå till **Extensions** → **Apps Script**

## Steg 2: Klistra in koden

1. Ta bort all befintlig kod i editorn
2. Kopiera hela innehållet från `google_apps_script.js` och klistra in det
3. Klicka **Save** (Ctrl+S)

## Steg 3: Deploy som Web App

1. Klicka **Deploy** → **New deployment**
2. Klicka kugghjulet bredvid "Select type" → välj **Web app**
3. Ställ in:
   - **Description**: Gotland Waterway Reviews
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Klicka **Deploy**
5. Godkänn behörigheter när du blir ombedd
6. **Kopiera URL:en** som visas

## Steg 4: Konfigurera appen

1. Öppna `src/services/reviewService.js`
2. Klistra in URL:en i `SHEETS_URL`:
   ```js
   const SHEETS_URL = 'https://script.google.com/macros/s/XXXXXXXXX/exec';
   ```
3. Starta om dev-servern (`npm run dev`)

## Kolumner i spreadsheet

| Kolumn | Innehåll |
|--------|----------|
| A | Timestamp (ISO 8601) |
| B | Vattendrag ID (seadsgm) |
| C | Vattendrag (namn) |
| D | Granskare |
| E | Kommentar |
