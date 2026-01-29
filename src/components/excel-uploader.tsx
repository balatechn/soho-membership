"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PreviewData {
  totalRows: number
  validRows: number
  errorRows: number
  errors: Array<{ row: number; field: string; message: string }>
  preview: any[]
  summary: {
    totalAmount: number
    totalTax: number
    uniqueMembers: number
  }
}

export function ExcelUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadMonth, setUploadMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setPreviewData(null)
      setImportResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  })

  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("uploadMonth", uploadMonth)
      formData.append("action", "preview")

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Preview failed")
      }

      setPreviewData(data)
      toast.success("Preview generated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to preview file")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("uploadMonth", uploadMonth)
      formData.append("action", "import")

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setImportResult(data)
      toast.success(data.message)
    } catch (error: any) {
      toast.error(error.message || "Failed to import file")
    } finally {
      setLoading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreviewData(null)
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Upload Month Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Month
        </label>
        <input
          type="month"
          value={uploadMonth}
          onChange={(e) => setUploadMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-amber-500 bg-amber-50"
              : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {isDragActive
              ? "Drop the Excel file here"
              : "Drag & drop an Excel file here"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            or click to browse files (.xlsx, .xls)
          </p>
        </div>
      )}

      {/* File Selected */}
      {file && !importResult && (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-10 h-10 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Preview Data"
              )}
            </button>
            {previewData && previewData.validRows > 0 && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </span>
                ) : (
                  `Import ${previewData.validRows} Records`
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview Results */}
      {previewData && !importResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900">{previewData.totalRows}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-500">Valid Rows</p>
              <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-500">Error Rows</p>
              <p className="text-2xl font-bold text-red-600">{previewData.errorRows}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-500">Unique Members</p>
              <p className="text-2xl font-bold text-blue-600">{previewData.summary.uniqueMembers}</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-amber-700">Total Amount</p>
                <p className="text-xl font-bold text-amber-900">
                  {formatCurrency(previewData.summary.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-amber-700">Total Tax</p>
                <p className="text-xl font-bold text-amber-900">
                  {formatCurrency(previewData.summary.totalTax)}
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {previewData.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Validation Errors ({previewData.errors.length})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {previewData.errors.map((error, idx) => (
                  <div key={idx} className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded">
                    <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewData.preview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Preview (First 10 Records)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Invoice No</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Global ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.preview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 whitespace-nowrap">{row.invoiceNo}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.globalId}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.product || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {formatCurrency(row.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Success */}
      {importResult && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-medium text-green-900">Import Successful</h3>
              <p className="text-green-700">{importResult.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Total Processed</p>
              <p className="text-xl font-bold text-gray-900">{importResult.totalRows}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Successfully Imported</p>
              <p className="text-xl font-bold text-green-600">{importResult.successCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-red-600">{importResult.failedCount}</p>
            </div>
          </div>

          <button
            onClick={resetUpload}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  )
}
