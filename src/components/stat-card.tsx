"use client"

import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  format?: "currency" | "number" | "percent"
}

export function StatCard({ title, value, change, changeLabel, icon, format = "number" }: StatCardProps) {
  const formattedValue = format === "currency" 
    ? formatCurrency(Number(value)) 
    : format === "percent"
    ? `${value}%`
    : value.toLocaleString("en-IN")

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{formattedValue}</p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : change < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-gray-400" />
          )}
          <span className={cn(
            "text-sm font-medium",
            change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-500"
          )}>
            {change > 0 ? "+" : ""}{change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
