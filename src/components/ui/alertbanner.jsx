import React from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AlertBanner({ tipo = 'success', texto, onClose }) {
  if (!texto) return null

  const esExito = tipo === 'success'

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
      esExito 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}>
      <div className="flex items-center gap-3">
        {esExito ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        )}
        <span className="font-medium text-sm">{texto}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}