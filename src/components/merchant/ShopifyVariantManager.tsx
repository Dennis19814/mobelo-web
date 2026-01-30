'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, GripVertical, AlertCircle, Check, X, Search, Filter, ChevronDown, ChevronUp, Image as ImageIcon, MoreVertical } from 'lucide-react'
import { ProductVariant } from '@/types/product.types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ShopifyVariantManagerProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  onEditingStateChange?: (hasUnsavedVariant: boolean, editingIndex: number | null) => void
  triggerShake?: boolean
}

interface VariantOption {
  id: string
  name: string
  values: string[]
  isEditing: boolean
}

// Draggable Option Component
function DraggableOption({
  option,
  editingOptionId,
  validationErrors,
  onOptionNameChange,
  onOptionValueChange,
  onRemoveOptionValue,
  onDone,
  onDelete,
  onEdit,
  onValueDragEnd,
  onValueDragStart,
}: {
  option: VariantOption
  editingOptionId: string | null
  validationErrors: Record<string, { name?: boolean; values?: boolean; duplicateName?: string; duplicateValues?: Record<number, string> }>
  onOptionNameChange: (optionId: string, name: string) => void
  onOptionValueChange: (optionId: string, valueIndex: number, value: string) => void
  onRemoveOptionValue: (optionId: string, valueIndex: number) => void
  onDone: (optionId: string) => void
  onDelete: (optionId: string) => void
  onEdit: (optionId: string) => void
  onValueDragEnd: (event: DragEndEvent, optionId: string) => void
  onValueDragStart: (optionId: string) => void
}) {
  const isCurrentlyEditing = option.isEditing && editingOptionId === option.id
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: option.id,
    disabled: option.isEditing, // Disable drag when editing
  })

  const valueSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 transition-all duration-200 ${
        isCurrentlyEditing 
          ? 'border-orange-300' 
          : `border-gray-200 ${isDragging ? 'shadow-md' : ''}`
      }`}
    >
      {option.isEditing ? (
        // Editing Mode
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Option name
            </label>
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={option.name}
                onChange={(e) => onOptionNameChange(option.id, e.target.value)}
                className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${
                  (validationErrors[option.id]?.name || validationErrors[option.id]?.duplicateName) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                } focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                placeholder="e.g., Size"
              />
            </div>
            {validationErrors[option.id]?.duplicateName && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>You've already used the option name '{validationErrors[option.id].duplicateName}'.</span>
              </div>
            )}
            {validationErrors[option.id]?.name && !validationErrors[option.id]?.duplicateName && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Option name is required.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Option values
            </label>
            <DndContext
              sensors={valueSensors}
              collisionDetection={closestCenter}
              onDragStart={() => onValueDragStart(option.id)}
              onDragEnd={(event) => onValueDragEnd(event, option.id)}
            >
              <SortableContext
                items={option.values.map((_, idx) => `value-${option.id}-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {option.values.map((value, index) => (
                    <div key={`value-${option.id}-${index}`}>
                      <DraggableValue
                        id={`value-${option.id}-${index}`}
                        value={value}
                        optionId={option.id}
                        index={index}
                        canDelete={option.values.length > 1}
                        onChange={(newValue) => onOptionValueChange(option.id, index, newValue)}
                        onDelete={() => onRemoveOptionValue(option.id, index)}
                        onAddAnother={() => onOptionValueChange(option.id, option.values.length, '')}
                        showAddAnother={index === option.values.length - 1 && value.length > 0}
                        placeholder={index === 0 ? "e.g., Medium" : "Add another value"}
                        hasError={!!validationErrors[option.id]?.duplicateValues?.[index]}
                      />
                      {validationErrors[option.id]?.duplicateValues?.[index] && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>You've already used the option value "{validationErrors[option.id].duplicateValues![index]}".</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {validationErrors[option.id]?.values && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>At least one option value is required.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onDelete(option.id)}
              className="px-4 py-1.5 text-sm text-red-600 border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => onDone(option.id)}
              disabled={
                !option.name.trim() || 
                option.values.filter(v => v.trim()).length === 0 ||
                !!validationErrors[option.id]?.duplicateName ||
                (validationErrors[option.id]?.duplicateValues && Object.keys(validationErrors[option.id].duplicateValues!).length > 0)
              }
              className="px-4 py-1.5 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        // Collapsed Mode
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-move hover:text-gray-700 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{option.name}</span>
            {option.values.filter(v => v.trim()).map((value, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-sm border border-gray-200"
              >
                {value}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onEdit(option.id)}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={editingOptionId !== null}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

// Draggable Value Component
function DraggableValue({
  id,
  value,
  optionId,
  index,
  canDelete,
  onChange,
  onDelete,
  onAddAnother,
  showAddAnother,
  placeholder,
  hasError,
}: {
  id: string
  value: string
  optionId: string
  index: number
  canDelete: boolean
  onChange: (value: string) => void
  onDelete: () => void
  onAddAnother: () => void
  showAddAnother: boolean
  placeholder: string
  hasError?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2"
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-move hover:text-gray-700 touch-none flex-shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${
            hasError 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          } focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
          placeholder={placeholder}
        />
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {showAddAnother && (
        <button
          type="button"
          onClick={onAddAnother}
          className="mt-2 text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add another value
        </button>
      )}
    </>
  )
}

export default function ShopifyVariantManager({
  variants,
  onVariantsChange,
  onEditingStateChange,
  triggerShake
}: ShopifyVariantManagerProps) {
  const [options, setOptions] = useState<VariantOption[]>([])
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<string>('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>({})
  const [variantInventory, setVariantInventory] = useState<Record<string, number>>({})
  const [expandAll, setExpandAll] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, { name?: boolean; values?: boolean; duplicateName?: string; duplicateValues?: Record<number, string> }>>({})
  const [draggedValueOptionId, setDraggedValueOptionId] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const [editingGroupPrice, setEditingGroupPrice] = useState<string | null>(null)
  
  // Refs for callbacks to prevent infinite loops
  const prevEditingStateRef = useRef<boolean>(false)
  const onEditingStateChangeRef = useRef(onEditingStateChange)
  const onVariantsChangeRef = useRef(onVariantsChange)
  
  // Update refs when callbacks change
  useEffect(() => {
    onEditingStateChangeRef.current = onEditingStateChange
    onVariantsChangeRef.current = onVariantsChange
  }, [onEditingStateChange, onVariantsChange])
  
  // Initialize editing state to false on mount
  useEffect(() => {
    if (onEditingStateChangeRef.current && !prevEditingStateRef.current) {
      onEditingStateChangeRef.current(false, null)
      prevEditingStateRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getVariantKey = (variant: ProductVariant): string => {
    const parts: string[] = []
    if (variant.option1Name && variant.option1Value) parts.push(`${variant.option1Name}:${variant.option1Value}`)
    if (variant.option2Name && variant.option2Value) parts.push(`${variant.option2Name}:${variant.option2Value}`)
    if (variant.option3Name && variant.option3Value) parts.push(`${variant.option3Name}:${variant.option3Value}`)
    return parts.join('|')
  }

  // Initialize options from variants - handle async loading
  const [isInitialized, setIsInitialized] = useState(false)
  const prevVariantsLengthRef = useRef<number>(0)
  const processedVariantsHashRef = useRef<string>('')
  
  useEffect(() => {
    // Create a hash of variant keys to detect actual changes
    const variantsHash = variants.map(v => getVariantKey(v)).sort().join('|')
    
    // Process variants if:
    // 1. We have variants but haven't initialized options yet (initial load or async load)
    // 2. Variants changed from empty to non-empty (async load scenario)
    const wasEmpty = prevVariantsLengthRef.current === 0
    const nowHasVariants = variants.length > 0
    const hasNoOptions = options.length === 0
    const variantsChanged = variantsHash !== processedVariantsHashRef.current
    
    // Process if: (not initialized AND has variants) OR (was empty, now has variants, and no options) OR (variants changed and we have no options)
    const shouldProcess = nowHasVariants && (!isInitialized || (wasEmpty && hasNoOptions) || (variantsChanged && hasNoOptions))
    
    if (!shouldProcess) {
      prevVariantsLengthRef.current = variants.length
      return
    }
    
    if (variants.length > 0) {
      const optionMap = new Map<string, Set<string>>()
      
      variants.forEach(variant => {
        if (variant.option1Name && variant.option1Value) {
          if (!optionMap.has(variant.option1Name)) {
            optionMap.set(variant.option1Name, new Set())
          }
          optionMap.get(variant.option1Name)!.add(variant.option1Value)
        }
        if (variant.option2Name && variant.option2Value) {
          if (!optionMap.has(variant.option2Name)) {
            optionMap.set(variant.option2Name, new Set())
          }
          optionMap.get(variant.option2Name)!.add(variant.option2Value)
        }
        if (variant.option3Name && variant.option3Value) {
          if (!optionMap.has(variant.option3Name)) {
            optionMap.set(variant.option3Name, new Set())
          }
          optionMap.get(variant.option3Name)!.add(variant.option3Value)
        }
      })

      const newOptions: VariantOption[] = Array.from(optionMap.entries()).map(([name, values], index) => ({
        id: `option-${index}`,
        name,
        values: Array.from(values),
        isEditing: false
      }))

      if (newOptions.length > 0) {
        setOptions(newOptions)
        if (!groupBy || groupBy === '') {
          setGroupBy(newOptions[0].name)
        }

        // Load prices and inventory from variants
        const prices: Record<string, number> = {}
        const inventory: Record<string, number> = {}
        
        variants.forEach(variant => {
          const key = getVariantKey(variant)
          if (variant.price !== undefined) prices[key] = variant.price
          if (variant.inventoryQuantity !== undefined) inventory[key] = variant.inventoryQuantity
        })
        
        setVariantPrices(prices)
        setVariantInventory(inventory)
        setIsInitialized(true)
        processedVariantsHashRef.current = variantsHash
      }
    }
    
    prevVariantsLengthRef.current = variants.length
  }, [variants, isInitialized, groupBy, options.length])

  // Generate variants from options
  const generateVariants = useCallback((currentOptions: VariantOption[]): ProductVariant[] => {
    if (currentOptions.length === 0) return []

    // Generate all combinations
    const combinations: string[][] = []
    
    function generateCombinations(index: number, current: string[]) {
      if (index === currentOptions.length) {
        combinations.push([...current])
        return
      }
      
      const option = currentOptions[index]
      if (option.values.length === 0) {
        generateCombinations(index + 1, current)
      } else {
        option.values.forEach(value => {
          generateCombinations(index + 1, [...current, value])
        })
      }
    }
    
    generateCombinations(0, [])
    
    return combinations.map((combo, index) => {
      const variant: ProductVariant = {
        sku: '',
        option1Name: currentOptions[0]?.name || '',
        option1Value: combo[0] || '',
        option2Name: currentOptions[1]?.name || '',
        option2Value: combo[1] || '',
        option3Name: currentOptions[2]?.name || '',
        option3Value: combo[2] || '',
        price: 0,
        inventoryQuantity: 0,
        position: index,
        isDefault: index === 0
      }
      
      // Preserve existing price and inventory
      const key = getVariantKey(variant)
      if (variantPrices[key] !== undefined) variant.price = variantPrices[key]
      if (variantInventory[key] !== undefined) variant.inventoryQuantity = variantInventory[key]
      
      return variant
    })
  }, [variantPrices, variantInventory])

  // Update variants when options change (including during editing for real-time preview)
  const prevVariantsRef = useRef<string>('')
  
  useEffect(() => {
    // Always generate variants for preview, but only update parent when not editing
    const newVariants = generateVariants(options)
    
    // Create a stable key to compare variants
    const variantsKey = JSON.stringify(newVariants.map(v => ({
      option1: `${v.option1Name}:${v.option1Value}`,
      option2: `${v.option2Name}:${v.option2Value}`,
      option3: `${v.option3Name}:${v.option3Value}`,
      price: v.price,
      inventory: v.inventoryQuantity
    })))
    
    // Update parent only when not editing and variants actually changed
    if (editingOptionId === null && variantsKey !== prevVariantsRef.current) {
      onVariantsChangeRef.current(newVariants)
      prevVariantsRef.current = variantsKey
    }
  }, [options, editingOptionId, generateVariants])

  // Notify parent about editing state - only report true when actually editing an option
  useEffect(() => {
    if (!onEditingStateChangeRef.current) return
    
    // If no editing option ID, always report false
    if (!editingOptionId) {
      if (prevEditingStateRef.current !== false) {
        onEditingStateChangeRef.current(false, null)
        prevEditingStateRef.current = false
      }
      return
    }
    
    // Find the editing option
    const editingOption = options.find(opt => opt.id === editingOptionId)
    
    // Only report true if:
    // 1. Option exists
    // 2. Option is in editing mode
    const isActuallyEditing = editingOption !== undefined && editingOption.isEditing === true
    
    // Only call callback if state actually changed
    if (prevEditingStateRef.current !== isActuallyEditing) {
      onEditingStateChangeRef.current(isActuallyEditing, null)
      prevEditingStateRef.current = isActuallyEditing
    }
  }, [editingOptionId, options])

  const handleAddOption = () => {
    if (editingOptionId !== null) return // Can't add if editing
    if (options.length >= 3) return // Maximum 3 options allowed
    
    const newOption: VariantOption = {
      id: `option-${Date.now()}`,
      name: '',
      values: [''],
      isEditing: true
    }
    
    setOptions([...options, newOption])
    setEditingOptionId(newOption.id)
    // Clear any validation errors for the new option
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[newOption.id]
      return newErrors
    })
  }

  const handleOptionNameChange = (optionId: string, name: string) => {
    setOptions(prev => {
      const updated = prev.map(opt => 
        opt.id === optionId ? { ...opt, name } : opt
      )
      
      // Check for duplicate names after update
      const trimmedName = name.trim().toLowerCase()
      const hasDuplicate = updated.some(opt => 
        opt.id !== optionId && 
        opt.name.trim().toLowerCase() === trimmedName && 
        trimmedName !== ''
      )
      
      // Update validation errors
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        if (hasDuplicate) {
          newErrors[optionId] = {
            ...newErrors[optionId],
            duplicateName: name.trim()
          }
        } else {
          if (newErrors[optionId]) {
            delete newErrors[optionId].duplicateName
            delete newErrors[optionId].name
            if (Object.keys(newErrors[optionId]).length === 0) {
              delete newErrors[optionId]
            }
          }
        }
        return newErrors
      })
      
      return updated
    })
  }

  const handleOptionValueChange = (optionId: string, valueIndex: number, value: string) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id !== optionId) return opt
      
      const newValues = [...opt.values]
      newValues[valueIndex] = value
      
      // Check for duplicate values within the same option
      const trimmedValue = value.trim().toLowerCase()
      const duplicateIndex = newValues.findIndex((v, idx) => 
        idx !== valueIndex && 
        v.trim().toLowerCase() === trimmedValue && 
        trimmedValue !== ''
      )
      
      // Update validation errors
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        if (!newErrors[optionId]) {
          newErrors[optionId] = {}
        }
        
        if (duplicateIndex !== -1) {
          // Set duplicate value error
          if (!newErrors[optionId].duplicateValues) {
            newErrors[optionId].duplicateValues = {}
          }
          newErrors[optionId].duplicateValues![valueIndex] = value.trim()
        } else {
          // Clear duplicate value error for this index
          if (newErrors[optionId].duplicateValues) {
            delete newErrors[optionId].duplicateValues![valueIndex]
            if (Object.keys(newErrors[optionId].duplicateValues!).length === 0) {
              delete newErrors[optionId].duplicateValues
            }
          }
        }
        
        // Clean up if no errors left
        if (Object.keys(newErrors[optionId]).length === 0) {
          delete newErrors[optionId]
        }
        
        return newErrors
      })
      
      // Add new empty field if current field has at least one character and it's the last one
      if (value.length > 0 && valueIndex === newValues.length - 1) {
        newValues.push('')
      }
      
      return { ...opt, values: newValues }
    }))
  }

  const handleRemoveOptionValue = (optionId: string, valueIndex: number) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id !== optionId) return opt
      
      const newValues = opt.values.filter((_, idx) => idx !== valueIndex)
      return { ...opt, values: newValues.length > 0 ? newValues : [''] }
    }))
  }

  const handleDone = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId)
    if (!option) return

    // Validate - show errors only when Done is clicked
    const errors: { name?: boolean; values?: boolean; duplicateName?: string; duplicateValues?: Record<number, string> } = {}
    
    // Check for empty name
    if (!option.name.trim()) {
      errors.name = true
    }
    
    // Check for duplicate names
    const trimmedName = option.name.trim().toLowerCase()
    const duplicateOption = options.find(opt => 
      opt.id !== optionId && 
      opt.name.trim().toLowerCase() === trimmedName && 
      trimmedName !== ''
    )
    if (duplicateOption) {
      errors.duplicateName = option.name.trim()
    }

    // Remove empty values
    const cleanedValues = option.values.filter(v => v.trim())
    if (cleanedValues.length === 0) {
      errors.values = true
    }
    
    // Check for duplicate values within the same option
    const duplicateValues: Record<number, string> = {}
    cleanedValues.forEach((value, index) => {
      const trimmedValue = value.trim().toLowerCase()
      const duplicateIndex = cleanedValues.findIndex((v, idx) => 
        idx !== index && 
        v.trim().toLowerCase() === trimmedValue && 
        trimmedValue !== ''
      )
      if (duplicateIndex !== -1) {
        duplicateValues[index] = value.trim()
      }
    })
    if (Object.keys(duplicateValues).length > 0) {
      errors.duplicateValues = duplicateValues
    }

    // If there are errors, show them and don't save
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [optionId]: errors
      }))
      return
    }

    // Clear validation errors
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[optionId]
      return newErrors
    })

    setOptions(prev => prev.map(opt => 
      opt.id === optionId 
        ? { ...opt, values: cleanedValues, isEditing: false }
        : opt
    ))
    
    setEditingOptionId(null)
    
    // Set groupBy if not set
    if (!groupBy) {
      setGroupBy(option.name)
    }
  }

  const handleDelete = (optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId))
    setEditingOptionId(null)
    
    // Clear validation errors for deleted option
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[optionId]
      return newErrors
    })
    
    // Update groupBy if deleted option was selected
    const deletedOption = options.find(opt => opt.id === optionId)
    if (deletedOption && groupBy === deletedOption.name) {
      const remainingOptions = options.filter(opt => opt.id !== optionId)
      setGroupBy(remainingOptions.length > 0 ? remainingOptions[0].name : '')
    }
  }

  const handleEdit = (optionId: string) => {
    if (editingOptionId !== null && editingOptionId !== optionId) return // Can't edit if another is being edited
    
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, isEditing: true } : opt
    ))
    setEditingOptionId(optionId)
  }

  // Handle drag end for option reordering
  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const oldIndex = options.findIndex(opt => opt.id === active.id)
    const newIndex = options.findIndex(opt => opt.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      setOptions(arrayMove(options, oldIndex, newIndex))
    }
  }

  // Handle drag end for value reordering within an option
  const handleValueDragEnd = (event: DragEndEvent, optionId: string) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setDraggedValueOptionId(null)
      return
    }
    
    const option = options.find(opt => opt.id === optionId)
    if (!option) return
    
    const oldIndex = option.values.findIndex((_, idx) => `value-${optionId}-${idx}` === active.id)
    const newIndex = option.values.findIndex((_, idx) => `value-${optionId}-${idx}` === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      setOptions(prev => prev.map(opt => 
        opt.id === optionId 
          ? { ...opt, values: arrayMove(opt.values, oldIndex, newIndex) }
          : opt
      ))
    }
    
    setDraggedValueOptionId(null)
  }

  // Handle drag start for values
  const handleValueDragStart = (optionId: string) => {
    setDraggedValueOptionId(optionId)
  }

  // Get current editing option
  const editingOption = options.find(opt => opt.id === editingOptionId)

  // Generate variant combinations for preview table
  // Only generate when there are saved (non-editing) options with names and values
  const previewVariants = useMemo(() => {
    // Only generate variants for saved options (not editing ones)
    const savedOptions = options.filter(opt => !opt.isEditing && opt.name.trim() && opt.values.some(v => v.trim()))
    
    if (savedOptions.length === 0) return []
    
    const combinations: Array<{ key: string; values: Record<string, string> }> = []
    
    function generateCombinations(index: number, current: Record<string, string>) {
      if (index === savedOptions.length) {
        const key = Object.entries(current).map(([k, v]) => `${k}:${v}`).join('|')
        combinations.push({ key, values: { ...current } })
        return
      }
      
      const option = savedOptions[index]
      const validValues = option.values.filter(v => v.trim())
      if (validValues.length === 0) {
        generateCombinations(index + 1, current)
      } else {
        validValues.forEach(value => {
          generateCombinations(index + 1, { ...current, [option.name]: value })
        })
      }
    }
    
    generateCombinations(0, {})
    return combinations
  }, [options])

  // Group variants by selected option
  const groupedVariants = useMemo(() => {
    if (!groupBy || previewVariants.length === 0) return []
    
    // If only one option exists, show individual variants
    if (options.length === 1) {
      return previewVariants.map(variant => ({
        value: Object.values(variant.values)[0] || '',
        variants: [variant]
      }))
    }
    
    // Group by selected option
    const groups = new Map<string, typeof previewVariants>()
    
    previewVariants.forEach(variant => {
      const groupValue = variant.values[groupBy] || 'Other'
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(variant)
    })
    
    return Array.from(groups.entries()).map(([value, variants]) => ({
      value,
      variants
    }))
  }, [previewVariants, groupBy, options.length])

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set<string>()
      groupedVariants.forEach(group => {
        group.variants.forEach(variant => {
          allKeys.add(variant.key)
        })
      })
      setSelectedVariants(allKeys)
    } else {
      setSelectedVariants(new Set())
    }
  }

  // Handle individual variant checkbox
  const handleVariantSelect = (variantKey: string, checked: boolean) => {
    setSelectedVariants(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(variantKey)
      } else {
        next.delete(variantKey)
      }
      return next
    })
  }

  // Check if all variants are selected
  const allVariantsSelected = useMemo(() => {
    if (groupedVariants.length === 0) return false
    const allKeys = new Set<string>()
    groupedVariants.forEach(group => {
      group.variants.forEach(variant => {
        allKeys.add(variant.key)
      })
    })
    return allKeys.size > 0 && Array.from(allKeys).every(key => selectedVariants.has(key))
  }, [groupedVariants, selectedVariants])

  // Check if some variants are selected
  const someVariantsSelected = selectedVariants.size > 0 && !allVariantsSelected

  // Handle delete selected variants
  const handleDeleteSelected = () => {
    if (selectedVariants.size === 0) return

    // Get the keys of variants to delete
    const keysToDelete = Array.from(selectedVariants)
    
    // Find which option values need to be removed
    // We need to remove option values that create the deleted variants
    const deletedVariantData = previewVariants.filter(v => selectedVariants.has(v.key))
    
    // For each deleted variant, find the option values used
    const optionValuesToRemove = new Map<string, Set<string>>() // optionName -> Set of values to remove
    
    deletedVariantData.forEach(variant => {
      Object.entries(variant.values).forEach(([optionName, value]) => {
        if (!optionValuesToRemove.has(optionName)) {
          optionValuesToRemove.set(optionName, new Set())
        }
        optionValuesToRemove.get(optionName)!.add(value.trim())
      })
    })
    
    // Check which values are used in remaining variants (don't remove if still used)
    const remainingVariants = previewVariants.filter(v => !selectedVariants.has(v.key))
    const usedValues = new Map<string, Set<string>>() // optionName -> Set of values still in use
    
    remainingVariants.forEach(variant => {
      Object.entries(variant.values).forEach(([optionName, value]) => {
        if (!usedValues.has(optionName)) {
          usedValues.set(optionName, new Set())
        }
        usedValues.get(optionName)!.add(value.trim())
      })
    })
    
    // Remove option values that are only in deleted variants (not used in remaining variants)
    const updatedOptions = options.map(option => {
      const valuesToCheck = optionValuesToRemove.get(option.name)
      if (!valuesToCheck || valuesToCheck.size === 0) return option
      
      const remainingValuesForOption = usedValues.get(option.name) || new Set()
      
      // Remove values that are in deleted variants AND not used in remaining variants
      const newValues = option.values.filter(value => {
        const trimmedValue = value.trim()
        if (!trimmedValue) return true // Keep empty values
        // Keep value if it's used in remaining variants OR not in deleted variants
        return remainingValuesForOption.has(trimmedValue) || !valuesToCheck.has(trimmedValue)
      })
      
      return {
        ...option,
        values: newValues.length > 0 ? newValues : [''] // Keep at least one empty value
      }
    })
    
    // Remove options that have no valid values left (all values were deleted)
    const filteredOptions = updatedOptions.filter(option => {
      const validValues = option.values.filter(v => v.trim())
      return validValues.length > 0
    })
    
    // Update options - this will trigger variant regeneration
    setOptions(filteredOptions)
    
    // Remove variants from the variants array
    const updatedVariants = variants.filter(v => {
      const key = getVariantKey(v)
      return !selectedVariants.has(key)
    })

    // Update prices and inventory - remove deleted variants
    const updatedPrices: Record<string, number> = {}
    const updatedInventory: Record<string, number> = {}
    
    updatedVariants.forEach(variant => {
      const key = getVariantKey(variant)
      if (variantPrices[key] !== undefined) updatedPrices[key] = variantPrices[key]
      if (variantInventory[key] !== undefined) updatedInventory[key] = variantInventory[key]
    })

    setVariantPrices(updatedPrices)
    setVariantInventory(updatedInventory)
    onVariantsChange(updatedVariants)
    setSelectedVariants(new Set())
    setShowBulkMenu(false)
  }

  // Close bulk menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.bulk-menu-container')) {
        setShowBulkMenu(false)
      }
    }

    if (showBulkMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBulkMenu])

  const handleVariantPriceChange = (key: string, price: number) => {
    setVariantPrices(prev => ({ ...prev, [key]: price }))
    
    // Update variants immediately
    const updatedVariants = variants.map(v => {
      const vKey = getVariantKey(v)
      if (vKey === key) {
        return { ...v, price }
      }
      return v
    })
    onVariantsChange(updatedVariants)
  }

  const handleVariantInventoryChange = (key: string, quantity: number) => {
    setVariantInventory(prev => ({ ...prev, [key]: quantity }))
    
    // Update variants immediately
    const updatedVariants = variants.map(v => {
      const vKey = getVariantKey(v)
      if (vKey === key) {
        return { ...v, inventoryQuantity: quantity }
      }
      return v
    })
    onVariantsChange(updatedVariants)
  }

  const toggleGroup = (value: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const newExpandAll = !expandAll
    setExpandAll(newExpandAll)
    
    if (newExpandAll) {
      const allValues = new Set(groupedVariants.map(g => g.value))
      setExpandedGroups(allValues)
    } else {
      setExpandedGroups(new Set())
    }
  }

  // Initialize expanded groups when variants are first created
  useEffect(() => {
    if (groupedVariants.length > 0 && expandedGroups.size === 0 && expandAll) {
      const allValues = new Set(groupedVariants.map(g => g.value))
      setExpandedGroups(allValues)
    }
  }, [groupedVariants, expandAll])

  // Sync expandAll with expandedGroups
  useEffect(() => {
    if (groupedVariants.length > 0) {
      const allExpanded = groupedVariants.every(g => expandedGroups.has(g.value))
      if (allExpanded !== expandAll && expandedGroups.size > 0) {
        setExpandAll(allExpanded)
      }
    }
  }, [expandedGroups, groupedVariants, expandAll])

  return (
    <div className="space-y-4">
      {/* Variants Section */}
      <div className="bg-white  ">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Variants</h3>
        
        {/* Default Empty State - Show only when no options exist */}
        {options.length === 0 ? (
          <button
            type="button"
            onClick={handleAddOption}
            className="w-full flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors bg-white"
          >
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-gray-700" />
            </div>
            <span>Add options like size or color</span>
          </button>
        ) : (
          <>
            {/* Options List with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleOptionDragEnd}
            >
              <SortableContext
                items={options.map(opt => opt.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {options.map((option) => (
                    <DraggableOption
                      key={option.id}
                      option={option}
                      editingOptionId={editingOptionId}
                      validationErrors={validationErrors}
                      onOptionNameChange={handleOptionNameChange}
                      onOptionValueChange={handleOptionValueChange}
                      onRemoveOptionValue={handleRemoveOptionValue}
                      onDone={handleDone}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onValueDragEnd={handleValueDragEnd}
                      onValueDragStart={handleValueDragStart}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Another Option Button - Only show when there are saved (non-editing) options and less than 3 options */}
            {options.some(opt => !opt.isEditing) && options.length < 3 && (
              <button
                type="button"
                onClick={handleAddOption}
                disabled={editingOptionId !== null}
                className="w-full flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3 bg-white"
              >
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-gray-700" />
                </div>
                <span>Add another option</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Variants Table - Only show when there are saved options with values */}
      {previewVariants.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Table Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {options.map(opt => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Variants Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={allVariantsSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someVariantsSelected
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedVariants.size > 0 ? (
                          <span className="text-xs font-normal text-gray-700">{selectedVariants.size} selected</span>
                        ) : (
                          <>
                            <span>Variant</span>
                            {options.length > 1 && groupedVariants.length > 1 && (
                              <button
                                type="button"
                                onClick={handleExpandAll}
                                className="text-xs font-normal text-gray-600 hover:text-orange-600 transition-colors"
                              >
                                {expandAll ? 'Collapse all' : 'Expand all'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {selectedVariants.size > 0 && (
                        <div className="relative bulk-menu-container">
                          <button
                            type="button"
                            onClick={() => setShowBulkMenu(!showBulkMenu)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showBulkMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                type="button"
                                onClick={handleDeleteSelected}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete variants
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupedVariants.map((group) => {
                  const isExpanded = expandedGroups.has(group.value) || expandAll
                  const variantCount = group.variants.length
                  
                  return (
                    <React.Fragment key={group.value}>
                      {/* Group Header Row - Only show if multiple options or multiple variants */}
                      {(options.length > 1 && variantCount > 1) ? (
                        <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300"
                              checked={group.variants.every(v => selectedVariants.has(v.key))}
                              onChange={(e) => {
                                group.variants.forEach(variant => {
                                  handleVariantSelect(variant.key, e.target.checked)
                                })
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleGroup(group.value)
                                }}
                                className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                <div className="text-left">
                                  <div className="text-sm font-medium text-gray-900">{group.value}</div>
                                  <div className="text-xs text-gray-500">{variantCount} {variantCount === 1 ? 'variant' : 'variants'}</div>
                                </div>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              // Calculate price range for the group
                              const prices = group.variants
                                .map(v => variantPrices[v.key] || 0)
                                .filter(p => p > 0)
                              
                              const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                              const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
                              const allSame = minPrice === maxPrice || prices.length === 0
                              const isEditing = editingGroupPrice === group.value
                              
                              // If all prices are the same, show single input
                              // If different, show range as display value with editable input
                              return (
                                <div className="relative">
                                  {!allSame && prices.length > 0 && !isEditing ? (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingGroupPrice(group.value)
                                      }}
                                      className="w-40 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100"
                                      title="Click to edit - Applies to all variants in this group"
                                    >
                                    {minPrice.toFixed(2)} - {maxPrice.toFixed(2)}
                                    </div>
                                  ) : (
                                    <input
                                      type="number"
                                      value={isEditing ? (variantPrices[group.variants[0]?.key] || 0) : (minPrice || 0)}
                                      onChange={(e) => {
                                        const price = parseFloat(e.target.value) || 0
                                        group.variants.forEach(v => {
                                          handleVariantPriceChange(v.key, price)
                                        })
                                      }}
                                      onBlur={() => setEditingGroupPrice(null)}
                                      onFocus={() => setEditingGroupPrice(group.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Rs 0.00"
                                      step="0.01"
                                      title={variantCount > 1 ? "Applies to all variants in this group" : ""}
                                    />
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              // Calculate total inventory for the group (sum of all child variants)
                              const totalInventory = group.variants.reduce((sum, v) => {
                                return sum + (variantInventory[v.key] || 0)
                              }, 0)
                              
                              return (
                                <input
                                  type="number"
                                  value={totalInventory}
                                  disabled
                                  readOnly
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                                  placeholder="0"
                                  title="Total of all variants in this group"
                                />
                              )
                            })()}
                          </td>
                        </tr>
                      ) : null}
                      
                      {/* Expanded Variant Rows - Show directly if single option with single variant, or if expanded */}
                      {((options.length === 1) || (options.length > 1 && isExpanded)) && group.variants.map((variant) => {
                        const variantDisplay = options.length === 1
                          ? group.value
                          : Object.entries(variant.values)
                              .filter(([key]) => key !== groupBy)
                              .map(([_, value]) => value)
                              .join(' - ') || group.value
                        
                        return (
                          <tr key={variant.key} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300"
                                checked={selectedVariants.has(variant.key)}
                                onChange={(e) => handleVariantSelect(variant.key, e.target.checked)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {options.length > 1 && variantCount > 1 && (
                                  <div className="w-4"></div>
                                )}
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                <div className="text-sm text-gray-900">
                                  {variantDisplay}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={variantPrices[variant.key] || 0}
                                onChange={(e) => handleVariantPriceChange(variant.key, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Rs 0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={variantInventory[variant.key] || 0}
                                onChange={(e) => handleVariantInventoryChange(variant.key, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 text-xs text-gray-500">
            Total inventory at 188, 248 Hill Street: {Object.values(variantInventory).reduce((sum, qty) => sum + qty, 0)} available
          </div>
        </div>
      )}
    </div>
  )
}

