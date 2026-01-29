'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Loader2, GripVertical, AlertCircle, X, Image, Plus } from 'lucide-react'
import { ProductMedia } from '@/types/product.types'

interface SimpleMediaManagerProps {
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

export default function SimpleMediaManager({
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
}: SimpleMediaManagerProps) {
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
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_MEDIA = 10

  const isImageFile = (type: string) => type.startsWith('image/')
  const getMediaKey = (item: ProductMedia, index: number) =>
    (item.id ?? (item as any).tempId ?? item.url ?? `media-${index}`) as string | number

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

  useEffect(() => {
    if (media.length === 0) return
    const ordered = [...media].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    const first = ordered[0]
    if (!first) return
    const firstId = first.id ?? (first as any).tempId ?? first.url
    const hasPrimary = media.some(m => m.isPrimary)
    const needsListing = !first.isListingThumbnail || media.some(m => {
      const id = m.id ?? (m as any).tempId ?? m.url
      return id !== firstId && m.isListingThumbnail
    })
    const needsDetail = !first.isDetailThumbnail || media.some(m => {
      const id = m.id ?? (m as any).tempId ?? m.url
      return id !== firstId && m.isDetailThumbnail
    })
    const needsPrimary = !hasPrimary && !first.isPrimary

    if (needsListing || needsDetail || needsPrimary) {
      const updated = media.map(m => {
        const id = m.id ?? (m as any).tempId ?? m.url
        return {
          ...m,
          isListingThumbnail: id === firstId,
          isDetailThumbnail: id === firstId,
          isPrimary: hasPrimary ? m.isPrimary : id === firstId
        }
      })
      onMediaChange(updated)
    }
  }, [media])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (error && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [error])

  useEffect(() => {
    if (confirmDeleteId !== null && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [confirmDeleteId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !onUpload) return
    setError(null)

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

    for (const file of filesToUpload) {
      try {
        if (!isImageFile(file.type)) {
          setError('Only image files are allowed')
          continue
        }

        const uploaded = await onUpload(file)
        if (uploaded) {
          setNewlyUploadedIds(prev => new Set(prev).add(uploaded.id as number))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file')
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setUploading(false)
  }

  const handleDelete = async (mediaId: number) => {
    if (!onDelete || deletingId !== null) return
    setDeletingId(mediaId)
    setError(null)
    try {
      const success = await onDelete(mediaId)
      if (success) {
        onMediaChange(media.filter(m => m.id !== mediaId))
      } else {
        setError('Failed to delete media')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
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

  const handleDragStart = (index: number) => {
    if (disabled) return
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === dropIndex) return
    const ordered = [...media].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    const main = ordered[0]
    const thumbs = ordered.slice(1)
    if (!main || thumbs.length === 0) return
    const draggedMedia = thumbs[draggedItem]
    thumbs.splice(draggedItem, 1)
    thumbs.splice(dropIndex, 0, draggedMedia)
    const updatedMedia = [main, ...thumbs].map((m, idx) => ({ ...m, displayOrder: idx }))
    const firstImageIndex = updatedMedia.findIndex(m => m.type === 'image' || !m.type)
    const withAutoThumbs = updatedMedia.map((item, index) => {
      const isMain = index === firstImageIndex && firstImageIndex !== -1
      return {
        ...item,
        isListingThumbnail: isMain,
        isDetailThumbnail: isMain
      }
    })
    onMediaChange(withAutoThumbs)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const orderedMedia = [...media].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  const mainMedia = orderedMedia[0]

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
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

      <div
        className={`relative rounded-xl border border-gray-200 p-6 transition-all duration-300 flex-1 min-h-0 flex flex-col ${
          isDraggingOver ? 'ring-2 ring-orange-200' : ''
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
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {media.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-700">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading || media.length >= MAX_MEDIA}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 text-orange-500" />
                  Upload Media
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading || media.length >= MAX_MEDIA}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image className="w-4 h-4 text-orange-500" />
                  Select Existing
                </button>
              </div>
              <p className="text-sm text-gray-600">You can upload Images.</p>
              <p className="text-sm text-gray-500">Images up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-700">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading || media.length >= MAX_MEDIA}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 text-orange-500" />
                Upload Media
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading || media.length >= MAX_MEDIA}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image className="w-4 h-4 text-orange-500" />
                Select Existing
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              {mainMedia && (
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <div className="relative aspect-[4/3] bg-gray-50">
                    <img src={mainMedia.url} alt={mainMedia.altText || ''} className="w-full h-full object-cover" />
                    {mainMedia.isListingThumbnail && (
                      <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">
                        Listing
                      </span>
                    )}
                    {mainMedia.isDetailThumbnail && (
                      <span className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded">
                        Detail
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 auto-rows-fr">
                {orderedMedia.slice(1).map((item, index) => {
                  const itemId = getMediaKey(item, index + 1)
                  const isNewlyUploaded = newlyUploadedIds.has(itemId)
                  return (
                    <div
                      key={itemId}
                      className={`relative group rounded-lg border border-gray-200 bg-white overflow-hidden ${
                        isNewlyUploaded ? 'ring-2 ring-green-400' : ''
                      } ${draggedItem === index ? 'opacity-60 scale-95' : 'hover:shadow-sm'}`}
                      draggable={!disabled}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="relative w-full aspect-square">
                        <img src={item.url} alt={item.altText || ''} className="w-full h-full object-cover" />
                      </div>

                      {hoveredItem === index && (
                        <button
                          onClick={() => setConfirmDeleteId(item.id as number)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="absolute bottom-1 right-1 rounded bg-white/80 p-0.5 text-gray-500">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )
                })}

                {orderedMedia.length < MAX_MEDIA && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="aspect-square rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
