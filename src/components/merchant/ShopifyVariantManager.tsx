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
  validationErrors: Record<string, { name?: boolean; duplicateName?: string; values?: boolean }>
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
                  (validationErrors[option.id]?.name || validationErrors[option.id]?.duplicateName) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                placeholder="e.g., Size"
              />
            </div>
            {validationErrors[option.id]?.duplicateName && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>You&apos;ve already used the option name &quot;{validationErrors[option.id].duplicateName}.&quot;</span>
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
                    <DraggableValue
                      key={`value-${option.id}-${index}`}
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
                    />
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
                !!validationErrors[option.id]?.duplicateName
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
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
  const GROUP_BY_ALL = '__all__'
  const [options, setOptions] = useState<VariantOption[]>([])
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<string>(GROUP_BY_ALL)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>({})
  const [variantInventory, setVariantInventory] = useState<Record<string, number>>({})
  const [variantIds, setVariantIds] = useState<Record<string, number>>({})
  const [variantSkus, setVariantSkus] = useState<Record<string, string>>({})
  const variantsByPositionRef = useRef<ProductVariant[]>([])
  const [expandAll, setExpandAll] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, { name?: boolean; duplicateName?: string; values?: boolean }>>({})
  const [draggedValueOptionId, setDraggedValueOptionId] = useState<string | null>(null)
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<Set<string>>(new Set())
  const [selectionMenuOpen, setSelectionMenuOpen] = useState(false)
  const [rowMenuOpenKey, setRowMenuOpenKey] = useState<string | null>(null)
  const selectionMenuRef = useRef<HTMLDivElement>(null)
  const rowMenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

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
    if (variant.option4Name && variant.option4Value) parts.push(`${variant.option4Name}:${variant.option4Value}`)
    if (variant.option5Name && variant.option5Value) parts.push(`${variant.option5Name}:${variant.option5Value}`)
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
        const optionPairs = [
          [variant.option1Name, variant.option1Value],
          [variant.option2Name, variant.option2Value],
          [variant.option3Name, variant.option3Value],
          [variant.option4Name, variant.option4Value],
          [variant.option5Name, variant.option5Value],
        ] as const
        optionPairs.forEach(([name, value]) => {
          if (name && value) {
            if (!optionMap.has(name)) optionMap.set(name, new Set())
            optionMap.get(name)!.add(value)
          }
        })
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
          setGroupBy(GROUP_BY_ALL)
        }

        // Load prices and inventory from variants
        const prices: Record<string, number> = {}
        const inventory: Record<string, number> = {}
        const ids: Record<string, number> = {}
        const skus: Record<string, string> = {}
        variantsByPositionRef.current = [...variants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        
        variants.forEach(variant => {
          const key = getVariantKey(variant)
          if (variant.price !== undefined) prices[key] = variant.price
          if (variant.inventoryQuantity !== undefined) inventory[key] = variant.inventoryQuantity
          if (variant.id !== undefined) ids[key] = variant.id
          if (variant.sku) skus[key] = variant.sku
        })
        
        setVariantPrices(prices)
        setVariantInventory(inventory)
        setVariantIds(ids)
        setVariantSkus(skus)
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
    
    const optionNames = currentOptions.map(o => o.name)
    return combinations.map((combo, index) => {
      const variant: ProductVariant = {
        sku: '',
        option1Name: optionNames[0] || '',
        option1Value: combo[0] || '',
        option2Name: optionNames[1] || '',
        option2Value: combo[1] || '',
        option3Name: optionNames[2] || '',
        option3Value: combo[2] || '',
        option4Name: optionNames[3] || '',
        option4Value: combo[3] || '',
        option5Name: optionNames[4] || '',
        option5Value: combo[4] || '',
        price: 0,
        inventoryQuantity: 0,
        position: index,
        isDefault: index === 0
      }
      
      // Preserve existing metadata (id/sku) and price/inventory
      const key = getVariantKey(variant)
      const fallback = variantsByPositionRef.current[index]
      if (variantIds[key] !== undefined) variant.id = variantIds[key]
      else if (fallback?.id !== undefined) variant.id = fallback.id
      if (variantSkus[key]) variant.sku = variantSkus[key]
      else if (fallback?.sku) variant.sku = fallback.sku
      if (variantPrices[key] !== undefined) variant.price = variantPrices[key]
      else if (fallback?.price !== undefined) variant.price = fallback.price
      if (variantInventory[key] !== undefined) variant.inventoryQuantity = variantInventory[key]
      else if (fallback?.inventoryQuantity !== undefined) variant.inventoryQuantity = fallback.inventoryQuantity
      
      return variant
    })
  }, [variantPrices, variantInventory, variantIds, variantSkus])

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
      option4: `${v.option4Name}:${v.option4Value}`,
      option5: `${v.option5Name}:${v.option5Value}`,
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

  const MAX_OPTIONS = 3

  const handleAddOption = () => {
    if (editingOptionId !== null) return // Can't add if editing
    if (options.length >= MAX_OPTIONS) return // Maximum 3 variant options

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

  const getDuplicateOptionName = (optionId: string, name: string, currentOptions: VariantOption[]): string | undefined => {
    const trimmed = name.trim()
    if (!trimmed) return undefined
    const duplicate = currentOptions.find(
      opt => opt.id !== optionId && opt.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    return duplicate ? trimmed : undefined
  }

  const handleOptionNameChange = (optionId: string, name: string) => {
    const nextOptions = options.map(opt => (opt.id === optionId ? { ...opt, name } : opt))
    const duplicateName = getDuplicateOptionName(optionId, name, nextOptions)
    setOptions(nextOptions)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      if (!newErrors[optionId] && !duplicateName) return newErrors
      const err = { ...newErrors[optionId] }
      delete err.name
      if (duplicateName) err.duplicateName = duplicateName
      else delete err.duplicateName
      if (Object.keys(err).length === 0) delete newErrors[optionId]
      else newErrors[optionId] = err
      return newErrors
    })
    if (validationErrors[optionId]?.name) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        if (newErrors[optionId]) {
          delete newErrors[optionId].name
          if (Object.keys(newErrors[optionId]).length === 0) delete newErrors[optionId]
        }
        return newErrors
      })
    }
  }

  const handleOptionValueChange = (optionId: string, valueIndex: number, value: string) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id !== optionId) return opt
      
      const newValues = [...opt.values]
      newValues[valueIndex] = value
      
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
    const errors: { name?: boolean; duplicateName?: string; values?: boolean } = {}
    if (!option.name.trim()) {
      errors.name = true
    }
    const duplicateName = getDuplicateOptionName(optionId, option.name.trim(), options)
    if (duplicateName) {
      errors.duplicateName = duplicateName
    }

    // Remove empty values
    const cleanedValues = option.values.filter(v => v.trim())
    if (cleanedValues.length === 0) {
      errors.values = true
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

    const nextOptions = options.map(opt =>
      opt.id === optionId
        ? { ...opt, values: cleanedValues, isEditing: false }
        : opt
    )
    setOptions(nextOptions)
    setEditingOptionId(null)

    // Set groupBy if not set
    if (!groupBy) {
      setGroupBy(option.name)
    }

    // Push updated variants immediately so parent has latest values
    const newVariants = generateVariants(nextOptions)
    const variantsKey = JSON.stringify(newVariants.map(v => ({
      option1: `${v.option1Name}:${v.option1Value}`,
      option2: `${v.option2Name}:${v.option2Value}`,
      option3: `${v.option3Name}:${v.option3Value}`,
      option4: `${v.option4Name}:${v.option4Value}`,
      option5: `${v.option5Name}:${v.option5Value}`,
      price: v.price,
      inventory: v.inventoryQuantity
    })))
    onVariantsChangeRef.current(newVariants)
    prevVariantsRef.current = variantsKey
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
      setGroupBy(remainingOptions.length > 0 ? remainingOptions[0].name : GROUP_BY_ALL)
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

  // Parent's variant keys (source of truth for which variants exist)
  const parentVariantKeys = useMemo(
    () => new Set(variants.map(v => getVariantKey(v))),
    [variants]
  )

  // Variants visible in table (only those that exist in parent)
  const visiblePreviewVariants = useMemo(
    () => previewVariants.filter(v => parentVariantKeys.has(v.key)),
    [previewVariants, parentVariantKeys]
  )

  // For "All" view we use first option for tree structure; otherwise use selected groupBy
  const displayGroupBy = groupBy === GROUP_BY_ALL && options.length > 0 ? options[0].name : groupBy

  // Full tree for "All" view: each OPTION NAME with its VALUES and variants under each value
  const fullTreeData = useMemo(() => {
    if (groupBy !== GROUP_BY_ALL || visiblePreviewVariants.length === 0 || options.length === 0) return []
    const savedOptions = options.filter(opt => !opt.isEditing && opt.name.trim() && opt.values.some(v => v.trim()))
    if (savedOptions.length === 0) return []
    return savedOptions.map(opt => {
      const groups = new Map<string, typeof visiblePreviewVariants>()
      visiblePreviewVariants.forEach(v => {
        const val = v.values[opt.name] ?? 'Other'
        if (!groups.has(val)) groups.set(val, [])
        groups.get(val)!.push(v)
      })
      const valueGroups = Array.from(groups.entries())
        .map(([value, variants]) => ({ value, variants }))
        .sort((a, b) => a.value.localeCompare(b.value))
      return { optionName: opt.name, valueGroups }
    })
  }, [groupBy, visiblePreviewVariants, options])

  // Group variants by selected option (use visible only)
  const groupedVariants = useMemo(() => {
    if (visiblePreviewVariants.length === 0) return []

    // "All" – same tree format: group by first option so we get option name → values → variants
    const groupByKey = groupBy === GROUP_BY_ALL && options.length > 0 ? options[0].name : groupBy
    if (!groupByKey) return []

    // If only one option exists, show individual variants
    if (options.length === 1) {
      return visiblePreviewVariants.map(variant => ({
        value: Object.values(variant.values)[0] || '',
        variants: [variant]
      }))
    }

    // Group by option (selected or first when "All")
    const groups = new Map<string, typeof visiblePreviewVariants>()

    visiblePreviewVariants.forEach(variant => {
      const groupValue = variant.values[groupByKey] || 'Other'
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(variant)
    })

    return Array.from(groups.entries()).map(([value, variants]) => ({
      value,
      variants
    }))
  }, [visiblePreviewVariants, groupBy, options])

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
      const allValues = groupBy === GROUP_BY_ALL && fullTreeData.length > 0
        ? new Set(fullTreeData.flatMap(o => o.valueGroups.map(vg => `${o.optionName}:${vg.value}`)))
        : new Set(groupedVariants.map(g => g.value))
      setExpandedGroups(allValues)
    } else {
      setExpandedGroups(new Set())
    }
  }

  // Initialize expanded groups when variants are first created
  useEffect(() => {
    if (groupBy === GROUP_BY_ALL && fullTreeData.length > 0 && expandedGroups.size === 0 && expandAll) {
      const allValues = new Set(fullTreeData.flatMap(o => o.valueGroups.map(vg => `${o.optionName}:${vg.value}`)))
      setExpandedGroups(allValues)
    } else if (groupBy !== GROUP_BY_ALL && groupedVariants.length > 0 && expandedGroups.size === 0 && expandAll) {
      const allValues = new Set(groupedVariants.map(g => g.value))
      setExpandedGroups(allValues)
    }
  }, [groupBy, groupedVariants, fullTreeData, expandAll, expandedGroups.size])

  // Sync expandAll with expandedGroups
  useEffect(() => {
    if (groupBy === GROUP_BY_ALL && fullTreeData.length > 0) {
      const allKeys = fullTreeData.flatMap(o => o.valueGroups.map(vg => `${o.optionName}:${vg.value}`))
      const allExpanded = allKeys.length > 0 && allKeys.every(k => expandedGroups.has(k))
      if (allExpanded !== expandAll && expandedGroups.size > 0) {
        setExpandAll(allExpanded)
      }
    } else if (groupedVariants.length > 0) {
      const allExpanded = groupedVariants.every(g => expandedGroups.has(g.value))
      if (allExpanded !== expandAll && expandedGroups.size > 0) {
        setExpandAll(allExpanded)
      }
    }
  }, [expandedGroups, groupedVariants, fullTreeData, groupBy, expandAll])

  // All variant keys in the table (for select all)
  const allVariantKeys = useMemo(() => {
    if (groupBy === GROUP_BY_ALL && fullTreeData.length > 0) {
      const keys = fullTreeData.flatMap(o => o.valueGroups.flatMap(vg => vg.variants.map(v => v.key)))
      return Array.from(new Set(keys))
    }
    return groupedVariants.flatMap(g => g.variants).map(v => v.key)
  }, [groupBy, fullTreeData, groupedVariants])

  const toggleSelectAll = () => {
    if (selectedVariantKeys.size >= allVariantKeys.length) {
      setSelectedVariantKeys(new Set())
    } else {
      setSelectedVariantKeys(new Set(Array.from(allVariantKeys)))
    }
  }

  const toggleVariantSelection = (key: string) => {
    setSelectedVariantKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDeleteSelected = () => {
    const toRemove = new Set(selectedVariantKeys)
    const newVariants = variants.filter(v => !toRemove.has(getVariantKey(v)))
    if (newVariants.length === 0) return
    onVariantsChangeRef.current(newVariants)
    setSelectedVariantKeys(new Set())
    setSelectionMenuOpen(false)
  }

  const handleDeleteVariant = (key: string) => {
    const newVariants = variants.filter(v => getVariantKey(v) !== key)
    if (newVariants.length === 0) return
    onVariantsChangeRef.current(newVariants)
    setRowMenuOpenKey(null)
  }

  // Close selection menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectionMenuRef.current && !selectionMenuRef.current.contains(e.target as Node)) {
        setSelectionMenuOpen(false)
      }
      if (rowMenuOpenKey !== null) {
        const ref = rowMenuRefs.current[rowMenuOpenKey]
        if (ref && !ref.contains(e.target as Node)) setRowMenuOpenKey(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [rowMenuOpenKey])

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

            {/* Add Another Option Button - Only show when under max (3) and there are saved (non-editing) options */}
            {options.length < MAX_OPTIONS && options.some(opt => !opt.isEditing) && (
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
          {/* Selection bar - when one or more variants selected */}
          {selectedVariantKeys.size > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-700">
                {selectedVariantKeys.size} selected
              </span>
              <div className="relative" ref={selectionMenuRef}>
                <button
                  type="button"
                  onClick={() => setSelectionMenuOpen(prev => !prev)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  aria-label="Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {selectionMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={GROUP_BY_ALL}>All</option>
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
                      checked={allVariantKeys.length > 0 && selectedVariantKeys.size === allVariantKeys.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>Variant</span>
                      {((groupBy === GROUP_BY_ALL && fullTreeData.some(o => o.valueGroups.length > 1)) || (groupBy !== GROUP_BY_ALL && options.length > 1 && groupedVariants.length > 1)) && (
                        <button
                          type="button"
                          onClick={handleExpandAll}
                          className="text-xs font-normal text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          {expandAll ? 'Collapse all' : 'Expand all'}
                        </button>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    {/* Actions column */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Full tree: All options with their values and variants (when Group by = All) */}
                {groupBy === GROUP_BY_ALL && fullTreeData.length > 0 ? (
                  <>
                    {fullTreeData.map(({ optionName, valueGroups }) => (
                      <React.Fragment key={optionName}>
                        {/* Tree level 1: Option name (e.g. eeeuu, yyy) */}
                        <tr className="bg-gray-100 border-l-4 border-orange-500">
                          <td className="px-4 py-2.5" colSpan={5}>
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <span>{optionName}</span>
                              <span className="text-xs font-normal text-gray-500">
                                ({valueGroups.length} {valueGroups.length === 1 ? 'value' : 'values'})
                              </span>
                            </div>
                          </td>
                        </tr>
                        {/* Tree level 2 & 3: Option values and their variant rows */}
                        {valueGroups.map(({ value, variants: groupVariants }) => {
                          const groupKey = `${optionName}:${value}`
                          const isExpanded = expandedGroups.has(groupKey) || expandAll
                          const variantCount = groupVariants.length
                          return (
                            <React.Fragment key={groupKey}>
                              {/* Tree level 2: Option value (e.g. kkkk under eeeuu) */}
                              {variantCount > 1 ? (
                                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <td className="px-4 py-3 pl-8">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300"
                                      checked={groupVariants.every(v => selectedVariantKeys.has(v.key))}
                                      onChange={(e) => {
                                        const keys = groupVariants.map(v => v.key)
                                        if (e.target.checked) {
                                          setSelectedVariantKeys(prev => new Set(Array.from(prev).concat(keys)))
                                        } else {
                                          setSelectedVariantKeys(prev => {
                                            const next = new Set(prev)
                                            keys.forEach(k => next.delete(k))
                                            return next
                                          })
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 pl-8">
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-400 w-4 flex-shrink-0">├</span>
                                      <button
                                        type="button"
                                        onClick={() => toggleGroup(groupKey)}
                                        className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-gray-600" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-600" />
                                        )}
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                        <div className="text-left">
                                          <div className="text-sm font-medium text-gray-900">{value}</div>
                                          <div className="text-xs text-gray-500">{variantCount} {variantCount === 1 ? 'variant' : 'variants'}</div>
                                        </div>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={variantPrices[groupVariants[0]?.key] || 0}
                                      onChange={(e) => {
                                        const price = parseFloat(e.target.value) || 0
                                        groupVariants.forEach(v => handleVariantPriceChange(v.key, price))
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Rs 0.00"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={variantInventory[groupVariants[0]?.key] || 0}
                                      onChange={(e) => {
                                        const qty = parseInt(e.target.value) || 0
                                        groupVariants.forEach(v => handleVariantInventoryChange(v.key, qty))
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="px-4 py-3" />
                                </tr>
                              ) : null}
                              {/* Tree level 3: Variant rows under this value */}
                              {(variantCount === 1 || isExpanded) && groupVariants.map((variant) => {
                                // When multiple variants: show other option(s) as "optionName: value" so it's clear we're under current option (e.g. under yy show "ww: rrrr", "ww: ggg").
                                // When single variant: show this option's value (e.g. under yy→gggg show "gggg").
                                const variantDisplay = variantCount > 1
                                  ? (Object.entries(variant.values)
                                      .filter(([key]) => key !== optionName)
                                      .map(([optName, val]) => `${optName}: ${val}`)
                                      .join(' · ') || value)
                                  : value
                                return (
                                  <tr key={variant.key} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 pl-8">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={selectedVariantKeys.has(variant.key)}
                                        onChange={() => toggleVariantSelection(variant.key)}
                                      />
                                    </td>
                                    <td className="px-4 py-3 pl-12">
                                      <div className="flex items-center gap-3">
                                        <span className="text-gray-400 w-4 flex-shrink-0">└</span>
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                        <div className="text-sm text-gray-900">{variantDisplay}</div>
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
                                    <td className="px-4 py-3">
                                      <div
                                        className="relative inline-block"
                                        ref={el => { rowMenuRefs.current[variant.key] = el }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setRowMenuOpenKey(prev => prev === variant.key ? null : variant.key)}
                                          className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                          aria-label="Actions"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {rowMenuOpenKey === variant.key && (
                                          <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteVariant(variant.key)}
                                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </React.Fragment>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <>
                {/* Single-option tree: one option name with its values (when Group by = specific option) */}
                {options.length > 1 && groupedVariants.length > 0 && displayGroupBy && (
                  <tr className="bg-gray-100 border-l-4 border-orange-500">
                    <td className="px-4 py-2.5" colSpan={5}>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span>{displayGroupBy}</span>
                        <span className="text-xs font-normal text-gray-500">
                          ({options.find(o => o.name === displayGroupBy)?.values.filter(v => v.trim()).length ?? 0} values)
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {groupedVariants.map((group) => {
                  const isExpanded = expandedGroups.has(group.value) || expandAll
                  const variantCount = group.variants.length
                  const isGroupedView = options.length > 1
                  
                  return (
                    <React.Fragment key={group.value}>
                      {/* Tree level 2: Option value (group header) - show when multiple options and (multiple variants, or Group by specific option so we show every value) */}
                      {(options.length > 1 && (variantCount > 1 || groupBy !== GROUP_BY_ALL)) ? (
                        <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className={`px-4 py-3 ${isGroupedView ? 'pl-8' : ''}`}>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={group.variants.every(v => selectedVariantKeys.has(v.key))}
                              onChange={(e) => {
                                const keys = group.variants.map(v => v.key)
                                if (e.target.checked) {
                                  setSelectedVariantKeys(prev => new Set(Array.from(prev).concat(keys)))
                                } else {
                                  setSelectedVariantKeys(prev => {
                                    const next = new Set(prev)
                                    keys.forEach(k => next.delete(k))
                                    return next
                                  })
                                }
                              }}
                            />
                          </td>
                          <td className={`px-4 py-3 ${isGroupedView ? 'pl-8' : ''}`}>
                            <div className="flex items-center gap-3">
                              {isGroupedView && (
                                <span className="text-gray-400 w-4 flex-shrink-0">├</span>
                              )}
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
                            <input
                              type="number"
                              value={variantPrices[group.variants[0]?.key] || 0}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0
                                group.variants.forEach(v => {
                                  handleVariantPriceChange(v.key, price)
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Rs 0.00"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={variantInventory[group.variants[0]?.key] || 0}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0
                                group.variants.forEach(v => {
                                  handleVariantInventoryChange(v.key, qty)
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3" />
                        </tr>
                      ) : null}
                      
                      {/* Variant rows: only when "All" is selected (so we don't show other option's values under a specific option like ddd). Single-option product still shows one row per variant. */}
                      {((options.length === 1) || (options.length > 1 && isExpanded && groupBy === GROUP_BY_ALL)) && group.variants.map((variant) => {
                        // Single option: show group value. Multiple options: show other option(s) as "optionName: value" when multiple variants, else show this option's value.
                        const variantDisplay = options.length === 1
                          ? group.value
                          : (variantCount > 1
                              ? (Object.entries(variant.values)
                                  .filter(([key]) => key !== displayGroupBy)
                                  .map(([optName, val]) => `${optName}: ${val}`)
                                  .join(' · ') || group.value)
                              : group.value)
                        
                        return (
                          <tr key={variant.key} className="hover:bg-gray-50 transition-colors">
                            <td className={`px-4 py-3 ${isGroupedView ? 'pl-8' : ''}`}>
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedVariantKeys.has(variant.key)}
                                onChange={() => toggleVariantSelection(variant.key)}
                              />
                            </td>
                            <td className={`px-4 py-3 ${isGroupedView ? 'pl-12' : ''}`}>
                              <div className="flex items-center gap-3">
                                {isGroupedView && (
                                  <span className="text-gray-400 w-4 flex-shrink-0">└</span>
                                )}
                                {!isGroupedView && options.length > 1 && variantCount > 1 && (
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
                            <td className="px-4 py-3">
                              <div
                                className="relative inline-block"
                                ref={el => { rowMenuRefs.current[variant.key] = el }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setRowMenuOpenKey(prev => prev === variant.key ? null : variant.key)}
                                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                  aria-label="Actions"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {rowMenuOpenKey === variant.key && (
                                  <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVariant(variant.key)}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
                  </>
                )}
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


