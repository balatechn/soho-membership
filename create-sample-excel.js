const XLSX = require('xlsx');

// Create sample data with new headers matching user's template
const data = [
  {
    'Invoice No.': 'INV-2026-001',
    'Invoice Date': '2026-01-15',
    'Global ID': 'SH-MUM-001',
    'Name': 'Rahul Sharma',
    'State': 'Maharashtra',
    'Email Id': 'rahul.sharma@email.com',
    'Registration': 'REG001',
    'Membership': 'Every House',
    'Month Total': 295000,
    'CGST 9%': 22500,
    'SGST 9%': 22500,
    'CGST 18%': 0,
    'SGST 18%': 0,
    'Total Tax': 45000,
    'Description': 'Annual Membership Fee',
    'Membership Start Date': '2026-01-15',
    'Membership End Date': '2027-01-14',
    'Payment Start Date': '2026-01-15',
    'Payment End Date': '2026-02-15',
    'Renewal/Quarterly': 'Renewal',
    'Product': 'Every House Annual',
    'Months': 12,
    'Calculations of Month': 'Jan 2026 - Jan 2027'
  },
  {
    'Invoice No.': 'INV-2026-002',
    'Invoice Date': '2026-01-16',
    'Global ID': 'SH-MUM-002',
    'Name': 'Priya Patel',
    'State': 'Maharashtra',
    'Email Id': 'priya.patel@email.com',
    'Registration': 'REG002',
    'Membership': 'Local House',
    'Month Total': 177000,
    'CGST 9%': 13500,
    'SGST 9%': 13500,
    'CGST 18%': 0,
    'SGST 18%': 0,
    'Total Tax': 27000,
    'Description': 'Annual Membership Fee',
    'Membership Start Date': '2026-01-16',
    'Membership End Date': '2027-01-15',
    'Payment Start Date': '2026-01-16',
    'Payment End Date': '2026-02-16',
    'Renewal/Quarterly': 'New',
    'Product': 'Local House Annual',
    'Months': 12,
    'Calculations of Month': 'Jan 2026 - Jan 2027'
  },
  {
    'Invoice No.': 'INV-2026-003',
    'Invoice Date': '2026-01-17',
    'Global ID': 'SH-MUM-003',
    'Name': 'Amit Desai',
    'State': 'Gujarat',
    'Email Id': 'amit.desai@email.com',
    'Registration': 'REG003',
    'Membership': 'Under 27',
    'Month Total': 88500,
    'CGST 9%': 6750,
    'SGST 9%': 6750,
    'CGST 18%': 0,
    'SGST 18%': 0,
    'Total Tax': 13500,
    'Description': 'Under 27 Membership',
    'Membership Start Date': '2026-01-17',
    'Membership End Date': '2027-01-16',
    'Payment Start Date': '2026-01-17',
    'Payment End Date': '2026-02-17',
    'Renewal/Quarterly': 'New',
    'Product': 'Under 27 Annual',
    'Months': 12,
    'Calculations of Month': 'Jan 2026 - Jan 2027'
  },
  {
    'Invoice No.': 'INV-2026-004',
    'Invoice Date': '2026-01-18',
    'Global ID': 'SH-MUM-004',
    'Name': 'Sneha Kapoor',
    'State': 'Maharashtra',
    'Email Id': 'sneha.kapoor@email.com',
    'Registration': 'REG004',
    'Membership': 'Every House',
    'Month Total': 100300,
    'CGST 9%': 7650,
    'SGST 9%': 7650,
    'CGST 18%': 0,
    'SGST 18%': 0,
    'Total Tax': 15300,
    'Description': 'Quarterly Membership Fee',
    'Membership Start Date': '2026-01-18',
    'Membership End Date': '2026-04-17',
    'Payment Start Date': '2026-01-18',
    'Payment End Date': '2026-02-18',
    'Renewal/Quarterly': 'Quarterly',
    'Product': 'Every House Quarterly',
    'Months': 3,
    'Calculations of Month': 'Jan 2026 - Apr 2026'
  },
  {
    'Invoice No.': 'INV-2026-005',
    'Invoice Date': '2026-01-19',
    'Global ID': 'SH-MUM-005',
    'Name': 'Vikram Singh',
    'State': 'Delhi',
    'Email Id': 'vikram.singh@corporate.com',
    'Registration': 'REG005',
    'Membership': 'Corporate',
    'Month Total': 500000,
    'CGST 9%': 0,
    'SGST 9%': 0,
    'CGST 18%': 45000,
    'SGST 18%': 45000,
    'Total Tax': 90000,
    'Description': 'Corporate Membership (5 users)',
    'Membership Start Date': '2026-01-19',
    'Membership End Date': '2027-01-18',
    'Payment Start Date': '2026-01-19',
    'Payment End Date': '2026-02-19',
    'Renewal/Quarterly': 'Renewal',
    'Product': 'Corporate Annual',
    'Months': 12,
    'Calculations of Month': 'Jan 2026 - Jan 2027'
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Invoice Template');

// Set column widths
ws['!cols'] = [
  { wch: 15 },  // Invoice No.
  { wch: 12 },  // Invoice Date
  { wch: 12 },  // Global ID
  { wch: 20 },  // Name
  { wch: 15 },  // State
  { wch: 25 },  // Email Id
  { wch: 12 },  // Registration
  { wch: 15 },  // Membership
  { wch: 12 },  // Month Total
  { wch: 10 },  // CGST 9%
  { wch: 10 },  // SGST 9%
  { wch: 10 },  // CGST 18%
  { wch: 10 },  // SGST 18%
  { wch: 12 },  // Total Tax
  { wch: 25 },  // Description
  { wch: 18 },  // Membership Start Date
  { wch: 18 },  // Membership End Date
  { wch: 18 },  // Payment Start Date
  { wch: 18 },  // Payment End Date
  { wch: 18 },  // Renewal/Quarterly
  { wch: 20 },  // Product
  { wch: 10 },  // Months
  { wch: 22 },  // Calculations of Month
];

// Write the file
XLSX.writeFile(wb, 'public/sample-invoice-template.xlsx');
console.log('Sample Excel file created: public/sample-invoice-template.xlsx');
console.log('Headers:', Object.keys(data[0]).join(', '));
