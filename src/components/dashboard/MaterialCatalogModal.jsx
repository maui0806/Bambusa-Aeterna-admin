import { useMemo, useState } from 'react'

import {
  addMaterialNameFromAdmin,
  deleteMaterialName,
  updateMaterialName,
} from '@/services/materialCatalogService'

export function MaterialCatalogModal({ open, materials, adminUid, onClose, onChanged }) {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [materials],
  )

  const existingKeys = useMemo(
    () =>
      new Set(
        materials.map((m) => String(m.nameKey || m.name || '').trim().toLowerCase()).filter(Boolean),
      ),
    [materials],
  )

  if (!open) return null

  function clearMessages() {
    setError('')
    setNotice('')
  }

  async function onSave() {
    const normalized = input.trim().replace(/\s+/g, ' ')
    if (!normalized) {
      setError('Material name cannot be empty.')
      return
    }
    if (existingKeys.has(normalized.toLowerCase())) {
      setError('This material name already exists in the archive.')
      return
    }

    setSaving(true)
    clearMessages()
    try {
      await addMaterialNameFromAdmin(normalized, adminUid)
      setInput('')
      setNotice(`Added "${normalized}" to archive.`)
      onChanged?.()
    } catch (e) {
      setError(e?.message || 'Could not save material name.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(material) {
    clearMessages()
    setEditingId(material.id)
    setEditValue(material.name || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function onSaveEdit(materialId) {
    const normalized = editValue.trim().replace(/\s+/g, ' ')
    if (!normalized) {
      setError('Material name cannot be empty.')
      return
    }

    const otherKeys = new Set(
      materials
        .filter((m) => m.id !== materialId)
        .map((m) => String(m.nameKey || m.name || '').trim().toLowerCase()),
    )
    if (otherKeys.has(normalized.toLowerCase())) {
      setError('This material name already exists in the archive.')
      return
    }

    setSaving(true)
    clearMessages()
    try {
      await updateMaterialName(materialId, normalized, adminUid)
      setNotice(`Updated to "${normalized}".`)
      cancelEdit()
      onChanged?.()
    } catch (e) {
      setError(e?.message || 'Could not update material name.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(material) {
    const confirmed = window.confirm(`Remove "${material.name}" from the archive?`)
    if (!confirmed) return

    setSaving(true)
    clearMessages()
    try {
      await deleteMaterialName(material.id)
      if (editingId === material.id) cancelEdit()
      setNotice(`Removed "${material.name}".`)
      onChanged?.()
    } catch (e) {
      setError(e?.message || 'Could not delete material name.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Material Name Archive</h3>
            <p className="text-xs text-slate-500">
              Add, edit, or remove material names used by staff when registering vehicles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Add material name</span>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Steel Rods 12mm"
                disabled={saving}
              />
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </label>

          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {notice ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
          ) : null}

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Archived Names ({sortedMaterials.length})
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {sortedMaterials.length === 0 ? (
                <div className="text-sm text-slate-500">No material names yet.</div>
              ) : (
                sortedMaterials.map((material) => {
                  const isEditing = editingId === material.id
                  return (
                    <div
                      key={material.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            disabled={saving}
                          />
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onSaveEdit(material.id)}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={cancelEdit}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-800">{material.name}</span>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => startEdit(material)}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onDelete(material)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
