import { ExcelUploader } from "@/components/excel-uploader"
import { FileSpreadsheet, History, Download } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

async function getUploadHistory() {
  const logs = await prisma.uploadLog.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
  return logs
}

export default async function UploadPage() {
  const uploadHistory = await getUploadHistory()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Invoices</h1>
          <p className="text-gray-500">Upload monthly invoice data from Excel files</p>
        </div>
        <a
          href="/sample-invoice-template.xlsx"
          download
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Sample Template
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Monthly Invoice Upload</h2>
                <p className="text-sm text-gray-500">Upload Excel file with invoice data</p>
              </div>
            </div>

            <ExcelUploader />

            {/* Field Mapping Reference */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Expected Excel Columns</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {[
                  "Invoice No.*",
                  "Invoice Date*",
                  "Global ID*",
                  "Name*",
                  "State",
                  "Email Id",
                  "Registration",
                  "Membership",
                  "Month Total*",
                  "CGST 9%",
                  "SGST 9%",
                  "CGST 18%",
                  "SGST 18%",
                  "Total Tax",
                  "Description",
                  "Membership Start Date",
                  "Membership End Date",
                  "Payment Start Date",
                  "Payment End Date",
                  "Renewal/Quarterly",
                  "Product",
                  "Months",
                  "Calculations of Month",
                ].map((col) => (
                  <span
                    key={col}
                    className={`px-2 py-1 rounded ${
                      col.includes("*")
                        ? "bg-amber-100 text-amber-800 font-medium"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">* Required fields</p>
            </div>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upload History</h2>
          </div>

          {uploadHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No uploads yet</p>
          ) : (
            <div className="space-y-4">
              {uploadHistory.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate max-w-[180px]">
                      {log.fileName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : log.status === "COMPLETED_WITH_ERRORS"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {log.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Month: {log.uploadMonth}</p>
                    <p>Records: {log.successCount}/{log.recordsCount}</p>
                    <p>{formatDate(log.createdAt)}</p>
                    <p className="truncate">By: {log.user.name || log.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
