import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { ProductVariant } from '@/types/product.types'
import { VARIANT_TYPES, getTypeByName, parseColour, composeColour } from './variant-types'

interface VariantManagerProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  onEditingStateChange?: (hasUnsavedVariant: boolean, editingIndex: number | null) => void
  triggerShake?: boolean
}

interface VariantGroup {
  groupName: string
  variants: ProductVariant[]
  indices: number[] // Original indices in the variants array
}

export default function VariantManager({ variants, onVariantsChange, onEditingStateChange, triggerShake }: VariantManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedVariantType, setSelectedVariantType] = useState<string>('')
  const [showAddGroupForm, setShowAddGroupForm] = useState(false)
  const [editingErrors, setEditingErrors] = useState<Record<string, string>>({})
  const [newlyCreatedIndices, setNewlyCreatedIndices] = useState<Set<number>>(new Set())
  const [newlyCreatedGroups, setNewlyCreatedGroups] = useState<Set<string>>(new Set())
  const [groupCreationOrder, setGroupCreationOrder] = useState<Map<string, number>>(new Map())
  const groupCreationCounterRef = React.useRef(0)
  const [shouldShake, setShouldShake] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string>('')
  const [savedVariantIndex, setSavedVariantIndex] = useState<number | null>(null)
  const [showValidationMessage, setShowValidationMessage] = useState(false)
  const variantRowRefs = React.useRef<Map<number, HTMLTableRowElement>>(new Map())
  
  // Notify parent when editing state changes
  useEffect(() => {
    if (onEditingStateChange) {
      onEditingStateChange(editingIndex !== null, editingIndex)
    }
  }, [editingIndex, onEditingStateChange])
  
  // Group variants by option1Name
  const groupedVariants = useMemo(() => {
    const groups = new Map<string, VariantGroup>()
    const ungrouped: VariantGroup = { groupName: '', variants: [], indices: [] }
    
    variants.forEach((variant, index) => {
      const groupName = (variant.option1Name || '').trim()
      if (!groupName) {
        ungrouped.variants.push(variant)
        ungrouped.indices.push(index)
      } else {
        if (!groups.has(groupName)) {
          groups.set(groupName, { groupName, variants: [], indices: [] })
        }
        const group = groups.get(groupName)!
        group.variants.push(variant)
        group.indices.push(index)
      }
    })
    
    const result: VariantGroup[] = Array.from(groups.values())
    if (ungrouped.variants.length > 0) {
      result.push(ungrouped)
    }
    
    // Sort groups: newly created groups first (most recent at top), then alphabetically
    result.sort((a, b) => {
      if (!a.groupName) return 1
      if (!b.groupName) return -1
      
      const aIsNew = newlyCreatedGroups.has(a.groupName)
      const bIsNew = newlyCreatedGroups.has(b.groupName)
      
      // Newly created groups come first
      if (aIsNew && !bIsNew) return -1
      if (!aIsNew && bIsNew) return 1
      
      // If both are newly created, sort by creation order (most recent first)
      if (aIsNew && bIsNew) {
        const aOrder = groupCreationOrder.get(a.groupName) || 0
        const bOrder = groupCreationOrder.get(b.groupName) || 0
        return bOrder - aOrder // Higher order (more recent) comes first
      }
      
      // If both are not new, sort alphabetically
      return a.groupName.localeCompare(b.groupName)
    })
    
    return result
  }, [variants, newlyCreatedGroups, groupCreationOrder])

  // Groups start collapsed by default - removed auto-expand
  // Users can manually expand groups by clicking on them

  // Helper function to check if variant is empty
  const isVariantEmpty = (variant: ProductVariant): boolean => {
    const trim = (s?: string) => (s || '').trim()
    // Check if variant has no meaningful data (no option1Value is the key indicator)
    return !trim(variant.option1Value) && !trim(variant.sku)
  }

  // Cleanup: Remove empty newly created variants when editing stops (if not saved)
  React.useEffect(() => {
    if (editingIndex === null && newlyCreatedIndices.size > 0) {
      // Check if any newly created variants are still empty and remove them
      const emptyIndices: number[] = []
      newlyCreatedIndices.forEach(index => {
        if (index < variants.length) {
          const variant = variants[index]
          if (isVariantEmpty(variant)) {
            emptyIndices.push(index)
          }
        }
      })
      
      if (emptyIndices.length > 0) {
        // Remove empty variants in reverse order to maintain correct indices
        emptyIndices.sort((a, b) => b - a)
        let updatedVariants = [...variants]
        emptyIndices.forEach(index => {
          updatedVariants = updatedVariants.filter((_, i) => i !== index)
        })
        onVariantsChange(updatedVariants)
        
        // Clear the newly created indices
        setNewlyCreatedIndices(prev => {
          const next = new Set(prev)
          emptyIndices.forEach(idx => next.delete(idx))
          return next
        })
      }
    }
  }, [editingIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  // Inline validation summary - only validate saved variants, not ones being edited
  const validationMessage = useMemo(() => {
    if (!variants?.length) return ''
    
    // Filter out variants that are currently being edited (newly created or being modified)
    const savedVariants = variants.filter((_, index) => 
      !newlyCreatedIndices.has(index) && editingIndex !== index
    )
    if (!savedVariants.length) return '' // No saved variants to validate
    
    const trim = (s?: string) => (s || '').trim()
    const requiredMissing = savedVariants.some(v => !trim(v.option1Name) || !trim(v.option1Value))
    if (requiredMissing) return 'Each variant must include Option 1 name and value (e.g., Size: 8).'
    const seenSku = new Set<string>()
    for (const v of savedVariants) {
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
    for (const v of savedVariants) {
      const s = sig(v)
      if (seenSig.has(s)) return 'Duplicate variant combination detected. Ensure each row is unique.'
      seenSig.add(s)
    }
    return ''
  }, [variants, newlyCreatedIndices, editingIndex])

  // Auto-show and auto-hide validation message
  useEffect(() => {
    if (validationMessage) {
      setShowValidationMessage(true)
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setShowValidationMessage(false)
      }, 4000)
      return () => clearTimeout(timer)
    } else {
      setShowValidationMessage(false)
    }
  }, [validationMessage])

  const handleAddVariantToGroup = (groupName: string) => {
    // If there's an unsaved variant being edited, prevent new variant creation
    if (editingIndex !== null) {
      // Show message and scroll to the pending variant
      setPendingMessage('Please save or cancel the current variant before adding a new one')
      scrollToVariant(editingIndex)
      
      // Clear message after 4 seconds
      setTimeout(() => setPendingMessage(''), 4000)
      return
    }
    
    const newVariant: ProductVariant = {
      sku: '',
      option1Name: groupName,
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
    // Find the index of the newly added variant
    const newIndex = variants.length
    setNewlyCreatedIndices(prev => new Set(prev).add(newIndex))
    setEditingIndex(newIndex)
    setEditingVariant(newVariant)
    // Expand the group
    setExpandedGroups(prev => new Set(prev).add(groupName))
    setPendingMessage('') // Clear any pending messages
  }

  // Get existing group names to prevent duplicates
  const existingGroupNames = useMemo(() => {
    return new Set(groupedVariants.map(g => g.groupName).filter(Boolean))
  }, [groupedVariants])

  const scrollToVariant = useCallback((index: number) => {
    // Find which group this variant belongs to and expand it
    const variant = variants[index]
    const groupName = (variant.option1Name || '').trim()
    if (groupName) {
      setExpandedGroups(prev => new Set(prev).add(groupName))
    }
    
    // Wait a bit for the group to expand, then scroll
    setTimeout(() => {
      const rowElement = variantRowRefs.current.get(index)
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Trigger shake animation
        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 1000)
      }
    }, 100)
  }, [variants])

  // Trigger shake when parent requests it
  useEffect(() => {
    if (triggerShake && editingIndex !== null) {
      scrollToVariant(editingIndex)
    }
  }, [triggerShake, editingIndex, scrollToVariant])

  const handleAddNewGroup = () => {
    if (!selectedVariantType.trim()) return
    
    // Check if group already exists
    if (existingGroupNames.has(selectedVariantType.trim())) {
      return
    }
    
    // If there's an unsaved variant being edited, prevent new group creation
    if (editingIndex !== null) {
      // Show message and scroll to the pending variant
      setPendingMessage('Please save or cancel the current variant before creating a new group')
      scrollToVariant(editingIndex)
      
      // Clear message after 4 seconds
      setTimeout(() => setPendingMessage(''), 4000)
      return
    }
    
    const newVariant: ProductVariant = {
      sku: '',
      option1Name: selectedVariantType.trim(),
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
    const newIndex = variants.length
    const groupName = selectedVariantType.trim()
    setNewlyCreatedIndices(prev => new Set(prev).add(newIndex))
    setNewlyCreatedGroups(prev => new Set(prev).add(groupName))
    // Track creation order (increment counter for most recent)
    groupCreationCounterRef.current += 1
    setGroupCreationOrder(prev => {
      const next = new Map(prev)
      next.set(groupName, groupCreationCounterRef.current)
      return next
    })
    setEditingIndex(newIndex)
    setEditingVariant(newVariant)
    setSelectedVariantType('')
    setShowAddGroupForm(false)
    setExpandedGroups(prev => new Set(prev).add(groupName))
    setPendingMessage('') // Clear any pending messages
  }

  const handleEditVariant = (index: number) => {
    setEditingIndex(index)
    setEditingVariant({
      ...variants[index],
      price: typeof variants[index].price === 'number'
        ? variants[index].price
        : parseFloat(variants[index].price || '0') || 0
    })
    setEditingErrors({}) // Clear errors when starting to edit
  }

  const validateVariant = (variant: ProductVariant): Record<string, string> => {
    const errors: Record<string, string> = {}
    const trim = (s?: string) => (s || '').trim()
    
    // Required: option1Name and option1Value must be filled
    if (!trim(variant.option1Name)) {
      errors.option1Name = 'Required'
    }
    
    if (!trim(variant.option1Value)) {
      errors.option1Value = 'Required'
    }
    
    // If "Other" is selected, custom name must be provided
    const typeDef = getTypeByName(variant.option1Name)
    if (typeDef.key === 'other' && !trim(variant.option1Name)) {
      errors.option1Name = 'Please enter a custom variant type name'
    }
    
    // Price should be valid (greater than or equal to 0)
    if (variant.price !== undefined && variant.price < 0) {
      errors.price = 'Price cannot be negative'
    }
    
    // Inventory should be valid (greater than or equal to 0)
    if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity < 0) {
      errors.inventoryQuantity = 'Inventory cannot be negative'
    }
    
    return errors
  }

  const handleSaveVariant = () => {
    if (editingIndex === null || !editingVariant) return
    
    // Validate the variant
    const errors = validateVariant(editingVariant)
    
    if (Object.keys(errors).length > 0) {
      // Show errors and don't save
      setEditingErrors(errors)
      return
    }
    
    // Clear errors
    setEditingErrors({})
    
    // Save the variant
    const updatedVariants = [...variants]
    updatedVariants[editingIndex] = editingVariant
    onVariantsChange(updatedVariants)
    
    // Mark as no longer newly created (it's been saved)
    setNewlyCreatedIndices(prev => {
      const next = new Set(prev)
      next.delete(editingIndex)
      return next
    })
    
    // Trigger green blink animation on the saved row
    setSavedVariantIndex(editingIndex)
    setTimeout(() => {
      setSavedVariantIndex(null)
    }, 2000) // Animation duration
    
    setEditingIndex(null)
    setEditingVariant(null)
    setPendingMessage('') // Clear pending message on save
  }

  const handleCancelEdit = () => {
    if (editingIndex !== null) {
      const variant = variants[editingIndex]
      const isEmpty = isVariantEmpty(variant)
      const isNewlyCreated = newlyCreatedIndices.has(editingIndex)
      const groupName = (variant.option1Name || '').trim()
      
      // If it's a newly created variant and still empty, remove it
      if (isNewlyCreated && isEmpty) {
        const updatedVariants = variants.filter((_, i) => i !== editingIndex)
        onVariantsChange(updatedVariants)
        setNewlyCreatedIndices(prev => {
          const next = new Set(prev)
          next.delete(editingIndex)
          return next
        })
        
        // If this was the only variant in a newly created group, remove the group from newlyCreatedGroups
        if (groupName) {
          const hasOtherVariants = updatedVariants.some(v => (v.option1Name || '').trim() === groupName)
          if (!hasOtherVariants) {
            setNewlyCreatedGroups(prev => {
              const next = new Set(prev)
              next.delete(groupName)
              return next
            })
            setGroupCreationOrder(prev => {
              const next = new Map(prev)
              next.delete(groupName)
              return next
            })
          }
        }
      }
    }
    setEditingIndex(null)
    setEditingVariant(null)
    setEditingErrors({}) // Clear errors on cancel
    setPendingMessage('') // Clear pending message on cancel
  }

  const handleDeleteVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index)
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

  const renderVariantRow = (variant: ProductVariant, index: number, isEditing: boolean) => {
    if (isEditing && editingVariant) {
      type NameKey = 'option1Name'|'option2Name'|'option3Name'
      type ValueKey = 'option1Value'|'option2Value'|'option3Value'

      const Chips = ({ items, onPick }: { items: string[]; onPick: (val: string) => void }) => (
        <div className="flex flex-wrap gap-0.5">
          {items.map((it) => (
            <button key={it} type="button" onClick={() => onPick(it)} className="px-1.5 py-0.5 text-[10px] border rounded hover:bg-gray-50 whitespace-nowrap">
              {it}
            </button>
          ))}
        </div>
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
        const nameError = editingErrors[optNameKey]
        const valueError = editingErrors[optValueKey]
        
        // Check if this variant belongs to a group (has option1Name that matches a group)
        // If it does, the variant type should be read-only (display as text)
        const isInGroup = optNameKey === 'option1Name' && nameVal.trim() && existingGroupNames.has(nameVal.trim())
        const isLocked = isInGroup // Lock the variant type if it's in a group

        const setName = (newName: string) => {
          if (isLocked) return // Don't allow changing if locked
          setEditingVariant({ ...editingVariant!, [optNameKey]: newName })
          // Clear error when user starts typing
          if (editingErrors[optNameKey]) {
            setEditingErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors[optNameKey]
              return newErrors
            })
          }
        }
        const setValue = (newVal: string) => {
          setEditingVariant({ ...editingVariant!, [optValueKey]: newVal })
          // Clear error when user starts typing
          if (editingErrors[optValueKey]) {
            setEditingErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors[optValueKey]
              return newErrors
            })
          }
        }

        const renderValueEditor = () => {
          if (typeDef.key === 'colour') {
            const { label, code } = parseColour(valueVal)
            return (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setValue(composeColour(e.target.value, code))}
                  className={`w-20 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                    valueError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Colour name"
                />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setValue(composeColour(label, e.target.value))}
                  className={`w-16 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                    valueError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="#RRGGBB"
                />
                <div className="w-5 h-5 rounded-full border border-gray-300" style={{ background: code || '#fff' }} />
              </div>
            )
          }

          return (
            <div className="flex flex-col">
              <input
                type="text"
                value={valueVal}
                onChange={(e) => setValue(e.target.value)}
                className={`w-28 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                  valueError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={typeDef.placeholder || defaultValuePlaceholder}
              />
              {typeDef.suggestions && typeDef.suggestions.length > 0 && (
                <div className="mt-0.5">
                  <Chips items={typeDef.suggestions} onPick={(v) => setValue(v)} />
                </div>
              )}
            </div>
          )
        }

        const isOther = typeDef.key === 'other'
        const hasChips = typeDef.suggestions && typeDef.suggestions.length > 0
        const hasError = !!(nameError || valueError)

        return (
          <div className="relative">
            <div className="flex items-start space-x-1.5 flex-wrap">
              <div className="relative flex-shrink-0">
                {isLocked ? (
                  // Display as read-only text if variant is in a group
                  <div className="w-24 px-1.5 py-0.5 border border-gray-300 rounded-md bg-gray-50 text-xs text-gray-700 font-medium flex items-center">
                    {nameVal || typeDef.label}
                  </div>
                ) : (
                  // Show dropdown only if not in a group
                  <div className="flex flex-col">
                    <select
                      value={typeDef.label}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-24 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                        nameError ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {VARIANT_TYPES.map((t) => (
                        <option key={t.key} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                    {nameError && (
                      <div className="mt-0.5">
                        <span className="text-[10px] text-red-600">{nameError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isOther && !isLocked && (
                <div className="relative flex-shrink-0 flex flex-col">
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-28 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                      nameError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={defaultNamePlaceholder}
                  />
                  {nameError && (
                    <div className="mt-0.5">
                      <span className="text-[10px] text-red-600">{nameError}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="relative flex-shrink-0 flex flex-col">
                {renderValueEditor()}
                {valueError && (
                  <div className="mt-0.5">
                    <span className="text-[10px] text-red-600">{valueError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      return (
        <>
          <td className="px-2 py-1.5 align-top">
            <div className="flex items-center">
              <input
                type="radio"
                checked={editingVariant.isDefault}
                onChange={() => setEditingVariant({ ...editingVariant, isDefault: true })}
                className="h-3.5 w-3.5 text-orange-600 focus:ring-orange-500 border-gray-300"
              />
            </div>
          </td>
          <td className="px-2 py-1.5 align-top">
            <div className="relative">
              <input
                type="text"
                value={editingVariant.sku || ''}
                onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                className="w-28 px-1.5 py-0.5 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs"
                placeholder="SKU"
              />
            </div>
          </td>
          <td className="px-2 py-1.5 align-top">
            <div className="relative">
              {renderOptionRow('option1Name','option1Value','Option 1 (e.g., Size)','Value (e.g., 8)')}
            </div>
          </td>
          <td className="px-2 py-1.5 align-top">
            <div className="relative flex flex-col">
              <input
                type="number"
                value={editingVariant.price || ''}
                onChange={(e) => {
                  setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) || 0 })
                  if (editingErrors.price) {
                    setEditingErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.price
                      return newErrors
                    })
                  }
                }}
                className={`w-20 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                  editingErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
              />
              {editingErrors.price && (
                <div className="mt-0.5">
                  <span className="text-[10px] text-red-600">{editingErrors.price}</span>
                </div>
              )}
            </div>
          </td>
          <td className="px-2 py-1.5 align-top">
            <div className="relative flex flex-col">
              <input
                type="number"
                value={editingVariant.inventoryQuantity || ''}
                onChange={(e) => {
                  setEditingVariant({ ...editingVariant, inventoryQuantity: parseInt(e.target.value) || 0 })
                  if (editingErrors.inventoryQuantity) {
                    setEditingErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.inventoryQuantity
                      return newErrors
                    })
                  }
                }}
                className={`w-16 px-1.5 py-0.5 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-xs ${
                  editingErrors.inventoryQuantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {editingErrors.inventoryQuantity && (
                <div className="mt-0.5">
                  <span className="text-[10px] text-red-600">{editingErrors.inventoryQuantity}</span>
                </div>
              )}
            </div>
          </td>
          <td className="px-2 py-1.5 whitespace-nowrap">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleSaveVariant}
                className="text-green-600 hover:text-green-900 transition-colors"
                title="Save"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </td>
        </>
      )
    }

    // Display mode
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

    return (
      <>
        <td className="px-2 py-1.5 whitespace-nowrap">
          <input
            type="radio"
            checked={variant.isDefault || false}
            onChange={() => handleSetDefault(index)}
            className="h-3.5 w-3.5 text-orange-600 focus:ring-orange-500 border-gray-300"
          />
        </td>
        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
          {variant.sku || '-'}
        </td>
        <td className="px-2 py-1.5 text-xs text-gray-900">
          {parts.length ? (
            <div className="flex flex-wrap gap-0.5">
              {parts.map((part, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">
                  {part}
                </span>
              ))}
            </div>
          ) : (
            '-'
          )}
        </td>
        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 font-medium">
          ${typeof variant.price === 'number' ? variant.price.toFixed(2) : parseFloat(variant.price || '0').toFixed(2)}
        </td>
        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
            (variant.inventoryQuantity || 0) > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {variant.inventoryQuantity || 0}
          </span>
        </td>
        <td className="px-2 py-1.5 whitespace-nowrap">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => handleEditVariant(index)}
              className="text-orange-600 hover:text-orange-900 transition-colors"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteVariant(index)}
              className="text-red-600 hover:text-red-900 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes greenBlink {
          0% { background-color: transparent; }
          50% { background-color: rgba(187, 247, 208, 0.3); }
          100% { background-color: transparent; }
        }
        .animate-green-blink {
          animation: greenBlink 1.5s ease-in-out;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-700 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-orange-600" />
          Product Variants
        </h3>
        <button
          type="button"
          onClick={() => {
            // If there's an unsaved variant, prevent opening form and scroll to it
            if (editingIndex !== null) {
              setPendingMessage('Please save or cancel the current variant before creating a new group')
              scrollToVariant(editingIndex)
              setTimeout(() => setPendingMessage(''), 4000)
              return
            }
            setShowAddGroupForm(!showAddGroupForm)
          }}
          className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none    transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Group
        </button>
      </div>

      {showAddGroupForm && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-1.5">
            <div className="flex-1 relative">
              <select
                value={selectedVariantType}
                onChange={(e) => setSelectedVariantType(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg  focus:border-orange-500 text-xs bg-white text-gray-700 shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select variant type...</option>
                {VARIANT_TYPES.map((type) => {
                  const isDisabled = existingGroupNames.has(type.label)
                  return (
                    <option
                      key={type.key}
                      value={type.label}
                      disabled={isDisabled}
                    >
                      {type.label}{isDisabled ? ' (already exists)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddNewGroup}
              disabled={!selectedVariantType.trim() || existingGroupNames.has(selectedVariantType.trim())}
              className="px-2.5 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddGroupForm(false)
                setSelectedVariantType('')
              }}
              className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pendingMessage && (
        <div className="sticky top-0 z-50 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 flex items-center space-x-1.5  shadow-md mb-2">
          <span className="font-medium">⚠️</span>
          <span>{pendingMessage}</span>
        </div>
      )}

      {validationMessage && showValidationMessage && (
        <div className="sticky top-0 z-50 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 flex items-center space-x-1.5 shadow-md mb-2">
          <span className="font-medium">⚠️</span>
          <span>{validationMessage}</span>
        </div>
      )}

      {groupedVariants.length === 0 ? (
        <div className="text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ">
          <Layers className="w-10 h-5 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 mb-1.5 font-medium text-sm">No variants added yet</p>
          <button
            type="button"
            onClick={() => setShowAddGroupForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create your first variant group
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {groupedVariants.map((group) => {
            const isExpanded = expandedGroups.has(group.groupName)
            const groupDisplayName = group.groupName || 'Ungrouped'
            const variantCount = group.variants.length

            return (
              <div key={group.groupName || 'ungrouped'} className="border-b border-gray-200 last:border-b-0">
                {/* Group Header */}
                <div
                  className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => group.groupName && toggleGroup(group.groupName)}
                >
                  <div className="px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      {group.groupName ? (
                        <button
                          type="button"
                          className="flex items-center space-x-1.5 text-left flex-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="font-semibold text-xs text-gray-700">{groupDisplayName}</span>
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-medium">
                            {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 flex-1">
                          <span className="font-semibold text-xs text-gray-900">{groupDisplayName}</span>
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-[10px] font-medium">
                            {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                          </span>
                        </div>
                      )}
                    </div>
                    {group.groupName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddVariantToGroup(group.groupName)
                        }}
                        className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Variant</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Group Content - Expandable */}
                {(!group.groupName || isExpanded) && (
                  <div className="bg-white">
                    <div className={`overflow-x-auto ${shouldShake ? 'hide-scrollbar' : ''}`}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Default
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              SKU
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Variant Value
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Inventory
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.variants.map((variant, groupIndex) => {
                            const globalIndex = group.indices[groupIndex]
                            const isEditing = editingIndex === globalIndex
                            const isShaking = shouldShake && isEditing
                            const isSaved = savedVariantIndex === globalIndex
                            return (
                              <tr
                                key={globalIndex}
                                ref={(el) => {
                                  if (el) {
                                    variantRowRefs.current.set(globalIndex, el)
                                  } else {
                                    variantRowRefs.current.delete(globalIndex)
                                  }
                                }}
                                className={`hover:bg-gray-50 transition-all ${
                                  isEditing ? 'bg-orange-50' : ''
                                } ${
                                  isShaking ? 'animate-shake' : ''
                                } ${
                                  isSaved ? 'animate-green-blink' : ''
                                }`}
                              >
                                {renderVariantRow(variant, globalIndex, isEditing)}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </>
  )
}