'use client'

import toast from 'react-hot-toast'

interface ConfirmOpts {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

/**
 * Promise-based confirm rendered as a react-hot-toast card instead of the
 * native window.confirm(). Resolves true on confirm, false on cancel/dismiss.
 */
export function confirmToast({
  message,
  confirmLabel = 'Sí, continuar',
  cancelLabel = 'Cancelar',
  danger = true,
}: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id)
                resolve(false)
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id)
                resolve(true)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                danger
                  ? 'bg-gradient-to-r from-[#d81b60] to-[#8e44ad] hover:shadow-md'
                  : 'bg-[#8e44ad] hover:bg-[#7d3c9d]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, style: { maxWidth: 360 } }
    )
  })
}
