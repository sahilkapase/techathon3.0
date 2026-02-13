/**
 * AS-4: PDF Form Generator for Scheme Applications
 * 
 * Generates pre-filled PDF forms for quick application
 * 
 * @file form_generator_service.js
 * @version 1.0.0
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate scheme application form as PDF
 * 
 * @param {Object} farmerData - Farmer information
 * @param {Object} schemeData - Scheme information
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateSchemeApplicationForm(farmerData, schemeData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            // Collect PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('GrowFarm - Scheme Application Form', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text('Government Agricultural Scheme Application', { align: 'center' });
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(1);

            // Section 1: Scheme Details
            addSection(doc, 'Scheme Details');
            addField(doc, 'Scheme Name', schemeData.title);
            addField(doc, 'Scheme ID', schemeData.schemeId);
            addField(doc, 'Application Deadline', new Date(schemeData.applicationDeadline).toDateString());
            doc.moveDown(0.5);

            // Section 2: Farmer Information (Pre-filled)
            addSection(doc, 'Farmer Information (Pre-filled)');
            addField(doc, 'Farmer ID', farmerData.farmerId || '_______________');
            addField(doc, 'Full Name', farmerData.name || '_______________');
            addField(doc, 'Mobile Number', farmerData.mobileNumber || '_______________');
            addField(doc, 'Aadhar Number', farmerData.aadharNumber || '_______________');
            addField(doc, 'District', farmerData.district || '_______________');
            addField(doc, 'Taluka', farmerData.taluka || '_______________');
            addField(doc, 'Village', farmerData.village || '_______________');
            doc.moveDown(0.5);

            // Section 3: Farm Details
            addSection(doc, 'Farm Details');
            addField(doc, 'Total Land Size (acres)', farmerData.landSize || '_______________');
            addField(doc, 'Crop Type', farmerData.cropType || '_______________');
            addField(doc, 'Current Season', farmerData.season || '_______________');
            addField(doc, 'Soil Type', farmerData.soilType || '_______________');
            addField(doc, 'Irrigation Type', farmerData.irrigationType || '_______________');
            doc.moveDown(0.5);

            // Section 4: Scheme Benefits & Eligibility
            addSection(doc, 'Scheme Benefits & Eligibility');
            doc.fontSize(10).font('Helvetica').text('Benefits:', { underline: true });
            doc.fontSize(9).font('Helvetica').text(schemeData.benefits || 'As per scheme guidelines', { align: 'left' });
            doc.moveDown(0.3);
            
            doc.fontSize(10).font('Helvetica').text('Subsidy Amount:', { underline: true });
            doc.fontSize(9).font('Helvetica').text(schemeData.subsidy || 'To be calculated', { align: 'left' });
            doc.moveDown(0.5);

            // Section 5: Declaration
            addSection(doc, 'Declaration');
            doc.fontSize(9).font('Helvetica').text(
                'I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that providing false information may lead to cancellation of my application and legal action.',
                { align: 'left', width: 475 }
            );
            doc.moveDown(1);

            // Signature and date
            doc.fontSize(9).font('Helvetica').text('Farmer Signature: _______________', { align: 'left' });
            doc.fontSize(9).font('Helvetica').text('Date: _______________', { align: 'left' });
            doc.moveDown(1);

            // Footer with application instructions
            addSection(doc, 'How to Submit');
            doc.fontSize(9).font('Helvetica').text(
                '1. Print this form\n' +
                '2. Fill in all required fields\n' +
                '3. Attach supporting documents (Land certificate, Aadhar, etc.)\n' +
                '4. Submit at your nearest agricultural office or through GrowFarm portal\n' +
                '5. Keep a copy for your records',
                { align: 'left', width: 475 }
            );

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate insurance comparison PDF
 * 
 * @param {Array} insuranceOptions - Insurance plans
 * @param {Object} farmerData - Farmer information
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInsuranceComparison(insuranceOptions, farmerData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(16).font('Helvetica-Bold').text('Crop Insurance Comparison Report', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').text(`For: ${farmerData.cropType} - ${farmerData.landSize} acres`, { align: 'center' });
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(1);

            // Farmer Summary
            addSection(doc, 'Farmer Summary');
            addField(doc, 'Farmer Name', farmerData.name || 'N/A');
            addField(doc, 'District', farmerData.district || 'N/A');
            addField(doc, 'Land Size', `${farmerData.landSize} acres`);
            doc.moveDown(0.5);

            // Comparison Table
            addSection(doc, 'Insurance Plans Comparison');
            
            // Table headers
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 150;
            const col3 = 250;
            const col4 = 350;
            const col5 = 450;

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Provider', col1, tableTop);
            doc.text('Coverage', col2, tableTop);
            doc.text('Premium', col3, tableTop);
            doc.text('Description', col4, tableTop);
            doc.text('Approval %', col5, tableTop);

            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();
            doc.moveDown(1);

            // Table rows
            doc.font('Helvetica').fontSize(8);
            insuranceOptions.forEach((option, index) => {
                const y = doc.y;
                
                doc.text(option.provider || 'N/A', col1, y);
                doc.text(`₹${option.coverageAmount}`, col2, y);
                doc.text(`₹${option.premium}`, col3, y);
                doc.text(option.description ? option.description.substring(0, 20) + '...' : 'N/A', col4, y);
                doc.text('95%', col5, y);

                if (index < insuranceOptions.length - 1) {
                    doc.moveDown(1.5);
                }
            });

            doc.moveDown(1.5);

            // Recommendations
            addSection(doc, 'Recommendations');
            
            if (insuranceOptions.length > 0) {
                const cheapest = insuranceOptions.reduce((min, opt) => 
                    opt.premium < min.premium ? opt : min
                );
                
                doc.fontSize(9).font('Helvetica-Bold').text('Most Affordable Plan:');
                doc.fontSize(8).font('Helvetica').text(
                    `${cheapest.provider} - ₹${cheapest.premium} premium for ₹${cheapest.coverageAmount} coverage`
                );
                doc.moveDown(0.5);
            }

            doc.fontSize(9).font('Helvetica-Bold').text('How to Purchase:');
            doc.fontSize(8).font('Helvetica').text(
                '1. Choose your preferred insurance plan\n' +
                '2. Submit application through GrowFarm portal\n' +
                '3. Pay premium online or offline\n' +
                '4. Receive policy document within 5 business days\n' +
                '5. Keep policy safe for claim purposes'
            );

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate financial support summary PDF
 * 
 * @param {Object} support - Financial support details
 * @param {Object} farmerData - Farmer information
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateFinancialSupportReport(support, farmerData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(16).font('Helvetica-Bold').text('Financial Support & Subsidies Report', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').text('Government Benefits Available for Your Farm', { align: 'center' });
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(1);

            // Summary Stats
            addSection(doc, 'Available Opportunities');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Total Schemes: ${support.summary.totalSchemes}`, { indent: 20 });
            doc.text(`Subsidies: ${support.summary.subsidiesAvailable}`, { indent: 20 });
            doc.text(`Loans: ${support.summary.loansAvailable}`, { indent: 20 });
            doc.text(`Insurance Options: ${support.summary.insuranceOptions}`, { indent: 20 });
            doc.moveDown(0.5);

            // Subsidies Section
            if (support.subsidies && support.subsidies.length > 0) {
                addSection(doc, '💰 Available Subsidies');
                support.subsidies.forEach((subsidy, index) => {
                    doc.fontSize(8).font('Helvetica-Bold').text(`${index + 1}. ${subsidy.schemeName}`);
                    doc.fontSize(8).font('Helvetica').text(`Amount: ${subsidy.amount}`, { indent: 20 });
                    doc.text(`Deadline: ${new Date(subsidy.deadline).toDateString()}`, { indent: 20 });
                    doc.text(`Days Left: ${subsidy.daysLeft}`, { indent: 20 });
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.5);
            }

            // Loans Section
            if (support.loans && support.loans.length > 0) {
                addSection(doc, '🏦 Available Loans');
                support.loans.forEach((loan, index) => {
                    doc.fontSize(8).font('Helvetica-Bold').text(`${index + 1}. ${loan.schemeName}`);
                    doc.fontSize(8).font('Helvetica').text(`Details: ${loan.benefits}`, { indent: 20 });
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.5);
            }

            // Insurance Section
            if (support.insurance && support.insurance.length > 0) {
                addSection(doc, '🛡️ Insurance Options');
                support.insurance.forEach((ins, index) => {
                    doc.fontSize(8).font('Helvetica-Bold').text(`${index + 1}. ${ins.schemeName}`);
                    doc.fontSize(8).font('Helvetica').text(`Coverage: ${ins.amount}`, { indent: 20 });
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.5);
            }

            // Next Steps
            addSection(doc, 'Next Steps');
            doc.fontSize(8).font('Helvetica').text(
                '1. Review all available schemes carefully\n' +
                '2. Check eligibility criteria for each scheme\n' +
                '3. Note down important deadlines\n' +
                '4. Prepare required documents\n' +
                '5. Apply through GrowFarm portal or government office\n' +
                '6. Keep copies of all applications'
            );

            doc.moveDown(1);
            doc.fontSize(7).font('Helvetica').text(
                'Report generated by GrowFarm Portal',
                { align: 'center', color: '#999' }
            );

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Helper function to add section heading
 */
function addSection(doc, title) {
    doc.fontSize(11).font('Helvetica-Bold').text(title);
    doc.moveTo(40, doc.y).lineTo(555, doc.y - 2).stroke();
    doc.moveDown(0.5);
}

/**
 * Helper function to add field with value
 */
function addField(doc, label, value) {
    doc.fontSize(9).font('Helvetica-Bold').text(label + ':', { width: 150, continued: true });
    doc.fontSize(9).font('Helvetica').text(value || '_______________');
    doc.moveDown(0.3);
}

module.exports = {
    generateSchemeApplicationForm,
    generateInsuranceComparison,
    generateFinancialSupportReport
};
