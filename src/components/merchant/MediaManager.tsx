'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Star, Loader2, GripVertical, AlertCircle, Play, Clock, X, Check, Image } from 'lucide-react'
import { ProductMedia } from '@/types/product.types'

interface MediaManagerProps {
  productId?: number
  media: ProductMedia[]
  onMediaChange: (media: ProductMedia[]) => void
  onUpload?: (file: File) => Promise<ProductMedia | null>
  onDelete?: (mediaId: number) => Promise<boolean>
  onSetPrimary?: (mediaId: number) => Promise<boolean>
  onSetListingThumbnail?: (mediaId: number) => Promise<boolean>
  onSetDetailThumbnail?: (mediaId: number) => Promise<boolean>
  loading?: boolean
  disabled?: boolean
}

export default function MediaManager({
  productId,
  media,
  onMediaChange,
  onUpload,
  onDelete,
  onSetPrimary,
  onSetListingThumbnail,
  onSetDetailThumbnail,
  loading = false,
  disabled = false
}: MediaManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null)
  const [settingListingThumbnailId, setSettingListingThumbnailId] = useState<number | null>(null)
  const [settingDetailThumbnailId, setSettingDetailThumbnailId] = useState<number | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [newlyUploadedIds, setNewlyUploadedIds] = useState<Set<number | string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaContainerRef = useRef<HTMLDivElement>(null)
  const mediaItemRefs = useRef<Map<number | string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_MEDIA = 10

  const isVideoFile = (type: string) => type.startsWith('video/')
  const isImageFile = (type: string) => type.startsWith('image/')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetPrimary = async (mediaId: number) => {
    if (!onSetPrimary || !mediaId) return
    setSettingPrimaryId(mediaId)
    setError(null)
    try {
      const success = await onSetPrimary(mediaId)
      if (success) {
        onMediaChange(media.map(m => ({ ...m, isPrimary: m.id === mediaId })))
      } else {
        setError('Failed to set primary image')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image')
    } finally {
      setSettingPrimaryId(null)
    }
  }

  useEffect(() => {
    const images = media.filter(m => m.type === 'image' || !m.type)
    if (images.length === 1 && !images[0].isPrimary && onSetPrimary && !settingPrimaryId) {
      handleSetPrimary(images[0].id!)
    }
  }, [media])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Auto-scroll to top when error appears
  useEffect(() => {
    if (error && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [error])

  // Auto-scroll to top when delete confirmation appears
  useEffect(() => {
    if (confirmDeleteId !== null && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [confirmDeleteId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !onUpload) return
    setError(null)
    
    // Check max media limit
    const currentCount = media.length
    const filesToUpload = Array.from(files)
    if (currentCount + filesToUpload.length > MAX_MEDIA) {
      setError(`Maximum ${MAX_MEDIA} media files allowed. You can upload ${MAX_MEDIA - currentCount} more file(s).`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    setUploading(true)
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        if (!isImageFile(file.type) && !isVideoFile(file.type)) {
          throw new Error(`${file.name} is not supported. Only images and videos allowed.`)
        }
        const maxSize = isVideoFile(file.type) ? 50 * 1024 * 1024 : 5 * 1024 * 1024
        const maxSizeText = isVideoFile(file.type) ? '50MB' : '5MB'
        if (file.size > maxSize) {
          throw new Error(`${file.name} exceeds ${maxSizeText} limit`)
        }
        return onUpload(file)
      })
      const results = await Promise.all(uploadPromises)
      const newMedia = results.filter((m): m is ProductMedia => m !== null)
      if (newMedia.length > 0) {
        onMediaChange([...media, ...newMedia])
        
        // Track newly uploaded items for highlighting
        const newIds = newMedia.map((m, idx) => {
          // Use id if available, otherwise use tempId or create a unique identifier
          if (m.id) return m.id
          if ((m as any).tempId) return (m as any).tempId
          // Fallback: use the index in the new media array with a timestamp
          return `new-${Date.now()}-${idx}`
        })
        setNewlyUploadedIds(new Set(newIds))
        
        // Scroll to the last uploaded item after a short delay
        setTimeout(() => {
          const lastItem = newMedia[newMedia.length - 1]
          const lastItemId = lastItem.id || (lastItem as any).tempId || newIds[newIds.length - 1]
          const itemElement = mediaItemRefs.current.get(lastItemId)
          if (itemElement && mediaContainerRef.current) {
            itemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
          }
        }, 100)
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setNewlyUploadedIds(new Set())
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (mediaId: number) => {
    if (!onDelete || !mediaId) return
    setDeletingId(mediaId)
    setError(null)
    try {
      const success = await onDelete(mediaId)
      if (success) {
        onMediaChange(media.filter(m => m.id !== mediaId))
      } else {
        setError('Failed to delete')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const handleDeleteClick = (mediaId: number) => {
    setConfirmDeleteId(mediaId)
  }

  const handleSetListingThumbnail = async (mediaId: number) => {
    if (!onSetListingThumbnail || !mediaId) return
    setSettingListingThumbnailId(mediaId)
    setError(null)
    try {
      const success = await onSetListingThumbnail(mediaId)
      if (success) {
        onMediaChange(media.map(m => ({ ...m, isListingThumbnail: m.id === mediaId })))
      } else {
        setError('Failed to set listing thumbnail')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set listing thumbnail')
    } finally {
      setSettingListingThumbnailId(null)
    }
  }

  const handleSetDetailThumbnail = async (mediaId: number) => {
    if (!onSetDetailThumbnail || !mediaId) return
    setSettingDetailThumbnailId(mediaId)
    setError(null)
    try {
      const success = await onSetDetailThumbnail(mediaId)
      if (success) {
        onMediaChange(media.map(m => ({ ...m, isDetailThumbnail: m.id === mediaId })))
      } else {
        setError('Failed to set detail thumbnail')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set detail thumbnail')
    } finally {
      setSettingDetailThumbnailId(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === dropIndex) return
    const newMedia = [...media]
    const draggedMedia = newMedia[draggedItem]
    newMedia.splice(draggedItem, 1)
    newMedia.splice(dropIndex, 0, draggedMedia)
    const updatedMedia = newMedia.map((m, idx) => ({ ...m, displayOrder: idx }))
    onMediaChange(updatedMedia)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      {/* Delete Confirmation Toolbar - Absolute overlay at top */}
      {confirmDeleteId !== null && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 shadow-lg">
          <span className="text-sm">Delete this media file?</span>
          <div className="flex gap-2">
            <button
              onClick={() => void handleDelete(confirmDeleteId)}
              disabled={deletingId !== null}
              className="px-3 py-1 text-sm bg-white border border-orange-200 rounded hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed text-orange-700"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingId !== null}
              className="px-3 py-1 text-sm bg-white border border-orange-200 rounded hover:bg-gray-100 transition-colors text-orange-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Alert - Absolute overlay at top */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-start justify-between shadow-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-3.5 h-3.5 text-orange-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-orange-600 hover:text-orange-800 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Info Cards - One row on large screens */}
      <div className="mb-3 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Header */}
          <div className="flex items-center justify-between lg:justify-start lg:flex-1">
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-0.5">Media Gallery</h2>
              <p className="text-xs text-gray-500">Upload and manage product images and videos</p>
            </div>
          </div>

          {/* Info Cards - Horizontal */}
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
        <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg flex-1 min-w-[150px]">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
              <Star className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-900">Listing Thumbnail</p>
              <p className="text-xs text-blue-700 truncate">Product listings</p>
            </div>
          </div>
        </div>
        
        <div className="p-1.5 bg-green-50 border border-green-100 rounded-lg flex-1 min-w-[150px]">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center flex-shrink-0">
              <Star className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-green-900">Detail Thumbnail</p>
              <p className="text-xs text-green-700 truncate">Product page</p>
            </div>
          </div>
        </div>
        
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg flex-1 min-w-[150px]">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
              <GripVertical className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Drag to Reorder</p>
              <p className="text-xs text-gray-600 truncate">Change order</p>
            </div>
          </div>
        </div>
        
        {/* Media Count Card */}
        {(() => {
          const imageCount = media.filter(m => m.type === 'image' || !m.type).length
          const videoCount = media.filter(m => m.type === 'video').length
          const totalCount = media.length
          const isAtMax = totalCount >= MAX_MEDIA
          
          return (
            <div className={`p-1.5 border rounded-lg flex-1 min-w-[150px] ${
              isAtMax 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-center space-x-1.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                  isAtMax ? 'bg-orange-500' : 'bg-purple-500'
                }`}>
                  <Image className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${
                    isAtMax ? 'text-orange-900' : 'text-purple-900'
                  }`}>
                    {totalCount} / {MAX_MEDIA}
                  </p>
                  <p className={`text-xs truncate ${
                    isAtMax ? 'text-orange-700' : 'text-purple-700'
                  }`}>
                    {imageCount} {imageCount === 1 ? 'image' : 'images'}
                    {videoCount > 0 && `, ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
          </div>
        </div>
      </div>

      {/* Upload Media Card - Full Width */}
      <div 
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-300 flex-1 min-h-0 flex flex-col ${
          isDraggingOver
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-orange-400'
        }`}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled && !uploading && media.length < MAX_MEDIA) setIsDraggingOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false)
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          setIsDraggingOver(false)
          if (disabled || uploading || !onUpload) return
          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0) {
            // Check max media limit
            const currentCount = media.length
            if (currentCount + files.length > MAX_MEDIA) {
              setError(`Maximum ${MAX_MEDIA} media files allowed. You can upload ${MAX_MEDIA - currentCount} more file(s).`)
              return
            }
            const event = { target: { files } } as any
            handleFileSelect(event as React.ChangeEvent<HTMLInputElement>)
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        {/* Upload Zone Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="mb-1.5 flex justify-center">
            {uploading ? (
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                <Upload className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="text-xs font-medium text-gray-700 mb-0.5">
            {uploading ? 'Uploading...' : 'Upload Media'}
          </h3>
          <p className="text-xs text-gray-500 mb-1.5">
            Drag & drop or click
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || media.length >= MAX_MEDIA}
            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow font-medium"
          >
            {media.length >= MAX_MEDIA ? 'Max Reached' : 'Choose Files'}
          </button>
          
          <div className="mt-1.5 flex items-center justify-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Image className="w-3 h-3" />
              <span>Images: 5MB</span>
            </div>
            <div className="flex items-center space-x-1">
              <Play className="w-3 h-3" />
              <span>Videos: 50MB</span>
            </div>
          </div>
        </div>

        {/* Media Grid - Inside Upload Card - Horizontal Scrollable */}
        <div 
          ref={mediaContainerRef} 
          className="flex-1 overflow-x-auto overflow-y-hidden min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {media.length > 0 ? (
            <div className="flex gap-2.5 pb-4 pt-4 px-4" style={{ minWidth: 'max-content' }}>
              {media.map((item, index) => {
                // Create a unique identifier for each item
                const itemId = item.id || (item as any).tempId || `item-${index}-${item.url}`
                const isNewlyUploaded = newlyUploadedIds.has(itemId)
                return (
                <div
                  key={itemId}
                  ref={(el) => {
                    if (el) {
                      mediaItemRefs.current.set(itemId, el)
                    } else {
                      mediaItemRefs.current.delete(itemId)
                    }
                  }}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative flex-shrink-0 w-32 h-32"
                >
                  {/* Green shadow wrapper that pulses - only for newly uploaded */}
                  {isNewlyUploaded && (
                    <div 
                      className="absolute inset-0 rounded-xl pointer-events-none z-0"
                      style={{
                        boxShadow: '0 0 20px rgba(34, 197, 94, 1)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                  )}
                  <div
                    className={`
                      relative group aspect-square rounded-xl overflow-hidden bg-white transition-all duration-300 cursor-pointer w-full h-full
                      ${draggedItem === index ? 'opacity-40 scale-95' : 'hover:scale-[1.02]'}
                      ${isNewlyUploaded ? '' : 'shadow-sm hover:shadow-lg'}
                      ${
                        !isNewlyUploaded && item.isListingThumbnail && item.isDetailThumbnail
                          ? 'ring-3 ring-orange-400'
                          : !isNewlyUploaded && item.isListingThumbnail
                          ? 'ring-3 ring-blue-400'
                          : !isNewlyUploaded && item.isDetailThumbnail
                          ? 'ring-3 ring-green-400'
                          : ''
                      }
                    `}
                  >
                  {/* Badges */}
                  <div className="absolute top-2 left-2 z-20 flex flex-col space-y-1">
                    {item.isListingThumbnail && (
                      <div className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-md flex items-center space-x-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>List</span>
                      </div>
                    )}
                    {item.isDetailThumbnail && (
                      <div className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-md flex items-center space-x-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>Detail</span>
                      </div>
                    )}
                  </div>

                  {/* Media Content */}
                  <div className="w-full h-full relative bg-gray-100">
                    {item.type === 'video' ? (
                      <>
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 text-gray-800 ml-0.5" />
                          </div>
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-xs rounded flex items-center space-x-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDuration(item.duration)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.altText || 'Product image'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Hover Actions */}
                  {hoveredItem === index && !item.isUploading && deletingId !== item.id && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3 z-10 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-center space-x-1.5">
                          {onSetListingThumbnail && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                item.id && handleSetListingThumbnail(item.id)
                              }}
                              disabled={settingListingThumbnailId === item.id}
                              className={`p-2 rounded-lg transition-all shadow-md ${
                                item.isListingThumbnail 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-50'
                              }`}
                              title="Listing"
                            >
                              {settingListingThumbnailId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : item.isListingThumbnail ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Star className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          
                          {onSetDetailThumbnail && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                item.id && handleSetDetailThumbnail(item.id)
                              }}
                              disabled={settingDetailThumbnailId === item.id}
                              className={`p-2 rounded-lg transition-all shadow-md ${
                                item.isDetailThumbnail 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white/90 backdrop-blur-sm text-green-600 hover:bg-green-50'
                              }`}
                              title="Detail"
                            >
                              {settingDetailThumbnailId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : item.isDetailThumbnail ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Star className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                item.id && handleDeleteClick(item.id)
                              }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 text-red-600 transition-all shadow-md"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded">
                            <GripVertical className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading States */}
                  {(item.isUploading || deletingId === item.id) && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-6 h-6 text-orange-600 animate-spin mb-1.5" />
                      <p className="text-xs font-medium text-gray-700">
                        {item.isUploading ? 'Uploading...' : 'Deleting...'}
                      </p>
                    </div>
                  )}
                  </div>
                </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">No media yet</h3>
              <p className="text-xs text-gray-500">Upload images and videos to get started</p>
            </div>
    
          )}
        </div>
      </div>
    </div>
  )
}