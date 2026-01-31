"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ExcelUploader } from "@/components/excel-uploader"
import { 
  FileSpreadsheet, 
  History, 
  Download, 
  Trash2, 
  AlertTriangle, 
  X, 
  Calendar,
  FileText,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"

interface UploadLog {
  id: string
  fileName: string
  uploadMonth: string
  recordsCount: number
  successCount: number
  status: string
  errors: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  invoiceCount: number
  accrualCount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UploadPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload")
  const [uploads, setUploads] = useState<UploadLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; upload: UploadLog | null }>({ show: false, upload: null })
  const [deleting, setDeleting] = useState(false)
  const [errorModal, setErrorModal] = useState<{ show: boolean; upload: UploadLog | null }>({ show: false, upload: null })

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (activeTab === "history") {
      fetchUploads()
    }
  }, [activeTab, pagination.page])

  const fetchUploads = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/uploads?page=${pagination.page}&limit=${pagination.limit}`)
      const data = await response.json()
      if (response.ok) {
        setUploads(data.uploads)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || "Failed to load upload history")
      }
    } catch (error) {
      console.error("Failed to fetch uploads:", error)
      toast.error("Failed to load upload history")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.upload) return
    
    setDeleting(true)
    try {
      const response = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: deleteModal.upload.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Deleted: ${data.deleted.invoices} invoices, ${data.deleted.accruals} accruals`)
        setDeleteModal({ show: false, upload: null })
        fetchUploads()
      } else {
        toast.error(data.error || "Failed to delete upload")
      }
    } catch (error) {
      console.error("Failed to delete upload:", error)
      toast.error("Failed to delete upload")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "COMPLETED_WITH_ERRORS":
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      default:
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700"
      case "COMPLETED_WITH_ERRORS":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-red-100 text-red-700"
    }
  }

  // Convert technical error messages to user-friendly language
  const formatErrorMessage = (field: string, message: string) => {
    // Field-specific friendly messages
    const fieldMessages: Record<string, string> = {
      "Invoice No": "Invoice number",
      "Global ID": "Member ID (Global ID)",
      "Invoice Date": "Invoice date",
      "Month Total": "Total amount",
    }

    const friendlyField = fieldMessages[field] || field

    // Message translations
    if (message.includes("required")) {
      return `The ${friendlyField} is missing. Please add this information.`
    }
    if (message.includes("already exists")) {
      return `This invoice has already been uploaded before. Each invoice can only be uploaded once.`
    }
    if (message.includes("Duplicate")) {
      return `This invoice appears more than once in your file. Please remove the duplicate.`
    }
    if (message.includes("Invalid") && field === "Invoice Date") {
      return `The date format is not recognized. Please use DD/MM/YYYY format.`
    }
    if (message.includes("Invalid")) {
      return `The ${friendlyField} format is incorrect. Please check and correct it.`
    }
    if (message.includes("not found")) {
      return `The member with this ID was not found. They will be created automatically.`
    }

    // Default: return the original message
    return message
  }

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

      {/* Tabs - Only show History tab to Admin */}
      {isAdmin && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 inline-block mr-2" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            Upload History
          </button>
        </div>
      )}

      {/* Upload Tab Content */}
      {activeTab === "upload" && (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
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
      )}

      {/* Upload History Tab Content (Admin Only) */}
      {activeTab === "history" && isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <History className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upload History</h2>
                  <p className="text-sm text-gray-500">Manage past uploads - Delete to remove invoices and accruals</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{pagination.total} total uploads</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            </div>
          ) : uploads.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No uploads found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">File</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Records</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Invoices</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Accruals</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {uploads.map((upload) => (
                      <tr key={upload.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                              {upload.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-800">{upload.uploadMonth}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => upload.status === "COMPLETED_WITH_ERRORS" && upload.errors ? setErrorModal({ show: true, upload }) : null}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(upload.status)} ${upload.status === "COMPLETED_WITH_ERRORS" ? "cursor-pointer hover:opacity-80" : ""}`}
                          >
                            {getStatusIcon(upload.status)}
                            {upload.status.replace(/_/g, " ")}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-800">
                            {upload.successCount}/{upload.recordsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">{upload.invoiceCount}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">{upload.accrualCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-800 truncate max-w-[120px]">
                              {upload.user.name || upload.user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(upload.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setDeleteModal({ show: true, upload })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete this upload"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.upload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Upload</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this upload? This will permanently remove:
              </p>
              
              <div className="bg-red-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">File:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[200px]">{deleteModal.upload.fileName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Upload Month:</span>
                  <span className="font-medium text-gray-900">{deleteModal.upload.uploadMonth}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700">Invoices to delete:</span>
                  <span className="font-bold text-red-700">{deleteModal.upload.invoiceCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700">Accruals to delete:</span>
                  <span className="font-bold text-red-700">{deleteModal.upload.accrualCount}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Note: Members will not be deleted even if they have no other invoices.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, upload: null })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {errorModal.show && errorModal.upload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upload Issues</h2>
                  <p className="text-sm text-gray-500">{errorModal.upload.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ show: false, upload: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{errorModal.upload.successCount}</strong> out of <strong>{errorModal.upload.recordsCount}</strong> records were uploaded successfully. 
                  The following records had issues and were skipped:
                </p>
              </div>

              <div className="space-y-3">
                {(() => {
                  try {
                    const errors = JSON.parse(errorModal.upload.errors || "[]")
                    return errors.map((error: { row: number; field: string; message: string }, index: number) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-100 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-red-100 rounded">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Row {error.row}</p>
                            <p className="text-sm text-gray-700 mt-1">
                              {formatErrorMessage(error.field, error.message)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  } catch {
                    return (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{errorModal.upload.errors}</p>
                      </div>
                    )
                  }
                })()}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 How to fix these issues:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Check that all required fields (Invoice No, Invoice Date, Global ID, Month Total) are filled</li>
                  <li>Make sure dates are in a valid format (DD/MM/YYYY or Excel date format)</li>
                  <li>Verify that invoice numbers are unique and not already in the system</li>
                  <li>Ensure numeric fields (amounts, tax) contain only numbers</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setErrorModal({ show: false, upload: null })}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
