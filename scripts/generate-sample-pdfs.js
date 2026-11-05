const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Function to generate a minimal valid PDF with custom text on 3 pages
function createValidPdf(title, subtitle, pagesText) {
  let objects = [];
  let offsets = [];

  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // 2: Pages
  const pageRefs = pagesText.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pagesText.length} >>\nendobj`);
  // 3: Font
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  pagesText.forEach((text, i) => {
    const pageObjNum = 4 + i * 2;
    const contentObjNum = 5 + i * 2;
    // Page
    objects.push(`${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R >> >> /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R >>\nendobj`);
    // Content stream
    const escapedText = text.replace(/[()]/g, '');
    const stream = `BT /F1 20 Tf 50 720 Td (${title}) Tj ET\nBT /F1 14 Tf 50 690 Td (${subtitle}) Tj ET\nBT /F1 12 Tf 50 650 Td (${escapedText}) Tj ET\nBT /F1 10 Tf 50 50 Td (Shubban Library - Page ${i + 1}) Tj ET`;
    objects.push(`${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  });

  let pdf = '%PDF-1.4\n';
  offsets.push(0);

  objects.forEach(obj => {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  });

  const xrefStart = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefStart}\n`;
  pdf += '%%EOF\n';

  return Buffer.from(pdf, 'utf-8');
}

const samplePdfs = [
  {
    name: 'sample-gitanjali.pdf',
    title: 'Gitanjali - Rabindranath Tagore',
    subtitle: 'Nobel Prize in Literature Edition',
    pages: [
      'Gitanjali Song Offering - Chapter 1: Thou hast made me endless, such is thy pleasure.',
      'Chapter 2: When thou commandest me to sing it seems that my heart would break with pride.',
      'Chapter 3: I know not how thou singest, my master! I ever listen in silent amazement.',
    ],
  },
  {
    name: 'sample-agniveena.pdf',
    title: 'Agni-Veena - Kazi Nazrul Islam',
    subtitle: 'Historic Centenary Edition',
    pages: [
      'Song of Rebellion - Say, O Hero! Say, my head is held high!',
      'Canto of Freedom and Human Dignity.',
      'Dhumketu and Pralayollas: Ode to Creation through Destruction.',
    ],
  },
  {
    name: 'sample-bhasha.pdf',
    title: 'History of Bengali Language - Dr. Muhammad Shahidullah',
    subtitle: 'Academic Linguistics Research',
    pages: [
      'Origin of Bengali Language from Gaudi Prakrit.',
      'Phonological evolution of Charyapada verse rhythms.',
      'Morphological structures in Middle and Modern Bengali.',
    ],
  },
  {
    name: 'sample-nakshi.pdf',
    title: 'Nakshi Kanthar Math - Jasimuddin',
    subtitle: 'The Field of the Embroidered Quilt',
    pages: [
      'Introduction: Rural Bengal and Folk Ballad Heritage.',
      'The Tale of Rupa and Saju - Village love and enduring sacrifice.',
      'Epilogue: The Quilt embroidered with sorrow and longing.',
    ],
  },
  {
    name: 'sample-bishad.pdf',
    title: 'Bishad Shindhu - Mir Mosharraf Hossain',
    subtitle: 'Classical Historical Epic',
    pages: [
      'Part 1: The Tragedy of Karbala and Historical Backdrop.',
      'Part 2: Glimpses of early Bengali prose perfection.',
      'Part 3: Ethical Reflections and Literary Resonance.',
    ],
  },
  {
    name: 'sample-tradition.pdf',
    title: 'Intellectual Quest of Muslim Bengal - Dr. Ehsanul Kabir',
    subtitle: 'Shubban Research Monograph',
    pages: [
      'Section 1: Islamic Scholarship in Sultanate Bengal.',
      'Section 2: Manuscript preservation and translation traditions.',
      'Section 3: Renaissance in Bengali Islamic Literature.',
    ],
  },
  {
    name: 'magazine-shubban-vol1-issue5.pdf',
    title: 'Shubban Journal of Literature and Philosophy',
    subtitle: 'Vol 1, Issue 5 - September 2026',
    pages: [
      'Editorial: The Future of Thought in a Distracted World.',
      'Article: Eastern Metaphysics vs Technological Rationalism.',
      'Book Review: Archives of Ancient Bengal.',
    ],
  },
  {
    name: 'magazine-shubban-vol1-issue4.pdf',
    title: 'Shubban Journal of Literature and Philosophy',
    subtitle: 'Vol 1, Issue 4 - August 2026',
    pages: [
      'Special Issue on Nineteenth Century Bengali Renaissance.',
      'Colonial Modernity and the Birth of Prose Fiction.',
      'Critical Essays and Archived Letters.',
    ],
  },
  {
    name: 'weekly-nabachetana-102.pdf',
    title: 'Naba Chetana Weekly - Issue 102',
    subtitle: 'Current Affairs and Cultural Review',
    pages: [
      'Cover Story: Digital Libraries and Democratizing Reading.',
      'Economy, Publishing Industry, and Cultural Policies.',
      'Literary Column: Voices from Bengal.',
    ],
  },
  {
    name: 'research-charyapada.pdf',
    title: 'Research: Phonological Evolution of Charyapada',
    subtitle: 'Dr. Muhammad Shahidullah - Shubban Research',
    pages: [
      'Abstract: Phonetics, vowel shifts, and nasalization patterns.',
      'Methodology and Comparative Study with Eastern Magadhan Dialects.',
      'Conclusions, Citations, and References.',
    ],
  },
  {
    name: 'slides-manuscript-digitization.pdf',
    title: 'Presentation: Digital Preservation of Bengali Manuscripts',
    subtitle: 'Slide Deck - Shubban Digital Library Conference',
    pages: [
      'Slide 1: Challenges in Ancient Palm-leaf and Paper Preservation.',
      'Slide 2: Non-destructive High DPI Scanning Workflows.',
      'Slide 3: Bengali OCR and Automated Metadata Indexing.',
    ],
  },
];

samplePdfs.forEach((p) => {
  const filePath = path.join(samplesDir, p.name);
  const pdfBuffer = createValidPdf(p.title, p.subtitle, p.pages);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Created PDF: ${p.name} (${pdfBuffer.length} bytes)`);
});
