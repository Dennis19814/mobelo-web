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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !onUpload) return
    setError(null)
    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
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
    if (!confirm('Delete this media file?')) return
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
    }
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
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Media Gallery</h2>
        <p className="text-xs text-gray-500">Upload and manage product images and videos</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Side - Upload & Info */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
          {/* Upload Zone */}
          <div 
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
              isDraggingOver
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-orange-400'
            }`}
            onDragEnter={(e) => {
              e.preventDefault()
              if (!disabled && !uploading) setIsDraggingOver(true)
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
            
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                {uploading ? (
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                {uploading ? 'Uploading...' : 'Upload Media'}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Drag & drop or click
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="w-full px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow font-medium"
              >
                Choose Files
              </button>
              
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex items-center justify-center space-x-1">
                  <Image className="w-3 h-3" />
                  <span>Images: 5MB</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Play className="w-3 h-3" />
                  <span>Videos: 50MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-2">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-blue-900">Listing Thumbnail</p>
                  <p className="text-xs text-blue-700 truncate">Product listings</p>
                </div>
              </div>
            </div>
            
            <div className="p-2.5 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-900">Detail Thumbnail</p>
                  <p className="text-xs text-green-700 truncate">Product page</p>
                </div>
              </div>
            </div>
            
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                  <GripVertical className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900">Drag to Reorder</p>
                  <p className="text-xs text-gray-600 truncate">Change order</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Media Grid */}
        <div className="lg:col-span-3">
          {media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item, index) => (
                <div
                  key={item.id || index}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer
                    ${draggedItem === index ? 'opacity-40 scale-95' : 'hover:scale-[1.02]'}
                    ${
                      item.isListingThumbnail && item.isDetailThumbnail
                        ? 'ring-3 ring-orange-400'
                        : item.isListingThumbnail
                        ? 'ring-3 ring-blue-400'
                        : item.isDetailThumbnail
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
                                item.id && handleDelete(item.id)
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center">
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