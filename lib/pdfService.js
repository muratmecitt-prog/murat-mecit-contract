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

    // -- CORPORATE PALETTE --
    const colorPrimary = rgb(0.12, 0.16, 0.23); // Navy Blue
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

    // 3. PARTIES SECTION
    const partiesHeight = 85;
    const partiesTopY = currentY;

    // Backgrounds
    page.drawRectangle({ x: margin, y: partiesTopY - partiesHeight, width: colWidth, height: partiesHeight, color: colorAccent });
    page.drawRectangle({ x: margin + colWidth + boxGap, y: partiesTopY - partiesHeight, width: colWidth, height: partiesHeight, color: colorAccent });

    // Header Strips
    const blockHeaderH = 18;
    page.drawRectangle({ x: margin, y: partiesTopY - blockHeaderH, width: colWidth, height: blockHeaderH, color: colorHighlight });
    page.drawText('HİZMET SAĞLAYICI (FİRMA)', { x: margin + 6, y: partiesTopY - 12, size: 7, font: fontBold, color: colorPrimary });

    page.drawRectangle({ x: margin + colWidth + boxGap, y: partiesTopY - blockHeaderH, width: colWidth, height: blockHeaderH, color: colorHighlight });
    page.drawText('HİZMET ALAN (MÜŞTERİ)', { x: margin + colWidth + boxGap + 6, y: partiesTopY - 12, size: 7, font: fontBold, color: colorPrimary });

    // Content
    const rowStartY = partiesTopY - 30;
    const lineHeight = 11;
    const labelOffset = 6;
    const valueOffset = 45;

    // Left
    let lY = rowStartY;
    const lX = margin + labelOffset;

    const drawPartyRow = (label, val, x, y) => {
        page.drawText(label, { x: x, y: y, size: 7, font: fontBold, color: colorSecondary });
        page.drawText(val, { x: x + valueOffset, y: y, size: 7, font: fontBold, color: colorTextBlack });
    };

    drawPartyRow('Yetkili:', 'Murat MECİT', lX, lY); lY -= lineHeight;
    drawPartyRow('Adres:', 'Çınarlı, 1572/1. Sk. No:33', lX, lY); lY -= lineHeight;
    drawPartyRow('', 'Konak/İzmir', lX, lY); lY -= lineHeight;
    drawPartyRow('Tel:', '0 506 84663 44', lX, lY); lY -= lineHeight;
    drawPartyRow('Email:', 'muratmecit@gmail.com', lX, lY);

    // Right
    let rY = rowStartY;
    const rX = margin + colWidth + boxGap + labelOffset;

    drawPartyRow('Ad Soyad:', normalizeTurkishChars(data.customer_name), rX, rY); rY -= lineHeight;
    const dateStr = data.shooting_date ? new Date(data.shooting_date).toLocaleDateString('tr-TR') : '-';
    drawPartyRow('Tarih:', dateStr, rX, rY); rY -= lineHeight;
    drawPartyRow('Mekan:', normalizeTurkishChars(data.location) || '-', rX, rY); rY -= lineHeight;
    drawPartyRow('Email:', normalizeTurkishChars(data.email) || '-', rX, rY); rY -= lineHeight;
    drawPartyRow('Tel:', normalizeTurkishChars(data.customer_phone) || '-', rX, rY);

    currentY = partiesTopY - partiesHeight - 5;

    // 4. PACKAGES & FINANCIAL
    const pkgFontSize = 9;
    const pkgWidth = (contentWidth - boxGap) * 0.70;
    const payWidth = (contentWidth - boxGap) * 0.30;
    const boxEffectiveW = pkgWidth - 20;

    const pkgItems = normalizeTurkishChars(data.package_content || '').split('\n').filter(i => i.trim() !== '');

    // 1. Initial Check: Try Single Column
    let useTwoCols = false;
    let computedHeight = 0;

    // Calculate total lines in single col mode
    let totalLinesSingle = 0;
    pkgItems.forEach(item => {
        totalLinesSingle += splitTextToLinesWithFont(item, boxEffectiveW, font, pkgFontSize).length;
    });
    // Add spacing for bullets (approx 0.3 line per item)
    let totalHeightSingle = (totalLinesSingle * 12) + (pkgItems.length * 4);

    if (totalHeightSingle > 150) {
        useTwoCols = true;
    }

    // 2. Prepare Drawing Data
    let allDrawLines = []; // { text, type: 'bullet'|'wrap' }
    // Reduce width slightly to prevent visual spill
    const activeWidth = useTwoCols ? (pkgWidth / 2) - 20 : boxEffectiveW;

    pkgItems.forEach(item => {
        const lines = splitTextToLinesWithFont(item, activeWidth, font, pkgFontSize);
        lines.forEach((l, i) => {
            if (i === 0) allDrawLines.push({ text: l, type: 'bullet' });
            else allDrawLines.push({ text: l, type: 'wrap' });
        });
    });

    // 3. Calculate Layout
    let col1Lines = [];
    let col2Lines = [];
    let packageBoxHeight = 0;

    if (useTwoCols) {
        const totalCount = allDrawLines.length;
        const splitIndex = Math.ceil(totalCount / 2);
        col1Lines = allDrawLines.slice(0, splitIndex);
        col2Lines = allDrawLines.slice(splitIndex);

        const h1 = (col1Lines.length * 12) + (col1Lines.filter(l => l.type === 'bullet').length * 4);
        const h2 = (col2Lines.length * 12) + (col2Lines.filter(l => l.type === 'bullet').length * 4);

        packageBoxHeight = Math.max(h1, h2) + 30;
    } else {
        col1Lines = allDrawLines;
        packageBoxHeight = totalHeightSingle + 30;
    }

    if (packageBoxHeight < 100) packageBoxHeight = 100;

    // Calculate Payment Height Independently
    // Calculate Payment Height Independently
    const payNote = normalizeTurkishChars(data.payment_note || '');
    const payNoteLines = splitTextToLinesWithFont(payNote, payWidth - 12, fontBold, 8);

    // Exact height breakdown based on drawing logic:
    // Top to first row: 35
    // 3 Rows x 20px: 60
    // Gap before note: 5
    // Note Area: (lines * 10) + 10
    // Bottom Padding: 10
    const paymentContentHeight = 35 + 60 + 5 + (payNoteLines.length * 10 + 10) + 10;

    const paymentBoxHeight = Math.max(paymentContentHeight, 100);

    const sectionTopY = currentY;
    const sectionHeight = Math.max(packageBoxHeight, paymentBoxHeight);

    // Left Box Header
    const sectionHeaderH = 24;
    page.drawRectangle({ x: margin, y: sectionTopY - sectionHeaderH, width: pkgWidth, height: sectionHeaderH, color: colorPrimary });
    const pkgHeaderTitle = data.package_name ? `PAKET İÇERİĞİ - ${normalizeTurkishChars(data.package_name)}` : 'PAKET İÇERİĞİ';
    page.drawText(pkgHeaderTitle, { x: margin + 10, y: sectionTopY - 17, size: 9, font: fontBold, color: colorWhite });

    // Left Box Body
    page.drawRectangle({ x: margin, y: sectionTopY - packageBoxHeight, width: pkgWidth, height: packageBoxHeight - sectionHeaderH, borderColor: colorLine, borderWidth: 0.5 });

    // Draw Helper
    const drawLineList = (lines, startX, startY) => {
        let cy = startY;
        lines.forEach(lineItem => {
            if (lineItem.type === 'bullet') {
                page.drawText('•', { x: startX - 8, y: cy, size: 10, font: fontBold, color: colorPrimary });
            }
            const drawY = (lineItem.type === 'bullet') ? cy : cy + 4;
            page.drawText(lineItem.text, { x: startX, y: cy, size: pkgFontSize, font: font, color: colorTextBlack });
            cy -= 12;
            if (lineItem.type === 'bullet') cy -= 2;
        });
    };

    // Draw Cols
    let initialY = sectionTopY - 35;

    // Col 1
    // Moved slightly right to avoid border collision
    let c1X = margin + 18;
    drawLineList(col1Lines, c1X, initialY);

    // Col 2
    if (col2Lines.length > 0) {
        let c2X = margin + (pkgWidth / 2) + 14; // Adjusted to not hit right border
        // Divider Line
        page.drawLine({ start: { x: margin + (pkgWidth / 2), y: sectionTopY - 30 }, end: { x: margin + (pkgWidth / 2), y: sectionTopY - packageBoxHeight + 10 }, thickness: 0.5, color: colorLine });
        drawLineList(col2Lines, c2X, initialY);
    }

    // Right Box Header
    const payX = margin + pkgWidth + boxGap;
    page.drawRectangle({ x: payX, y: sectionTopY - sectionHeaderH, width: payWidth, height: sectionHeaderH, color: colorSecondary });
    page.drawText('ODEME', { x: payX + 8, y: sectionTopY - 13, size: 8, font: fontBold, color: colorWhite });

    // Right Box Body
    page.drawRectangle({ x: payX, y: sectionTopY - paymentBoxHeight, width: payWidth, height: paymentBoxHeight - sectionHeaderH, borderColor: colorLine, borderWidth: 0.5 });

    let payCursorY = sectionTopY - 35; // More breathing room at top
    const formatMoney = (val) => (val || 0).toLocaleString('tr-TR');

    const drawPayRow = (label, value, bold = false) => {
        // Left align label
        page.drawText(label, { x: payX + 10, y: payCursorY, size: 8, font: bold ? fontBold : font, color: bold ? colorPrimary : colorSecondary });

        // Right align value strongly
        const vw = fontBold.widthOfTextAtSize(value, 8);
        page.drawText(value, { x: payX + payWidth - vw - 10, y: payCursorY, size: 8, font: fontBold, color: colorTextBlack });
        payCursorY -= 20; // Increased spacing
    };

    drawPayRow('Toplam:', formatMoney(data.package_price), true);
    drawPayRow('Kapora:', formatMoney(data.deposit));
    const remaining = (data.package_price || 0) - (data.deposit || 0);

    page.drawLine({ start: { x: payX + 10, y: payCursorY + 8 }, end: { x: payX + payWidth - 10, y: payCursorY + 8 }, thickness: 0.5, color: colorLine });
    drawPayRow('KALAN:', formatMoney(remaining), true);

    // Note (Positioned naturally)
    const noteStartY = payCursorY - 5;
    const noteAreaHeight = (payNoteLines.length * 10) + 10;

    if (payNoteLines.length > 0) {
        page.drawRectangle({ x: payX + 1, y: noteStartY - noteAreaHeight, width: payWidth - 2, height: noteAreaHeight, color: colorAccent });
        let pny = noteStartY - 8;
        payNoteLines.forEach(l => {
            page.drawText(l, { x: payX + 5, y: pny, size: 8, font: fontBold, color: colorPrimary });
            pny -= 10;
        });
    }

    currentY = sectionTopY - sectionHeight - 5;

    // 5. CLAUSES (The critical part)
    page.drawText('HİZMET VE ÇALIŞMA KOŞULLARI', { x: margin, y: currentY, size: 9, font: fontBold, color: colorPrimary });
    page.drawLine({ start: { x: margin, y: currentY - 3 }, end: { x: width - margin, y: currentY - 3 }, thickness: 1, color: colorPrimary });
    currentY -= 12;

    const clauses = data.clauses || [];
    const clauseFontSize = 8; // Increased from 7 to 8
    const clauseLineH = 9.5; // Adjusted for readability

    clauses.forEach((c, idx) => {
        const text = normalizeTurkishChars(c.text);
        const cLines = splitTextToLinesWithFont(text, contentWidth - 20, font, clauseFontSize);
        const blockH = (cLines.length * clauseLineH) + 2.5;

        if (currentY - blockH < 20) {
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
    page.drawText('HİZMET SAĞLAYICI (FİRMA YETKİLİSİ)', { x: lSigX, y: sigY, size: 8, font: fontBold, color: colorPrimary });

    // Draw Name
    const providerName = 'Murat MECİT';
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
