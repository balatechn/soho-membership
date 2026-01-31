"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  ChevronLeft,
  User,
  Shield
} from "lucide-react"
import toast from "react-hot-toast"

interface Message {
  id: string
  message: string
  isAdmin: boolean
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  messages: Message[]
  _count?: {
    messages: number
  }
}

interface TicketCounts {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
}

export default function SupportPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [counts, setCounts] = useState<TicketCounts>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [newTicketSubject, setNewTicketSubject] = useState("")
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [newTicketPriority, setNewTicketPriority] = useState("NORMAL")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  useEffect(() => {
    scrollToBottom()
  }, [selectedTicket?.messages])

  useEffect(() => {
    // Poll for new messages when a ticket is selected
    if (selectedTicket) {
      const interval = setInterval(() => {
        refreshSelectedTicket()
      }, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [selectedTicket?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/support?status=${statusFilter}`)
      const data = await response.json()
      setTickets(data.tickets || [])
      setCounts(data.counts || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 })
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
      toast.error("Failed to load support tickets")
    } finally {
      setLoading(false)
    }
  }

  const refreshSelectedTicket = async () => {
    if (!selectedTicket) return
    try {
      const response = await fetch(`/api/support?ticketId=${selectedTicket.id}`)
      const data = await response.json()
      if (data.ticket) {
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error("Failed to refresh ticket:", error)
    }
  }

  const selectTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support?ticketId=${ticketId}`)
      const data = await response.json()
      if (data.ticket) {
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error("Failed to load ticket:", error)
      toast.error("Failed to load ticket details")
    }
  }

  const createTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast.error("Please fill in subject and message")
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          subject: newTicketSubject,
          message: newTicketMessage,
          priority: newTicketPriority
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success("Support ticket created!")
      setShowNewTicket(false)
      setNewTicketSubject("")
      setNewTicketMessage("")
      setNewTicketPriority("NORMAL")
      fetchTickets()
      if (data.ticket) {
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error("Failed to create ticket:", error)
      toast.error("Failed to create ticket")
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setSending(true)
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          ticketId: selectedTicket.id,
          message: newMessage
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setNewMessage("")
      refreshSelectedTicket()
      fetchTickets()
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return

    try {
      const response = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success("Ticket status updated")
      refreshSelectedTicket()
      fetchTickets()
    } catch (error) {
      console.error("Failed to update ticket:", error)
      toast.error("Failed to update ticket")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-700"
      case "IN_PROGRESS": return "bg-amber-100 text-amber-700"
      case "RESOLVED": return "bg-green-100 text-green-700"
      case "CLOSED": return "bg-gray-100 text-gray-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "text-gray-500"
      case "NORMAL": return "text-blue-500"
      case "HIGH": return "text-amber-500"
      case "URGENT": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
          <p className="text-gray-500">
            {isAdmin ? "Manage support tickets from all users" : "Get help from our support team"}
          </p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Ticket List */}
        <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-100`}>
          {/* Status Filter */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "ALL", label: "All", count: counts.total },
                { value: "OPEN", label: "Open", count: counts.open },
                { value: "IN_PROGRESS", label: "In Progress", count: counts.inProgress },
                { value: "RESOLVED", label: "Resolved", count: counts.resolved },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    statusFilter === f.value
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No tickets found</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedTicket?.id === ticket.id ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                      {ticket.subject}
                    </h3>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {isAdmin && (
                      <span className="truncate">{ticket.user.name || ticket.user.email}</span>
                    )}
                    <span>•</span>
                    <span>{formatTime(ticket.updatedAt)}</span>
                    {ticket._count && (
                      <>
                        <span>•</span>
                        <span>{ticket._count.messages} msgs</span>
                      </>
                    )}
                  </div>
                  {ticket.messages[0] && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {ticket.messages[0].sender.name || 'User'}: {ticket.messages[0].message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white rounded-xl shadow-sm border border-gray-100`}>
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </span>
                      <span>•</span>
                      <span>{selectedTicket.user.name || selectedTicket.user.email}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(e.target.value)}
                      className={`px-3 py-1 text-sm rounded-full border-0 ${getStatusColor(selectedTicket.status)}`}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.senderId === session?.user?.id ? 'order-2' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.isAdmin ? (
                          <Shield className="w-4 h-4 text-amber-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-600">
                          {msg.sender.name || msg.sender.email}
                          {msg.isAdmin && <span className="text-amber-600 ml-1">(Support)</span>}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        msg.senderId === session?.user?.id
                          ? 'bg-amber-600 text-white'
                          : msg.isAdmin
                            ? 'bg-amber-50 text-gray-900 border border-amber-200'
                            : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedTicket.status !== "CLOSED" && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {selectedTicket.status === "CLOSED" && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-gray-500 text-sm">
                  This ticket has been closed
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">Select a ticket to view</p>
                <p className="text-sm">or create a new support ticket</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Support Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTicket(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                disabled={sending}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
