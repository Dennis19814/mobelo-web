'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Star, Loader2, Image as ImageIcon, GripVertical, AlertCircle, Play, Clock, FileText } from 'lucide-react'
import type { ProductMedia } from '@/types/product.types'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper function to check if file is video
  const isVideoFile = (type: string) => type.startsWith('video/')
  const isImageFile = (type: string) => type.startsWith('image/')

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper function to format video duration
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
        onMediaChange(
          media.map(m => ({
            ...m,
            isPrimary: m.id === mediaId
          }))
        )
      } else {
        setError('Failed to set primary image')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image')
    } finally {
      setSettingPrimaryId(null)
    }
  }

  // Auto-set primary image when there's only one image
  useEffect(() => {
    // Only process if we have exactly one image (excluding videos)
    const images = media.filter(m => m.type === 'image' || !m.type)

    if (images.length === 1 && !images[0].isPrimary && onSetPrimary && !settingPrimaryId) {
      // Automatically set the only image as primary
      handleSetPrimary(images[0].id!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !onUpload) return

    setError(null)
    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type (images and videos)
        if (!isImageFile(file.type) && !isVideoFile(file.type)) {
          throw new Error(`${file.name} is not a supported media file. Only images and videos are allowed.`)
        }

        // Validate file size (images: 5MB, videos: 50MB)
        const maxSize = isVideoFile(file.type) ? 50 * 1024 * 1024 : 5 * 1024 * 1024
        const maxSizeText = isVideoFile(file.type) ? '50MB' : '5MB'
        
        if (file.size > maxSize) {
          throw new Error(`${file.name} exceeds ${maxSizeText} size limit`)
        }

        return onUpload(file)
      })

      const results = await Promise.all(uploadPromises)
      const newMedia = results.filter((m): m is ProductMedia => m !== null)
      
      if (newMedia.length > 0) {
        onMediaChange([...media, ...newMedia])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (mediaId: number) => {
    if (!onDelete || !mediaId) return

    if (!confirm('Are you sure you want to delete this image?')) return

    setDeletingId(mediaId)
    setError(null)

    try {
      const success = await onDelete(mediaId)
      if (success) {
        onMediaChange(media.filter(m => m.id !== mediaId))
      } else {
        setError('Failed to delete image')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetListingThumbnail = async (mediaId: number) => {
    if (!onSetListingThumbnail || !mediaId) return

    setSettingListingThumbnailId(mediaId)
    setError(null)

    try {
      const success = await onSetListingThumbnail(mediaId)
      if (success) {
        onMediaChange(
          media.map(m => ({
            ...m,
            isListingThumbnail: m.id === mediaId
          }))
        )
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
        onMediaChange(
          media.map(m => ({
            ...m,
            isDetailThumbnail: m.id === mediaId
          }))
        )
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
    
    // Remove dragged item
    newMedia.splice(draggedItem, 1)
    
    // Insert at new position
    newMedia.splice(dropIndex, 0, draggedMedia)
    
    // Update display order
    const updatedMedia = newMedia.map((m, idx) => ({
      ...m,
      displayOrder: idx
    }))
    
    onMediaChange(updatedMedia)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  // Allow dropping files anywhere in the media section (not just on the upload card)
  const handleSectionDragOver = (e: React.DragEvent) => {
    // Only prevent default for file drags so internal drag-and-drop (reordering) still works
    if (disabled || uploading || !onUpload) return
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
    }
  }

  const handleSectionDrop = (e: React.DragEvent) => {
    if (disabled || uploading || !onUpload) return
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const event = { target: { files } } as any
    handleFileSelect(event as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div
      className="space-y-6"
      onDragOver={handleSectionDragOver}
      onDrop={handleSectionDrop}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
        {/* Upload Area + Tips - Left Side */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full">
          <div 
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer ${
              isDraggingOver
                ? 'border-orange-500 bg-gradient-to-br from-orange-100 to-orange-50 scale-[1.02] shadow-lg'
                : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-50 hover:to-white'
            }`}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!disabled && !uploading) {
                setIsDraggingOver(true)
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDraggingOver(false)
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDraggingOver(false)
              if (disabled || uploading || !onUpload) return
              const files = Array.from(e.dataTransfer.files)
              if (files.length > 0) {
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
            
            <div className="space-y-3">
              <div className="flex justify-center">
                {uploading ? (
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  disabled={disabled || uploading}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium text-sm"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </span>
                  ) : (
                    'Select Media Files'
                  )}
                </button>
                
                <p className="text-xs text-gray-600 text-center">
                  Drag and drop files here or click to select
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                  <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Images: Max 5MB</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                  <Play className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Videos: Max 50MB</span>
                </div>
                <div className="flex items-start space-x-1.5 text-xs text-gray-500">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>JPG, PNG, GIF, WebP, MP4, WebM, MOV</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {media.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4 lg:mt-auto">
              <div className="text-xs text-orange-800 space-y-1.5">
                <p className="font-medium mb-2">💡 Tips:</p>
                <p>• Drag and drop media files to reorder them</p>
                <p>
                  • <span className="font-semibold text-blue-700">Blue star</span>: Feature on listing pages •{' '}
                  <span className="font-semibold text-green-700">Green star</span>: Feature on detail page
                </p>
                <p>• Hover over media to see available actions</p>
              </div>
            </div>
          )}
        </div>

        {/* Media Grid - Right Side */}
        <div className="flex-1">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <div
              key={item.id || index}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                relative group border-2 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all
                ${draggedItem === index ? 'opacity-50 scale-95' : ''}
                ${
                  item.isListingThumbnail && item.isDetailThumbnail
                    ? 'ring-2 ring-orange-500 border-orange-300'
                    : item.isListingThumbnail
                    ? 'ring-2 ring-blue-500 border-blue-300'
                    : item.isDetailThumbnail
                    ? 'ring-2 ring-green-500 border-green-300'
                    : item.isPrimary
                    ? 'ring-2 ring-purple-500 border-purple-300'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md cursor-move hover:bg-white">
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              {/* Thumbnail Badges */}
              <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1.5">
                {item.isListingThumbnail && (
                  <div className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg flex items-center space-x-1 shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Listing</span>
                  </div>
                )}
                {item.isDetailThumbnail && (
                  <div className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded-lg flex items-center space-x-1 shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Detail</span>
                  </div>
                )}
                {item.isPrimary && !item.isListingThumbnail && !item.isDetailThumbnail && (
                  <div className="px-2.5 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg flex items-center space-x-1 shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Primary</span>
                  </div>
                )}
              </div>

              {/* Media Display (Image or Video) */}
              <div className="aspect-square relative bg-gray-100">
                {item.type === 'video' ? (
                  <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                    {/* Video Preview */}
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="p-3 bg-white bg-opacity-90 rounded-full">
                        <Play className="w-6 h-6 text-gray-800 fill-current" />
                      </div>
                    </div>
                    {/* Duration Badge */}
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.altText || 'Product image'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+'
                    }}
                  />
                )}

                {/* Upload Loading Overlay */}
                {item.isUploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-2" />
                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                  </div>
                )}

                {/* Delete Loading Overlay */}
                {deletingId === item.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                    <p className="text-sm font-medium text-gray-700">Deleting...</p>
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute bottom-2 left-2 z-10">
                  <div className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center space-x-1 shadow-md ${
                    item.type === 'video'
                      ? 'bg-red-600 text-white'
                      : 'bg-orange-600 text-white'
                  }`}>
                    {item.type === 'video' ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Video</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>Image</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-2">
                    {onSetListingThumbnail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          item.id && handleSetListingThumbnail(item.id)
                        }}
                        disabled={disabled || settingListingThumbnailId === item.id}
                        className={`p-2.5 rounded-lg transition-all disabled:opacity-50 shadow-lg ${
                          item.isListingThumbnail 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Set as listing thumbnail"
                      >
                        {settingListingThumbnailId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Star className={`w-4 h-4 ${item.isListingThumbnail ? 'fill-current' : ''}`} />
                        )}
                      </button>
                    )}
                    
                    {onSetDetailThumbnail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          item.id && handleSetDetailThumbnail(item.id)
                        }}
                        disabled={disabled || settingDetailThumbnailId === item.id}
                        className={`p-2.5 rounded-lg transition-all disabled:opacity-50 shadow-lg ${
                          item.isDetailThumbnail 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-white text-green-600 hover:bg-green-50'
                        }`}
                        title="Set as detail thumbnail"
                      >
                        {settingDetailThumbnailId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Star className={`w-4 h-4 ${item.isDetailThumbnail ? 'fill-current' : ''}`} />
                        )}
                      </button>
                    )}
                    
                    {!item.isPrimary && !item.isListingThumbnail && !item.isDetailThumbnail && onSetPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          item.id && handleSetPrimary(item.id)
                        }}
                        disabled={disabled || settingPrimaryId === item.id}
                        className="p-2.5 bg-white rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 shadow-lg"
                        title="Set as primary"
                      >
                        {settingPrimaryId === item.id ? (
                          <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                        ) : (
                          <Star className="w-4 h-4 text-gray-700" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {onDelete && (
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          item.id && handleDelete(item.id)
                        }}
                        disabled={disabled || deletingId === item.id}
                        className="p-2.5 bg-white rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 shadow-lg"
                        title="Delete media"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-center space-x-3 mb-4">
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-7 h-7 text-gray-400" />
                </div>
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Play className="w-7 h-7 text-gray-400" />
                </div>
              </div>
              <p className="text-gray-600 font-medium mb-1">No media uploaded yet</p>
              <p className="text-sm text-gray-400">Upload images and videos to display them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}