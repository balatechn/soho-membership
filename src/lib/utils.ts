import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonth(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function getUploadMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseExcelDate(excelDate: number | string | Date | null | undefined): Date | null {
  if (!excelDate) return null
  
  if (excelDate instanceof Date) return excelDate
  
  if (typeof excelDate === 'number') {
    // Excel serial date number
    const utcDays = Math.floor(excelDate - 25569)
    const utcValue = utcDays * 86400
    return new Date(utcValue * 1000)
  }
  
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  
  return null
}

export function getStateFromPinCode(pinCode: string): string {
  if (!pinCode) return 'Unknown'
  
  const pin = pinCode.toString().substring(0, 2)
  
  const stateMap: Record<string, string> = {
    '11': 'Delhi',
    '12': 'Haryana',
    '13': 'Punjab',
    '14': 'Punjab',
    '15': 'Punjab',
    '16': 'Punjab',
    '17': 'Himachal Pradesh',
    '18': 'Jammu & Kashmir',
    '19': 'Jammu & Kashmir',
    '20': 'Uttar Pradesh',
    '21': 'Uttar Pradesh',
    '22': 'Uttar Pradesh',
    '23': 'Uttar Pradesh',
    '24': 'Uttar Pradesh',
    '25': 'Uttar Pradesh',
    '26': 'Uttar Pradesh',
    '27': 'Uttar Pradesh',
    '28': 'Uttar Pradesh',
    '30': 'Rajasthan',
    '31': 'Rajasthan',
    '32': 'Rajasthan',
    '33': 'Rajasthan',
    '34': 'Rajasthan',
    '36': 'Gujarat',
    '37': 'Gujarat',
    '38': 'Gujarat',
    '39': 'Gujarat',
    '40': 'Maharashtra',
    '41': 'Maharashtra',
    '42': 'Maharashtra',
    '43': 'Maharashtra',
    '44': 'Maharashtra',
    '45': 'Madhya Pradesh',
    '46': 'Madhya Pradesh',
    '47': 'Madhya Pradesh',
    '48': 'Madhya Pradesh',
    '49': 'Chhattisgarh',
    '50': 'Telangana',
    '51': 'Telangana',
    '52': 'Andhra Pradesh',
    '53': 'Andhra Pradesh',
    '56': 'Karnataka',
    '57': 'Karnataka',
    '58': 'Karnataka',
    '59': 'Karnataka',
    '60': 'Tamil Nadu',
    '61': 'Tamil Nadu',
    '62': 'Tamil Nadu',
    '63': 'Tamil Nadu',
    '64': 'Tamil Nadu',
    '67': 'Kerala',
    '68': 'Kerala',
    '69': 'Kerala',
    '70': 'West Bengal',
    '71': 'West Bengal',
    '72': 'West Bengal',
    '73': 'West Bengal',
    '74': 'West Bengal',
    '75': 'Odisha',
    '76': 'Odisha',
    '77': 'Odisha',
    '78': 'Assam',
    '79': 'Assam',
    '80': 'Bihar',
    '81': 'Bihar',
    '82': 'Bihar',
    '83': 'Bihar',
    '84': 'Bihar',
    '85': 'Jharkhand',
  }
  
  return stateMap[pin] || 'Other'
}

export function isMaharashtra(state: string | null | undefined): boolean {
  if (!state) return false
  return state.toLowerCase().includes('maharashtra')
}

export function calculateTax(amount: number, state: string | null | undefined): {
  cgst: number
  sgst: number
  igst: number
  totalTax: number
} {
  const isMH = isMaharashtra(state)
  
  if (isMH) {
    const cgst = amount * 0.09
    const sgst = amount * 0.09
    return {
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
    }
  } else {
    const igst = amount * 0.18
    return {
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
    }
  }
}

export function getQuarter(date: Date): string {
  const month = date.getMonth()
  if (month < 3) return 'Q4'
  if (month < 6) return 'Q1'
  if (month < 9) return 'Q2'
  return 'Q3'
}

export function getFinancialYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  if (month < 3) {
    return `FY ${year - 1}-${year.toString().slice(-2)}`
  }
  return `FY ${year}-${(year + 1).toString().slice(-2)}`
}
