import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { ProductVariant } from '@/types/product.types'
import { VARIANT_TYPES, getTypeByName, parseColour, composeColour } from './variant-types'

interface VariantManagerProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
}

export default function VariantManager({ variants, onVariantsChange }: VariantManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  
  // Inline validation summary (non-blocking; final validation occurs in modal submit)
  const validationMessage = useMemo(() => {
    if (!variants?.length) return ''
    const trim = (s?: string) => (s || '').trim()
    const requiredMissing = variants.some(v => !trim(v.option1Name) || !trim(v.option1Value))
    if (requiredMissing) return 'Each variant must include Option 1 name and value (e.g., Size: 8).'
    const seenSku = new Set<string>()
    for (const v of variants) {
      const sku = trim(v.sku).toLowerCase()
      if (!sku) continue
      if (seenSku.has(sku)) return 'Duplicate SKU detected. Ensure SKUs are unique.'
      seenSku.add(sku)
    }
    const sig = (v: ProductVariant) => [
      `${trim(v.option1Name).toLowerCase()}:${trim(v.option1Value).toLowerCase()}`,
      `${trim(v.option2Name).toLowerCase()}:${trim(v.option2Value).toLowerCase()}`,
      `${trim(v.option3Name).toLowerCase()}:${trim(v.option3Value).toLowerCase()}`,
    ].join('||')
    const seenSig = new Set<string>()
    for (const v of variants) {
      const s = sig(v)
      if (seenSig.has(s)) return 'Duplicate variant combination detected. Ensure each row is unique.'
      seenSig.add(s)
    }
    return ''
  }, [variants])

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      sku: '',
      option1Name: 'Size',
      option1Value: '',
      option2Name: '',
      option2Value: '',
      option3Name: '',
      option3Value: '',
      price: 0,
      inventoryQuantity: 0,
      position: variants.length,
      isDefault: variants.length === 0
    }
    onVariantsChange([...variants, newVariant])
    setEditingIndex(variants.length)
    setEditingVariant(newVariant)
  }

  const handleEditVariant = (index: number) => {
    setEditingIndex(index)
    // Ensure price is converted to a number when starting edit
    setEditingVariant({
      ...variants[index],
      price: typeof variants[index].price === 'number'
        ? variants[index].price
        : parseFloat(variants[index].price || '0') || 0
    })
  }

  const handleSaveVariant = () => {
    if (editingIndex !== null && editingVariant) {
      const updatedVariants = [...variants]
      updatedVariants[editingIndex] = editingVariant
      onVariantsChange(updatedVariants)
      setEditingIndex(null)
      setEditingVariant(null)
    }
  }

  const handleCancelEdit = () => {
    if (editingIndex === variants.length - 1 && !variants[editingIndex].sku) {
      // Remove the newly added empty variant
      onVariantsChange(variants.slice(0, -1))
    }
    setEditingIndex(null)
    setEditingVariant(null)
  }

  const handleDeleteVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index)
    // If we deleted the default variant and there are remaining variants, make the first one default
    if (variants[index].isDefault && updatedVariants.length > 0) {
      updatedVariants[0].isDefault = true
    }
    onVariantsChange(updatedVariants)
  }

  const handleSetDefault = (index: number) => {
    const updatedVariants = variants.map((v, i) => ({
      ...v,
      isDefault: i === index
    }))
    onVariantsChange(updatedVariants)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
        <button
          type="button"
          onClick={handleAddVariant}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Variant
        </button>
      </div>
      {validationMessage && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {validationMessage}
        </div>
      )}

      {variants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No variants added yet</p>
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first variant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Option
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant, index) => (
                <tr key={index}>
                  {editingIndex === index && editingVariant ? (
                    <>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="radio"
                          checked={editingVariant.isDefault}
                          onChange={() => setEditingVariant({ ...editingVariant, isDefault: true })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="text"
                          value={editingVariant.sku || ''}
                          onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                          className="w-40 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {(() => {
                          type NameKey = 'option1Name'|'option2Name'|'option3Name'
                          type ValueKey = 'option1Value'|'option2Value'|'option3Value'

                          const Chips = ({ items, onPick }: { items: string[]; onPick: (val: string) => void }) => (
                            <div className="flex flex-wrap gap-1">
                              {items.map((it) => (
                                <button key={it} type="button" onClick={() => onPick(it)} className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50">
                                  {it}
                                </button>
                              ))}
                            </div>
                          )

                          const TypeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
                            <select
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              className="w-28 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              {VARIANT_TYPES.map((t) => (
                                <option key={t.key} value={t.label}>{t.label}</option>
                              ))}
                            </select>
                          )

                          const renderOptionRow = (
                            optNameKey: NameKey,
                            optValueKey: ValueKey,
                            defaultNamePlaceholder: string,
                            defaultValuePlaceholder: string,
                          ) => {
                            const nameVal = (editingVariant as any)[optNameKey] || ''
                            const valueVal = (editingVariant as any)[optValueKey] || ''
                            const typeDef = getTypeByName(nameVal)

                            const setName = (newName: string) => setEditingVariant({ ...editingVariant!, [optNameKey]: newName })
                            const setValue = (newVal: string) => setEditingVariant({ ...editingVariant!, [optValueKey]: newVal })

                            const renderValueEditor = () => {
                              if (typeDef.key === 'colour') {
                                const { label, code } = parseColour(valueVal)
                                return (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={label}
                                      onChange={(e) => setValue(composeColour(e.target.value, code))}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="Colour name (e.g., Red)"
                                    />
                                    <input
                                      type="text"
                                      value={code}
                                      onChange={(e) => setValue(composeColour(label, e.target.value))}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="#RRGGBB"
                                    />
                                    <div className="w-6 h-6 rounded-full border border-gray-300" style={{ background: code || '#fff' }} />
                                  </div>
                                )
                              }

                              return (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={valueVal}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder={typeDef.placeholder || defaultValuePlaceholder}
                                  />
                                  {typeDef.suggestions && typeDef.suggestions.length > 0 && (
                                    <Chips items={typeDef.suggestions} onPick={(v) => setValue(v)} />
                                  )}
                                </div>
                              )
                            }

                            const renderGuideline = () => (
                              typeDef.valueHint ? (
                                <p className="text-xs text-gray-500">{typeDef.valueHint}</p>
                              ) : null
                            )

                            const isOther = typeDef.key === 'other'

                            return (
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <TypeSelect
                                    value={typeDef.label}
                                    onChange={(label) => {
                                      setName(label)
                                    }}
                                  />
                                  {isOther && (
                                    <input
                                      type="text"
                                      value={nameVal}
                                      onChange={(e) => setName(e.target.value)}
                                      className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder={defaultNamePlaceholder}
                                    />
                                  )}
                                  {renderValueEditor()}
                                </div>
                                {renderGuideline()}
                              </div>
                            )
                          }

                          return (
                            <div className="flex flex-col space-y-2">
                              {renderOptionRow('option1Name','option1Value','Option 1 (e.g., Size)','Value (e.g., 8)')}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          value={editingVariant.price || ''}
                          onChange={(e) => setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          value={editingVariant.inventoryQuantity || ''}
                          onChange={(e) => setEditingVariant({ ...editingVariant, inventoryQuantity: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleSaveVariant}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="radio"
                          checked={variant.isDefault}
                          onChange={() => handleSetDefault(index)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {variant.sku || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 max-w-[520px]">
                        {(() => {
                          const fmt = (name?: string, val?: string) => {
                            if (!name || !val) return null
                            const isColour = (name || '').trim().toLowerCase() === 'colour' || (name || '').trim().toLowerCase() === 'color'
                            if (isColour && val.includes('|')) {
                              const [label, code] = val.split('|')
                              return `${name}: ${label || ''}${code ? ` (${code})` : ''}`
                            }
                            return `${name}: ${val}`
                          }
                          const parts = [
                            fmt(variant.option1Name, variant.option1Value),
                            fmt(variant.option2Name, variant.option2Value),
                            fmt(variant.option3Name, variant.option3Value),
                          ].filter(Boolean) as string[]
                          return parts.length ? parts.join(' | ') : '-'
                        })()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        ${typeof variant.price === 'number' ? variant.price.toFixed(2) : parseFloat(variant.price || '0').toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {variant.inventoryQuantity || 0}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditVariant(index)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
