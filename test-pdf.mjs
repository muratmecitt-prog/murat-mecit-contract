import { generateContractPDF } from './lib/pdfService.js';

async function test() {
    try {
        console.log('Starting PDF generation test...');
        const mockData = {
            customer_name: 'Test Client',
            shooting_date: '2026-06-01',
            package_price: 15000,
            deposit: 5000,
            clauses: [{ text: 'Test clause' }]
        };
        const pdfBytes = await generateContractPDF(mockData);
        console.log('PDF Generated successfully, bytes:', pdfBytes.length);
    } catch (error) {
        console.error('PDF Generation Failed:', error);
    }
}

test();
