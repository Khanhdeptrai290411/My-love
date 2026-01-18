'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostCardProps {
  post: any
  onUpdate: () => void
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editImages, setEditImages] = useState(post.images || [])
  
  // Debug: log images when post changes
  useEffect(() => {
    console.log('PostCard - Post images:', post.images)
  }, [post.images])
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarring, setIsStarring] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  const isMyPost = post.author?.email === session?.user?.email

  const { data: commentsData, mutate: mutateComments } = useSWR(
    showComments ? `/api/posts/${post.id}/comments` : null,
    fetcher
  )

  useEffect(() => {
    setEditContent(post.content)
    setEditImages(post.images || [])
  }, [post])

  const handleStar = async () => {
    setIsStarring(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !post.starred }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.post.starred ? 'Đã đánh dấu sao' : 'Đã bỏ đánh dấu sao')
        onUpdate()
      } else {
        toast.error(data.error || 'Lỗi khi đánh dấu sao')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsStarring(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Đã xóa bài đăng')
        onUpdate()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Lỗi khi xóa bài đăng')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, images: editImages, postId: post.id }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã cập nhật bài đăng!')
        setIsEditing(false)
        onUpdate()
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsSaving(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setIsCommenting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã thêm bình luận')
        setCommentText('')
        mutateComments()
      } else {
        toast.error(data.error || 'Lỗi khi thêm bình luận')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsCommenting(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Author Header */}
      <div className="flex items-center gap-3 mb-3">
        {post.author?.image ? (
          <Image
            src={post.author.image}
            alt={post.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold">
            {post.author?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{post.author?.name || 'Người dùng'}</h3>
          <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
        </div>
        {isMyPost && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3 mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
            rows={3}
          />
          
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploading(true)
                try {
                  const formData = new FormData()
                  formData.append('file', file)
                  const res = await fetch('/api/upload', { method: 'POST', body: formData })
                  const data = await res.json()
                  if (res.ok) {
                    setEditImages([...editImages, { url: data.url, publicId: data.publicId }])
                    toast.success('Upload ảnh thành công!')
                  } else {
                    toast.error(data.error || 'Upload thất bại')
                  }
                } catch (error) {
                  toast.error('Có lỗi xảy ra khi upload')
                } finally {
                  setUploading(false)
                }
              }}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
          </div>

          {editImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {editImages.map((img: any, index: number) => (
                <div key={index} className="relative group">
                  {img.url.startsWith('data:') ? (
                    <img
                      src={img.url}
                      alt={`Edit ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <Image
                      src={img.url}
                      alt={`Edit ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-24 object-cover rounded-lg"
                      unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setEditImages(editImages.filter((_: any, i: number) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 text-sm"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditContent(post.content)
                setEditImages(post.images || [])
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>

          {/* Images */}
          {post.images && Array.isArray(post.images) && post.images.length > 0 ? (
            <div className={`grid gap-2 mb-3 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.images.map((img: any, index: number) => {
                if (!img || !img.url) {
                  console.warn('Invalid image at index', index, img)
                  return null
                }
                return (
                  <div key={index} className="relative">
                    {img.url.startsWith('data:') ? (
                      // Base64 image - use regular img tag
                      <img
                        src={img.url}
                        alt={`Post image ${index + 1}`}
                        className="w-full max-h-64 object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Image load error:', img.url?.substring(0, 50))
                        }}
                      />
                    ) : (
                      // Cloudinary or external URL - use Next.js Image
                      <Image
                        src={img.url}
                        alt={`Post image ${index + 1}`}
                        width={400}
                        height={300}
                        className="w-full max-h-64 object-cover rounded-lg"
                        unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                        onError={(e) => {
                          console.error('Image load error:', img.url)
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            post.images && console.log('Post has images but not array:', post.images)
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <button
              onClick={handleStar}
              disabled={isStarring}
              className={`flex items-center gap-1 text-sm font-semibold transition disabled:opacity-50 ${
                post.starred ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
              }`}
            >
              {post.starred ? '⭐' : '☆'} {post.starred ? 'Đã lưu' : 'Lưu'}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              💬 Bình luận
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {/* Comment List */}
              {commentsData?.comments && commentsData.comments.length > 0 && (
                <div className="space-y-3 mb-3">
                  {commentsData.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2">
                      {comment.user?.image ? (
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name}
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold text-xs flex-shrink-0">
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{comment.user?.name}</span>
                          <span className="text-xs text-gray-500">{formatTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-800">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Form */}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white text-sm"
                />
                <button
                  type="submit"
                  disabled={isCommenting || !commentText.trim()}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 text-sm font-semibold"
                >
                  {isCommenting ? '...' : 'Gửi'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}

