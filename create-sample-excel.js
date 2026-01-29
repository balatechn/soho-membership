const XLSX = require('xlsx');

// Create sample data with headers
const data = [
  {
    'Invoice No': 'INV-2026-001',
    'Invoice Date': '2026-01-15',
    'Global ID': 'SH-MUM-001',
    'First Name': 'Rahul',
    'Last Name': 'Sharma',
    'Membership Type': 'Every House',
    'House Account Code': 'HAC001',
    'Product Code': 'MEM-EH',
    'Product Name': 'Every House Annual Membership',
    'Payment Mode': 'Bank Transfer',
    'Net Amount': 250000,
    'CGST Rate': 9,
    'CGST Amount': 22500,
    'SGST Rate': 9,
    'SGST Amount': 22500,
    'Total Tax': 45000,
    'Total Amount': 295000,
    'Credit Period Start': '2026-01-15',
    'Credit Period End': '2027-01-14',
    'Due Date': '2026-02-15',
    'UTR / Transaction Ref': 'UTR123456789',
    'Payment Received Date': '2026-01-20',
    'Payment Status': 'Paid',
    'Remarks': 'New membership',
    'State Code': '27'
  },
  {
    'Invoice No': 'INV-2026-002',
    'Invoice Date': '2026-01-16',
    'Global ID': 'SH-MUM-002',
    'First Name': 'Priya',
    'Last Name': 'Patel',
    'Membership Type': 'Local House',
    'House Account Code': 'HAC002',
    'Product Code': 'MEM-LH',
    'Product Name': 'Local House Annual Membership',
    'Payment Mode': 'Credit Card',
    'Net Amount': 150000,
    'CGST Rate': 9,
    'CGST Amount': 13500,
    'SGST Rate': 9,
    'SGST Amount': 13500,
    'Total Tax': 27000,
    'Total Amount': 177000,
    'Credit Period Start': '2026-01-16',
    'Credit Period End': '2027-01-15',
    'Due Date': '2026-02-16',
    'UTR / Transaction Ref': '',
    'Payment Received Date': '',
    'Payment Status': 'Pending',
    'Remarks': 'Renewal',
    'State Code': '27'
  },
  {
    'Invoice No': 'INV-2026-003',
    'Invoice Date': '2026-01-17',
    'Global ID': 'SH-MUM-003',
    'First Name': 'Amit',
    'Last Name': 'Desai',
    'Membership Type': 'Under 27',
    'House Account Code': 'HAC003',
    'Product Code': 'MEM-U27',
    'Product Name': 'Under 27 Membership',
    'Payment Mode': 'UPI',
    'Net Amount': 75000,
    'CGST Rate': 9,
    'CGST Amount': 6750,
    'SGST Rate': 9,
    'SGST Amount': 6750,
    'Total Tax': 13500,
    'Total Amount': 88500,
    'Credit Period Start': '2026-01-17',
    'Credit Period End': '2027-01-16',
    'Due Date': '2026-02-17',
    'UTR / Transaction Ref': 'UPI789456123',
    'Payment Received Date': '2026-01-17',
    'Payment Status': 'Paid',
    'Remarks': 'New member - Under 27 program',
    'State Code': '27'
  },
  {
    'Invoice No': 'INV-2026-004',
    'Invoice Date': '2026-01-18',
    'Global ID': 'SH-MUM-004',
    'First Name': 'Sneha',
    'Last Name': 'Kapoor',
    'Membership Type': 'Every House',
    'House Account Code': 'HAC004',
    'Product Code': 'MEM-EH-Q',
    'Product Name': 'Every House Quarterly',
    'Payment Mode': 'Bank Transfer',
    'Net Amount': 85000,
    'CGST Rate': 9,
    'CGST Amount': 7650,
    'SGST Rate': 9,
    'SGST Amount': 7650,
    'Total Tax': 15300,
    'Total Amount': 100300,
    'Credit Period Start': '2026-01-18',
    'Credit Period End': '2026-04-17',
    'Due Date': '2026-02-18',
    'UTR / Transaction Ref': '',
    'Payment Received Date': '',
    'Payment Status': 'Pending',
    'Remarks': 'Quarterly payment plan',
    'State Code': '27'
  },
  {
    'Invoice No': 'INV-2026-005',
    'Invoice Date': '2026-01-19',
    'Global ID': 'SH-MUM-005',
    'First Name': 'Vikram',
    'Last Name': 'Mehta',
    'Membership Type': 'Corporate',
    'House Account Code': 'HAC005',
    'Product Code': 'MEM-CORP',
    'Product Name': 'Corporate Membership',
    'Payment Mode': 'Cheque',
    'Net Amount': 500000,
    'CGST Rate': 9,
    'CGST Amount': 45000,
    'SGST Rate': 9,
    'SGST Amount': 45000,
    'Total Tax': 90000,
    'Total Amount': 590000,
    'Credit Period Start': '2026-01-19',
    'Credit Period End': '2027-01-18',
    'Due Date': '2026-02-19',
    'UTR / Transaction Ref': 'CHQ456789',
    'Payment Received Date': '2026-01-25',
    'Payment Status': 'Paid',
    'Remarks': 'Corporate account - 5 memberships',
    'State Code': '27'
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

// Set column widths
ws['!cols'] = [
  { wch: 15 }, // Invoice No
  { wch: 12 }, // Invoice Date
  { wch: 12 }, // Global ID
  { wch: 12 }, // First Name
  { wch: 12 }, // Last Name
  { wch: 15 }, // Membership Type
  { wch: 18 }, // House Account Code
  { wch: 12 }, // Product Code
  { wch: 30 }, // Product Name
  { wch: 14 }, // Payment Mode
  { wch: 12 }, // Net Amount
  { wch: 10 }, // CGST Rate
  { wch: 12 }, // CGST Amount
  { wch: 10 }, // SGST Rate
  { wch: 12 }, // SGST Amount
  { wch: 10 }, // Total Tax
  { wch: 12 }, // Total Amount
  { wch: 18 }, // Credit Period Start
  { wch: 16 }, // Credit Period End
  { wch: 12 }, // Due Date
  { wch: 20 }, // UTR / Transaction Ref
  { wch: 20 }, // Payment Received Date
  { wch: 14 }, // Payment Status
  { wch: 30 }, // Remarks
  { wch: 10 }, // State Code
];

// Write the file
XLSX.writeFile(wb, 'public/sample-invoice-template.xlsx');
console.log('Sample Excel file created: public/sample-invoice-template.xlsx');
