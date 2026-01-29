"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              contentStyle={{ 
                backgroundColor: "#1f2937", 
                border: "none", 
                borderRadius: "8px",
                color: "#fff" 
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#d97706" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface ProductChartProps {
  data: Array<{ product: string; count: number }>
}

export function ProductChart({ data }: ProductChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="count"
              nameKey="product"
              label={({ product, percent }) => `${product} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1f2937", 
                border: "none", 
                borderRadius: "8px",
                color: "#fff" 
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface QuarterlyChartProps {
  data: Array<{ quarter: string; revenue: number; netRevenue: number }>
}

export function QuarterlyChart({ data }: QuarterlyChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Revenue Comparison</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter" 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), ""]}
              contentStyle={{ 
                backgroundColor: "#1f2937", 
                border: "none", 
                borderRadius: "8px",
                color: "#fff" 
              }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Total Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netRevenue" name="Net Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface MemberStatusChartProps {
  data: {
    active: number
    expired: number
    renewed: number
    quarterly: number
    frozen: number
  }
}

export function MemberStatusChart({ data }: MemberStatusChartProps) {
  const chartData = [
    { name: "Active", value: data.active, color: "#10b981" },
    { name: "Expired", value: data.expired, color: "#ef4444" },
    { name: "Renewed", value: data.renewed, color: "#3b82f6" },
    { name: "Quarterly", value: data.quarterly, color: "#f59e0b" },
    { name: "Frozen", value: data.frozen, color: "#6b7280" },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Status Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1f2937", 
                border: "none", 
                borderRadius: "8px",
                color: "#fff" 
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
