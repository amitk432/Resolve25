// FontAwesome font registration for jsPDF
// Download FontAwesome TTF from https://github.com/FortAwesome/Font-Awesome/tree/master/webfonts
// Convert to base64 using https://transfonter.org/ or similar
// Paste the base64 string below and register with jsPDF

import { jsPDF } from 'jspdf';

// Example: Add FontAwesome font to jsPDF
// jsPDF.addFileToVFS('FontAwesome.ttf', '<base64-string-here>');
// jsPDF.addFont('FontAwesome.ttf', 'FontAwesome', 'normal');

// Usage in PDF:
// pdf.setFont('FontAwesome');
// pdf.text('\uf095', x, y); // Phone icon
// pdf.text('\uf0e0', x, y); // Email icon
// pdf.text('\uf041', x, y); // Location icon
// pdf.text('\uf09b', x, y); // GitHub icon
// pdf.text('\uf08c', x, y); // LinkedIn icon

// See https://fontawesome.com/v4/cheatsheet/ for unicode values
