const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  console.log('🎨 Conversion SVG vers PNG en cours...');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Lire le fichier SVG
  const svgPath = path.join(__dirname, '../public/social-preview.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Créer une page HTML avec le SVG
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        svg { display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.setViewport({ width: 1200, height: 630 });

  // Capturer le SVG en PNG
  const pngBuffer = await page.screenshot({
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  // Sauvegarder le PNG
  const pngPath = path.join(__dirname, '../public/social-preview.png');
  fs.writeFileSync(pngPath, pngBuffer);

  console.log('✅ Conversion terminée : social-preview.png créé');

  await browser.close();
}

convertSvgToPng().catch(console.error);
