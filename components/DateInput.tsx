'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface DateInputProps {
  value: string // Format: YYYY-MM-DD
  onChange: (dateKey: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

// Format YYYY-MM-DD to DD/MM/YYYY
export const formatDateForDisplay = (dateKey: string) => {
  if (!dateKey) return ''
  const parts = dateKey.split('-')
  if (parts.length !== 3) return dateKey
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// Format Date object to DD/MM/YYYY
export const formatDateVN = (date: Date) => {
  if (!date || isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Format DD/MM/YYYY to YYYY-MM-DD
export const parseDisplayDate = (displayDate: string) => {
  if (!displayDate) return ''
  const parts = displayDate.split('/')
  if (parts.length !== 3) return ''
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

// Check if DD/MM/YYYY is valid date
export const isValidDisplayDate = (displayDate: string) => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  if (!displayDate.match(regex)) return false

  const parts = displayDate.split('/')
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)

  if (year < 1900 || year > 2100 || month === 0 || month > 12) return false

  const monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]

  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29
  }

  return day > 0 && day <= monthLength[month - 1]
}

// Parse YYYY-MM-DD to Date object avoiding UTC shift
export const parseLocalDate = (dateKey: string) => {
  if (!dateKey) return new Date()
  const parts = dateKey.split('-')
  if (parts.length !== 3) return new Date(dateKey) // fallback
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  required = false,
  className = ''
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Sync from props (DB format) to local display format
  useEffect(() => {
    if (value) {
      const formatted = formatDateForDisplay(value)
      if (formatted !== displayValue) {
        setDisplayValue(formatted)
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    // Auto-format DD/MM/YYYY
    raw = raw.replace(/[^\d/]/g, '')
    
    // Auto insert slashes
    if (raw.length === 2 && displayValue.length < 2) raw += '/'
    if (raw.length === 5 && displayValue.length < 5) raw += '/'
    
    if (raw.length > 10) raw = raw.slice(0, 10)

    setDisplayValue(raw)
    setError('')

    if (raw.length === 10) {
      if (isValidDisplayDate(raw)) {
        onChange(parseDisplayDate(raw))
      } else {
        setError('Ngày không hợp lệ (dd/mm/yyyy)')
      }
    } else {
      // If typing but incomplete, or cleared
      if (raw === '') onChange('')
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (displayValue && displayValue.length > 0 && displayValue.length < 10) {
      setError('Vui lòng nhập đủ ngày (dd/mm/yyyy)')
    } else if (displayValue.length === 10 && !isValidDisplayDate(displayValue)) {
      setError('Ngày không hợp lệ (dd/mm/yyyy)')
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-background border ${error ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 pl-10 text-foreground focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-primary/50'} ${className}`}
        />
        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  )
}
