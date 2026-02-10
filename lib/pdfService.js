import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// Helper to replace Turkish characters - NO LONGER NEEDED WITH CUSTOM FONT
// But keeping a passthrough for safety if we revert
function normalizeTurkishChars(text) {
    if (!text) return '';
    return text; // Return as is, we support UTF-8 now
}

export async function generateContractPDF(data) {
    const pdfDoc = await PDFDocument.create();

    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Load Fonts from Local Filesystem (Robust)
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Montserrat-Medium.ttf');
    const fontBoldPath = path.join(process.cwd(), 'assets', 'fonts', 'Montserrat-Bold.ttf');

    const fontBytes = fs.readFileSync(fontPath);
    const fontBoldBytes = fs.readFileSync(fontBoldPath);

    const font = await pdfDoc.embedFont(fontBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);

    // A4 Dimensions: 595.28 x 841.89
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // -- CUSTOMIZABLE PALETTE --
    // Default to Navy Blue if no color provided
    const primaryHex = data.settings?.contract_primary_color || '#1e293b';
    const r = parseInt(primaryHex.substring(1, 3), 16) / 255;
    const g = parseInt(primaryHex.substring(3, 5), 16) / 255;
    const b = parseInt(primaryHex.substring(5, 7), 16) / 255;

    const colorPrimary = rgb(r, g, b);
    const colorSecondary = rgb(0.4, 0.45, 0.5); // Slate Gray
    const colorAccent = rgb(0.96, 0.97, 0.98); // Light BG
    const colorHighlight = rgb(0.93, 0.94, 0.95);
    const colorTextBlack = rgb(0.1, 0.1, 0.1);
    const colorWhite = rgb(1, 1, 1);
    const colorLine = rgb(0.85, 0.85, 0.85);

    // -- COMPACT CONSTANTS --
    const margin = 20;
    const contentWidth = width - (margin * 2);
    const boxGap = 10;
    const colWidth = (contentWidth - boxGap) / 2;

    let currentY = height;

    // 1. HEADER (Banner)
    const headerHeight = 35; // Reduced 
    page.drawRectangle({
        x: 0,
        y: height - headerHeight,
        width: width,
        height: headerHeight,
        color: colorPrimary,
    });

    page.drawText('HİZMET SÖZLEŞMESİ', {
        x: margin,
        y: height - 26,
        size: 14,
        font: fontBold,
        color: colorWhite,
        letterSpacing: 1
    });

    // Date
    const contractDate = new Date().toLocaleDateString('tr-TR');
    page.drawText(`TARİH: ${contractDate}`, {
        x: width - margin - 80,
        y: height - 24,
        size: 8,
        font: font,
        color: rgb(0.8, 0.8, 0.8),
    });

    currentY = height - headerHeight - 12;

    // 2. INTRO TEXT
    const introText = "İşbu sözleşme, aşağıda bilgileri yer alan taraflar arasında, fotoğraf ve video prodüksiyon hizmetlerinin kapsamını, uygulama süreçlerini, teslim şartlarını ve ödeme planını düzenlemek amacıyla hazırlanmıştır. Taraflar tarafından beyan edilen adres, telefon ve iletişim bilgileri resmi tebligat adresi olarak kabul edilir.";

    // Tiny font for intro to save space (Increased to 9)
    const introLines = splitTextToLinesWithFont(introText, contentWidth, font, 9);
    introLines.forEach(line => {
        page.drawText(line, { x: margin, y: currentY, size: 9, font: font, color: colorSecondary });
        currentY -= 11;
    });
    currentY -= 4;

    // 3. INFO SECTION (3 Columns: Provider | Customer | Payment)
    const infoHeight = 110;
    const infoTopY = currentY;

    // 3 Cols Calculation
    const colGap = 10;
    const col3Width = (contentWidth - (colGap * 2)) / 3;

    // Backgrounds (3 Cols)
    page.drawRectangle({ x: margin, y: infoTopY - infoHeight, width: col3Width, height: infoHeight, color: colorAccent });
    page.drawRectangle({ x: margin + col3Width + colGap, y: infoTopY - infoHeight, width: col3Width, height: infoHeight, color: colorAccent });
    page.drawRectangle({ x: margin + (col3Width + colGap) * 2, y: infoTopY - infoHeight, width: col3Width, height: infoHeight, color: colorAccent });

    // Header Strips for 3 Cols
    const blockHeaderH = 18;
    // Col 1 Header
    page.drawRectangle({ x: margin, y: infoTopY - blockHeaderH, width: col3Width, height: blockHeaderH, color: colorHighlight });
    page.drawText('HİZMET SAĞLAYICI (FİRMA)', { x: margin + 6, y: infoTopY - 12, size: 7, font: fontBold, color: colorPrimary });

    // Col 2 Header
    page.drawRectangle({ x: margin + col3Width + colGap, y: infoTopY - blockHeaderH, width: col3Width, height: blockHeaderH, color: colorHighlight });
    page.drawText('HİZMET ALAN (MÜŞTERİ)', { x: margin + col3Width + colGap + 6, y: infoTopY - 12, size: 7, font: fontBold, color: colorPrimary });

    // Col 3 Header (Payment)
    page.drawRectangle({ x: margin + (col3Width + colGap) * 2, y: infoTopY - blockHeaderH, width: col3Width, height: blockHeaderH, color: colorHighlight });
    page.drawText('ÖDEME BİLGİLERİ', { x: margin + (col3Width + colGap) * 2 + 6, y: infoTopY - 12, size: 7, font: fontBold, color: colorPrimary });

    // Content Common settings
    const rowStartY = infoTopY - 30;
    const lineHeight = 11;
    const labelOffset = 6;
    const valueOffset = 40; // Adjusted for narrower cols

    // --- COL 1: PROVIDER ---
    let lY = rowStartY;
    const lX = margin + labelOffset;

    const drawPartyRow = (label, val, x, y) => {
        page.drawText(label, { x: x, y: y, size: 7, font: fontBold, color: colorSecondary });
        const valLines = splitTextToLinesWithFont(val, col3Width - valueOffset - 5, fontBold, 7);
        let vy = y;
        valLines.forEach(vl => {
            page.drawText(vl, { x: x + valueOffset, y: vy, size: 7, font: fontBold, color: colorTextBlack });
            vy -= 8;
        });
    };

    drawPartyRow('Yetkili:', data.settings?.representative_name || 'Murat MECİT', lX, lY); lY -= lineHeight;
    drawPartyRow('Adres:', 'Çınarlı, 1572/1. Sk. No:33', lX, lY); lY -= lineHeight;
    drawPartyRow('', 'Konak/İzmir', lX, lY); lY -= lineHeight;
    drawPartyRow('Tel:', '0 506 84663 44', lX, lY); lY -= lineHeight;
    drawPartyRow('Email:', 'muratmecit@gmail.com', lX, lY);

    // --- COL 2: CUSTOMER ---
    let cY = rowStartY;
    const cX = margin + col3Width + colGap + labelOffset;

    drawPartyRow('Ad Soyad:', normalizeTurkishChars(data.customer_name), cX, cY); cY -= lineHeight;
    const dateStr = data.shooting_date ? new Date(data.shooting_date).toLocaleDateString('tr-TR') : '-';
    drawPartyRow('Tarih:', dateStr, cX, cY); cY -= lineHeight;
    drawPartyRow('Mekan:', normalizeTurkishChars(data.location) || '-', cX, cY); cY -= lineHeight;
    drawPartyRow('Email:', normalizeTurkishChars(data.email) || '-', cX, cY); cY -= lineHeight;
    drawPartyRow('Tel:', normalizeTurkishChars(data.customer_phone) || '-', cX, cY);

    // --- COL 3: PAYMENT ---
    let pY = rowStartY;
    const pX = margin + (col3Width + colGap) * 2;
    const pWidth = col3Width;

    const formatMoney = (val) => (val || 0).toLocaleString('tr-TR');

    const drawPayRow = (label, value, bold = false, underline = false) => {
        // Label
        page.drawText(label, { x: pX + 6, y: pY, size: 7, font: bold ? fontBold : font, color: bold ? colorPrimary : colorSecondary });

        // Value (Right aligned in col)
        const vw = fontBold.widthOfTextAtSize(value, 8); // slightly bigger font for numbers
        page.drawText(value, { x: pX + pWidth - vw - 6, y: pY, size: 8, font: fontBold, color: colorTextBlack });

        if (underline) {
            page.drawLine({ start: { x: pX + 6, y: pY - 3 }, end: { x: pX + pWidth - 6, y: pY - 3 }, thickness: 0.5, color: colorLine });
        }

        pY -= 16;
    };

    drawPayRow('Toplam:', formatMoney(data.package_price) + ' TL', true);
    drawPayRow('Kapora:', formatMoney(data.deposit) + ' TL');
    const remaining = (data.package_price || 0) - (data.deposit || 0);
    drawPayRow('KALAN:', formatMoney(remaining) + ' TL', true, true);

    // Payment Note
    const payNote = normalizeTurkishChars(data.payment_note || '');
    if (payNote) {
        pY -= 5;
        const noteLines = splitTextToLinesWithFont(payNote, pWidth - 12, fontBold, 7);
        // Bg for note
        const noteH = (noteLines.length * 9) + 6;
        page.drawRectangle({ x: pX + 2, y: pY - noteH + 7, width: pWidth - 4, height: noteH, color: colorWhite, borderColor: colorLine, borderWidth: 0.5 });

        let nY = pY;
        noteLines.forEach(l => {
            page.drawText(l, { x: pX + 6, y: nY, size: 7, font: fontBold, color: colorPrimary });
            nY -= 9;
        });
    }

    currentY = infoTopY - infoHeight - 10;

    // 4. PACKAGES (Full Width)
    const pkgFontSize = 9;
    const pkgBoxWidth = contentWidth;

    // Header
    const sectionHeaderH = 24;
    page.drawRectangle({ x: margin, y: currentY - sectionHeaderH, width: pkgBoxWidth, height: sectionHeaderH, color: colorPrimary });
    const pkgHeaderTitle = data.package_name ? `PAKET İÇERİĞİ - ${normalizeTurkishChars(data.package_name)}` : 'PAKET İÇERİĞİ';
    page.drawText(pkgHeaderTitle, { x: margin + 10, y: currentY - 17, size: 9, font: fontBold, color: colorWhite });

    // Content Calculation
    const pkgItems = normalizeTurkishChars(data.package_content || '').split('\n').filter(i => i.trim() !== '');

    // Determine height & cols
    // With full width, we might fit everything in 2-3 cols or just list them.
    // Let's use 2 Cols for better use of space
    const colW = (pkgBoxWidth - 30) / 2;

    let allLines = [];
    pkgItems.forEach(item => {
        const lines = splitTextToLinesWithFont(item, colW, font, pkgFontSize);
        lines.forEach((l, i) => {
            if (i === 0) allLines.push({ text: l, type: 'bullet' });
            else allLines.push({ text: l, type: 'wrap' });
        });
    });

    const half = Math.ceil(allLines.length / 2);
    const col1 = allLines.slice(0, half);
    const col2 = allLines.slice(half);

    const h1 = (col1.length * 12) + (col1.filter(l => l.type === 'bullet').length * 4);
    const h2 = (col2.length * 12) + (col2.filter(l => l.type === 'bullet').length * 4);

    const pkgHeight = Math.max(h1, h2) + 30; // 30 padding
    const finalPkgHeight = Math.max(pkgHeight, 60); // Min height

    // Draw Box
    page.drawRectangle({ x: margin, y: currentY - finalPkgHeight, width: pkgBoxWidth, height: finalPkgHeight - sectionHeaderH, borderColor: colorLine, borderWidth: 0.5 });

    // Draw Lines Helper
    const drawPkgCol = (linesArr, sx, sy) => {
        let cy = sy;
        linesArr.forEach(lineItem => {
            if (lineItem.type === 'bullet') {
                page.drawText('•', { x: sx - 8, y: cy, size: 10, font: fontBold, color: colorPrimary });
            }
            page.drawText(lineItem.text, { x: sx, y: cy, size: pkgFontSize, font: font, color: colorTextBlack });
            cy -= 12;
            if (lineItem.type === 'bullet') cy -= 2;
        });
    };

    const pkgContentTopY = currentY - 35;

    // Col 1
    drawPkgCol(col1, margin + 20, pkgContentTopY);

    // Col 2
    if (col2.length > 0) {
        const c2x = margin + (pkgBoxWidth / 2) + 10;
        // Divider
        page.drawLine({ start: { x: margin + (pkgBoxWidth / 2), y: pkgContentTopY + 5 }, end: { x: margin + (pkgBoxWidth / 2), y: currentY - finalPkgHeight + 10 }, thickness: 0.5, color: colorLine });
        drawPkgCol(col2, c2x, pkgContentTopY);
    }

    currentY = currentY - finalPkgHeight - 10;

    // 5. CLAUSES
    page.drawText('HİZMET VE ÇALIŞMA KOŞULLARI', { x: margin, y: currentY, size: 9, font: fontBold, color: colorPrimary });
    page.drawLine({ start: { x: margin, y: currentY - 3 }, end: { x: width - margin, y: currentY - 3 }, thickness: 1, color: colorPrimary });
    currentY -= 12;

    const clauses = data.clauses || [];
    const clauseFontSize = 8;
    const clauseLineH = 9.5;

    clauses.forEach((c, idx) => {
        const text = normalizeTurkishChars(c.text);
        const cLines = splitTextToLinesWithFont(text, contentWidth - 20, font, clauseFontSize);
        const blockH = (cLines.length * clauseLineH) + 2.5;

        // Check page break
        if (currentY - blockH < 50) { // More buffer
            page = pdfDoc.addPage([595.28, 841.89]);
            currentY = height - 50;
        }

        page.drawText(`${idx + 1}.`, { x: margin, y: currentY, size: clauseFontSize, font: fontBold, color: colorPrimary });
        let clY = currentY;
        cLines.forEach(l => {
            page.drawText(l, { x: margin + 15, y: clY, size: clauseFontSize, font: font, color: colorSecondary });
            clY -= clauseLineH;
        });
        currentY -= blockH;
    });

    // 6. SIGNATURES

    // 6. SIGNATURES
    if (currentY < 120) {
        page = pdfDoc.addPage([595.28, 841.89]);
        currentY = height - 50;
    }

    let sigStartY = currentY - 30;
    const sigY = sigStartY;

    // Center signature blocks more
    const sigBlockW = 150;
    const lSigX = margin + 50; // Shifted right
    const rSigX = width - margin - sigBlockW - 50; // Shifted left

    // Provider Header
    const providerTitle = data.settings?.company_name
        ? `${normalizeTurkishChars(data.settings.company_name).toUpperCase()} YETKİLİSİ`
        : 'HİZMET SAĞLAYICI (FİRMA YETKİLİSİ)';

    page.drawText(providerTitle, { x: lSigX, y: sigY, size: 8, font: fontBold, color: colorPrimary });

    // Draw Name
    const providerName = normalizeTurkishChars(data.settings?.representative_name || 'Murat MECİT');
    page.drawText(providerName, { x: lSigX, y: sigY - 15, size: 8, font: font, color: colorTextBlack });

    // Embed Signature Image EXACTLY as shown in the photo (Overlapping MECIT)
    try {
        const sigImagePath = path.join(process.cwd(), 'assets', 'images', 'signature.png');
        if (fs.existsSync(sigImagePath)) {
            const sigImageBytes = fs.readFileSync(sigImagePath);
            const sigImage = await pdfDoc.embedPng(sigImageBytes);

            // Doubled size as requested
            const sigDims = sigImage.scaleToFit(sigBlockW * 2, 160);
            const nameWidth = font.widthOfTextAtSize(providerName, 8);

            page.drawImage(sigImage, {
                x: lSigX + (nameWidth * 0.4), // Shifted 1 more unit left
                y: sigY - 100,
                width: sigDims.width,
                height: sigDims.height,
            });
        }
    } catch (e) {
        console.error('Signature embedding failed:', e);
    }

    // Right Sig (Customer)
    page.drawText('HİZMET ALAN (MÜŞTERİ)', { x: rSigX, y: sigY, size: 8, font: fontBold, color: colorPrimary });
    page.drawText(normalizeTurkishChars(data.customer_name), { x: rSigX, y: sigY - 15, size: 8, font: font, color: colorTextBlack });

    return await pdfDoc.save();
}

// Utils
function splitTextToLinesWithFont(text, maxWidth, font, fontSize) {
    if (!text) return [];

    const rawWords = text.split(' ');
    let words = [];

    rawWords.forEach(word => {
        const wordWidth = font.widthOfTextAtSize(word, fontSize);
        if (wordWidth > maxWidth) {
            let currentSubWord = "";
            for (const char of word) {
                const test = currentSubWord + char;
                if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
                    if (currentSubWord) words.push(currentSubWord);
                    currentSubWord = char;
                } else {
                    currentSubWord += char;
                }
            }
            if (currentSubWord) words.push(currentSubWord);
        } else {
            words.push(word);
        }
    });

    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (!words[i]) continue;
        const testLine = currentLine + ' ' + words[i];
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}
