'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Custom Reaction Icon Component
const ReactionIcon = ({ type, filled = false, size = 20 }: { type: string; filled?: boolean; size?: number }) => {
  const icons: Record<string, { empty: string; filled: string }> = {
    like: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H16.4262C17.907 22 19.1662 20.9197 19.3914 19.4562L20.4683 12.4562C20.7479 10.6388 19.3411 9 17.5032 9H14C13.4477 9 13 8.55228 13 8V4.46584C13 3.10399 11.896 2 10.5342 2C10.2093 2 9.91498 2.1913 9.78306 2.48812L7.26394 8.57859C7.09896 8.96184 6.74513 9.22219 6.3303 9.22219H4C2.89543 9.22219 2 10.1176 2 11.2222V13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H16.4262C17.907 22 19.1662 20.9197 19.3914 19.4562L20.4683 12.4562C20.7479 10.6388 19.3411 9 17.5032 9H14C13.4477 9 13 8.55228 13 8V4.46584C13 3.10399 11.896 2 10.5342 2C10.2093 2 9.91498 2.1913 9.78306 2.48812L7.26394 8.57859C7.09896 8.96184 6.74513 9.22219 6.3303 9.22219H4C2.89543 9.22219 2 10.1176 2 11.2222V13Z"/>
      </svg>`
    },
    love: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z"/>
      </svg>`
    },
    haha: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        
        <!-- Face -->
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    
        <!-- Eyes: laughing (closed) -->
        <path d="M7 9.5C8.5 8 10 8 11.5 9.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12.5 9.5C14 8 15.5 8 17 9.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    
        <!-- Mouth: big open laugh -->
        <path d="M7.5 13
                 C9.5 16.5 14.5 16.5 16.5 13
                 Z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linejoin="round"/>
    
        <!-- Tongue -->
        <path d="M10.2 14.2
                 C10.8 15.2 13.2 15.2 13.8 14.2"
          stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`,
    
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg">
    
        <!-- Face -->
        <circle cx="12" cy="12" r="10"/>
    
        <!-- Eyes -->
        <path d="M7 9.5C8.5 8 10 8 11.5 9.5"
          stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M12.5 9.5C14 8 15.5 8 17 9.5"
          stroke="white" stroke-width="2" stroke-linecap="round"/>
    
        <!-- Mouth -->
        <path d="M7.5 13
                 C9.5 16.5 14.5 16.5 16.5 13
                 Z"
          fill="white"/>
    
        <!-- Tongue -->
        <path d="M10.2 14.2
                 C10.8 15.2 13.2 15.2 13.8 14.2"
          stroke="#ff9aa2" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    },
    
    wow: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
        <ellipse cx="12" cy="15" rx="3" ry="2" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="9" cy="9" r="1.5" fill="white"/>
        <circle cx="15" cy="9" r="1.5" fill="white"/>
        <ellipse cx="12" cy="15" rx="3" ry="2" fill="white"/>
      </svg>`
    },
    sad: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 10C8 10 8.5 11 9 11C9.5 11 10 10 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M14 10C14 10 14.5 11 15 11C15.5 11 16 10 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 15C8 15 9.5 13 12 13C14.5 13 16 15 16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 10C8 10 8.5 11 9 11C9.5 11 10 10 10 10" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <path d="M14 10C14 10 14.5 11 15 11C15.5 11 16 10 16 10" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <path d="M8 15C8 15 9.5 13 12 13C14.5 13 16 15 16 15" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </svg>`
    },
    angry: {
      empty: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 9L10 11L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 9L14 11L16 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 16C8 16 10 14 12 14C14 14 16 16 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      filled: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 9L10 11L8 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M16 9L14 11L16 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M8 16C8 16 10 14 12 14C14 14 16 16 16 16" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </svg>`
    }
  }

  const iconSvg = icons[type]?.[filled ? 'filled' : 'empty'] || icons.like.empty

  // Base color per reaction type – always colored, even when not filled
  const baseColorClass =
    type === 'like' ? 'text-blue-500'
    : type === 'love' ? 'text-red-500'
    : type === 'haha' ? 'text-yellow-500'
    : type === 'wow' ? 'text-yellow-400'
    : type === 'sad' ? 'text-blue-400'
    : 'text-red-600'

  const colorClass = filled
    ? `${baseColorClass} opacity-100`
    : `${baseColorClass} opacity-70`

  return (
    <span 
      key={`${type}-${filled}`}
      className={`inline-flex items-center justify-center transition-all duration-300 ease-in-out ${colorClass}`}
      style={{ 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, color'
      }}
      dangerouslySetInnerHTML={{ __html: iconSvg }}
    />
  )
}

interface PostCardProps {
  post: any
  onUpdate: () => void
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editImages, setEditImages] = useState(post.images || [])
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
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
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [showReactions, setShowReactions] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
  const [showReactionList, setShowReactionList] = useState(false)
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reactionListTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [hoveredReactionType, setHoveredReactionType] = useState<string | null>(null)

  const isMyPost = post.author?.email === session?.user?.email

  // Always fetch comments to check if there are any
  const { data: commentsData, mutate: mutateComments } = useSWR(
    `/api/posts/${post.id}/comments`,
    fetcher
  )

  // Fetch reactions - with lightweight polling for near-realtime updates
  const { data: reactionsData, mutate: mutateReactions } = useSWR(
    `/api/posts/${post.id}/reactions`,
    fetcher,
    {
      // cho cảm giác realtime giữa 2 người
      refreshInterval: 3000, // 3s
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  // Auto-show comments if there are any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch =
        'ontouchstart' in window ||
        // @ts-ignore
        (navigator && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0))
      if (hasTouch) {
        setIsTouchDevice(true)
      }
    }
  }, [])

  useEffect(() => {
    if (commentsData?.comments && commentsData.comments.length > 0) {
      setShowComments(true)
    }
  }, [commentsData])

  useEffect(() => {
    setEditContent(post.content)
    setEditImages(post.images || [])
  }, [post])

  const handleStar = async () => {
    // Optimistic update - update UI immediately
    const newStarred = !post.starred
    post.starred = newStarred // Update local state immediately
    onUpdate() // Trigger parent re-render
    
    setIsStarring(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: newStarred }),
      })

      const data = await res.json()
      if (res.ok) {
        // Sync with server response
        post.starred = data.post.starred
        onUpdate()
      } else {
        // Rollback on error
        post.starred = !newStarred
        toast.error(data.error || 'Lỗi khi đánh dấu sao')
        onUpdate()
      }
    } catch (error) {
      // Rollback on error
      post.starred = !newStarred
      toast.error('Có lỗi xảy ra')
      onUpdate()
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
        setShowComments(true) // Show comments after posting
      } else {
        toast.error(data.error || 'Lỗi khi thêm bình luận')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    const text = replyTexts[commentId]?.trim()
    if (!text) return

    setIsCommenting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentCommentId: commentId }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Đã trả lời bình luận')
        setReplyTexts((prev) => {
          const next = { ...prev }
          next[commentId] = ''
          return next
        })
        mutateComments()
        setShowComments(true)
      } else {
        toast.error(data.error || 'Lỗi khi trả lời bình luận')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleReaction = async (type: string) => {
    if (isReacting) return
    
    // Optimistic update - update UI immediately
    const currentReaction = reactionsData?.myReaction?.type
    const isRemoving = currentReaction === type
    const currentReactions = reactionsData?.reactions || {}
    const currentUser = session?.user
    const myReactionId = reactionsData?.myReaction?.id
    
    // Find current user's userId from existing reactions
    let currentUserId = 'temp-user-id'
    if (currentReactions[currentReaction || 'like']) {
      const myExistingReaction = currentReactions[currentReaction || 'like'].find(
        (r: any) => r.id === myReactionId
      )
      if (myExistingReaction) {
        currentUserId = myExistingReaction.userId
      }
    }
    
    // Create optimistic data
    let optimisticData: any = {
      reactions: { ...currentReactions },
      myReaction: null,
    }
    
    if (isRemoving) {
      // Remove reaction optimistically
      const reactionType = currentReaction as string
      if (currentReactions[reactionType]) {
        optimisticData.reactions[reactionType] = currentReactions[reactionType].filter(
          (r: any) => r.id !== myReactionId
        )
      }
      optimisticData.myReaction = null
    } else {
      // Add or update reaction optimistically
      const oldType = currentReaction
      
      // Remove from old type if exists
      if (oldType && currentReactions[oldType]) {
        optimisticData.reactions[oldType] = currentReactions[oldType].filter(
          (r: any) => r.id !== myReactionId
        )
      }
      
      // Add to new type
      if (!optimisticData.reactions[type]) {
        optimisticData.reactions[type] = []
      }
      
      const tempId = 'temp-' + Date.now()
      const newReaction = {
        id: tempId,
        userId: currentUserId,
        user: {
          name: currentUser?.name || 'Bạn',
          email: currentUser?.email || '',
          image: currentUser?.image || null,
        },
        type,
      }
      
      optimisticData.reactions[type] = [...optimisticData.reactions[type], newReaction]
      optimisticData.myReaction = {
        id: tempId,
        type,
      }
    }
    
    // Apply optimistic update immediately (false = don't revalidate yet)
    mutateReactions(optimisticData, false)
    
    setIsReacting(true)
    try {
      // If user already has this reaction, remove it
      if (currentReaction === type) {
        const res = await fetch(`/api/posts/${post.id}/reactions`, {
          method: 'DELETE',
        })
        if (res.ok) {
          // Update with server response directly, no revalidate to avoid flicker
          const serverData = {
            reactions: optimisticData.reactions,
            myReaction: null,
          }
          mutateReactions(serverData, false)
        } else {
          // Rollback on error - revalidate to get correct state
          mutateReactions(undefined, { revalidate: true })
        }
      } else {
        // Add or update reaction
        const res = await fetch(`/api/posts/${post.id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        })
        if (res.ok) {
          const data = await res.json()
          // Update with server response directly, no revalidate to avoid flicker
          if (data.reaction) {
            // Merge server response with optimistic data
            const serverReactions = { ...optimisticData.reactions }
            const reactionType = data.reaction.type
            
            // Remove temp reaction and add real one
            if (serverReactions[reactionType]) {
              serverReactions[reactionType] = serverReactions[reactionType].filter(
                (r: any) => !r.id.startsWith('temp-')
              )
              serverReactions[reactionType].push(data.reaction)
            }
            
            const serverData = {
              reactions: serverReactions,
              myReaction: {
                id: data.reaction.id,
                type: data.reaction.type,
              },
            }
            mutateReactions(serverData, false)
          }
        } else {
          // Rollback on error - revalidate to get correct state
          mutateReactions(undefined, { revalidate: true })
        }
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
      // Rollback on error - revalidate to get correct state
      mutateReactions(undefined, { revalidate: true })
    } finally {
      setIsReacting(false)
    }
  }

  const reactionLabels: Record<string, string> = {
    like: 'Thích',
    love: 'Yêu thích',
    haha: 'Haha',
    wow: 'Wow',
    sad: 'Buồn',
    angry: 'Phẫn nộ',
  }

  // Handle reaction picker with delay (desktop / non-touch)
  const handleReactionPickerEnter = () => {
    if (isTouchDevice) return
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current)
      reactionTimeoutRef.current = null
    }
    setShowReactions(true)
  }

  const handleReactionPickerLeave = () => {
    if (isTouchDevice) return
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactions(false)
    }, 300) // 300ms delay before hiding
  }

  // Long-press for touch devices to open picker
  const handleReactionPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isTouchDevice) return
    
    // Prevent default behaviors (text selection, context menu)
    e.preventDefault()
    e.stopPropagation()
    
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
    }
    longPressTimeoutRef.current = setTimeout(() => {
      setIsLongPressing(true)
      setShowReactions(true)
    }, 300)
  }

  const handleReactionPressEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isTouchDevice) return
    
    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()
    
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
    // Nếu không đủ lâu để coi là long press -> coi như click "Thích"
    if (!isLongPressing) {
      handleReaction('like')
    }
    setIsLongPressing(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current)
      }
      if (reactionListTimeoutRef.current) {
        clearTimeout(reactionListTimeoutRef.current)
      }
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [])

  const getTotalReactions = () => {
    if (!reactionsData?.reactions) return 0
    return Object.values(reactionsData.reactions).reduce((sum: number, arr: any) => sum + arr.length, 0)
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
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={post.author.image}
              alt={post.author.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
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

          {/* Images - Improved layout */}
          {post.images && Array.isArray(post.images) && post.images.length > 0 ? (
            <div className={`mb-3 rounded-lg overflow-hidden ${
              post.images.length === 1 
                ? 'grid grid-cols-1' 
                : post.images.length === 2
                ? 'grid grid-cols-2 gap-2'
                : post.images.length === 3
                ? 'grid grid-cols-2 gap-2'
                : 'grid grid-cols-2 gap-2'
            }`}>
              {post.images.map((img: any, index: number) => {
                if (!img || !img.url) {
                  console.warn('Invalid image at index', index, img)
                  return null
                }
                const isFirstImage = index === 0
                const isLastImage = index === post.images.length - 1
                const isOnlyImage = post.images.length === 1
                
                const handleOpenViewer = () => {
                  setCurrentImageIndex(index)
                  setImageViewerOpen(true)
                }

                return (
                  <div 
                    key={index} 
                    className={`relative ${
                      post.images.length === 3 && index === 0 
                        ? 'row-span-2' 
                        : post.images.length === 4 && index === 0
                        ? 'row-span-2'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleOpenViewer}
                      className="block w-full focus:outline-none"
                    >
                      {img.url.startsWith('data:') ? (
                        <img
                          src={img.url}
                          alt={`Post image ${index + 1}`}
                          className={`w-full h-auto object-contain ${
                            isOnlyImage ? 'max-h-96' : 'max-h-64'
                          }`}
                          style={{ maxWidth: '100%' }}
                          onError={(e) => {
                            console.error('Image load error:', img.url?.substring(0, 50))
                          }}
                        />
                      ) : (
                        <Image
                          src={img.url}
                          alt={`Post image ${index + 1}`}
                          width={400}
                          height={400}
                          className={`w-full h-auto object-contain ${
                            isOnlyImage ? 'max-h-96' : 'max-h-64'
                          }`}
                          style={{ maxWidth: '100%', height: 'auto' }}
                          unoptimized={img.url.startsWith('http') && !img.url.includes('cloudinary')}
                          onError={(e) => {
                            console.error('Image load error:', img.url)
                          }}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            post.images && console.log('Post has images but not array:', post.images)
          )}

          {/* Reactions Summary */}
          {getTotalReactions() > 0 && (
            <div 
              className="relative flex items-center gap-2 pt-2 pb-2 cursor-pointer"
              onMouseEnter={() => {
                if (reactionListTimeoutRef.current) {
                  clearTimeout(reactionListTimeoutRef.current)
                }
                setShowReactionList(true)
              }}
              onMouseLeave={() => {
                reactionListTimeoutRef.current = setTimeout(() => {
                  setShowReactionList(false)
                }, 200)
              }}
            >
              <div className="flex items-center gap-1">
                {reactionsData?.reactions?.love?.length > 0 && (
                  <ReactionIcon type="love" filled size={16} />
                )}
                {reactionsData?.reactions?.like?.length > 0 && (
                  <ReactionIcon type="like" filled size={16} />
                )}
                {reactionsData?.reactions?.haha?.length > 0 && (
                  <ReactionIcon type="haha" filled size={16} />
                )}
                {reactionsData?.reactions?.wow?.length > 0 && (
                  <ReactionIcon type="wow" filled size={16} />
                )}
                {reactionsData?.reactions?.sad?.length > 0 && (
                  <ReactionIcon type="sad" filled size={16} />
                )}
                {reactionsData?.reactions?.angry?.length > 0 && (
                  <ReactionIcon type="angry" filled size={16} />
                )}
              </div>
              <span className="text-sm text-gray-600 hover:underline">{getTotalReactions()}</span>
              
              {/* Reaction List Tooltip */}
              {showReactionList && reactionsData?.reactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] z-20"
                  onMouseEnter={() => {
                    if (reactionListTimeoutRef.current) {
                      clearTimeout(reactionListTimeoutRef.current)
                    }
                    setShowReactionList(true)
                  }}
                  onMouseLeave={() => {
                    reactionListTimeoutRef.current = setTimeout(() => {
                      setShowReactionList(false)
                    }, 200)
                  }}
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(reactionsData.reactions).map(([type, users]: [string, any]) => {
                      if (!users || users.length === 0) return null
                      return (
                        <div key={type} className="flex items-start gap-2 pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <ReactionIcon type={type} filled size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-700 mb-1">{reactionLabels[type]}</div>
                            <div className="text-xs text-gray-600">
                              {users.map((u: any, idx: number) => (
                                <span key={u.userId}>
                                  <span className="font-medium">{u.user?.name || 'Người dùng'}</span>
                                  {idx < users.length - 1 && <span className="text-gray-400">, </span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <div className="relative flex-1">
              <button
                onMouseEnter={handleReactionPickerEnter}
                onMouseLeave={handleReactionPickerLeave}
                onClick={isTouchDevice ? undefined : () => handleReaction('like')}
                onMouseDown={handleReactionPressStart}
                onMouseUp={handleReactionPressEnd}
                onTouchStart={handleReactionPressStart}
                onTouchEnd={handleReactionPressEnd}
                onTouchCancel={handleReactionPressEnd}
                onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
                disabled={isReacting}
                style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                className={`flex items-center gap-1 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                  reactionsData?.myReaction?.type 
                    ? reactionsData.myReaction.type === 'like' ? 'text-blue-500'
                      : reactionsData.myReaction.type === 'love' ? 'text-red-500'
                      : reactionsData.myReaction.type === 'haha' ? 'text-yellow-500'
                      : reactionsData.myReaction.type === 'wow' ? 'text-yellow-400'
                      : reactionsData.myReaction.type === 'sad' ? 'text-blue-400'
                      : 'text-red-600'
                    : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <span className="inline-flex items-center justify-center transition-all duration-300 ease-in-out">
                  {reactionsData?.myReaction?.type ? (
                    <ReactionIcon 
                      key={`reaction-${reactionsData.myReaction.type}-filled`}
                      type={reactionsData.myReaction.type} 
                      filled 
                      size={18}
                    />
                  ) : (
                    <ReactionIcon 
                      key="reaction-like-empty"
                      type="like" 
                      filled={false} 
                      size={18} 
                    />
                  )}
                </span>
                <span className="transition-all duration-300 ease-in-out">
                  {reactionsData?.myReaction?.type 
                    ? reactionLabels[reactionsData.myReaction.type]
                    : 'Thích'}
                </span>
              </button>
              
              {/* Reaction Picker */}
              {showReactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-2 flex gap-1 z-10"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                  onMouseEnter={handleReactionPickerEnter}
                  onMouseLeave={handleReactionPickerLeave}
                  onTouchStart={(e) => {
                    if (!isTouchDevice) return
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onTouchMove={(e) => {
                    if (!isTouchDevice) return
                    e.preventDefault() // Prevent scrolling and text selection
                    e.stopPropagation()
                    const touch = e.touches[0]
                    if (!touch) return
                    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
                    if (!el) return
                    const btn = el.closest('[data-reaction-type]') as HTMLElement | null
                    const type = btn?.getAttribute('data-reaction-type')
                    if (type) {
                      setHoveredReactionType(type)
                    } else {
                      setHoveredReactionType(null)
                    }
                  }}
                  onTouchEnd={() => {
                    if (!isTouchDevice) return
                    if (hoveredReactionType) {
                      handleReaction(hoveredReactionType)
                    }
                    setShowReactions(false)
                    setHoveredReactionType(null)
                    setIsLongPressing(false)
                  }}
                  onTouchCancel={() => {
                    if (!isTouchDevice) return
                    setShowReactions(false)
                    setHoveredReactionType(null)
                    setIsLongPressing(false)
                  }}
                >
                  {Object.keys(reactionLabels).map((type) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleReaction(type)
                        setShowReactions(false)
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setHoveredReactionType(type)
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleReaction(type)
                        setShowReactions(false)
                        setHoveredReactionType(null)
                      }}
                      data-reaction-type={type}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                      className={`transition-all duration-200 ease-in-out p-1 ${
                        hoveredReactionType === type ? 'scale-125' : 'hover:scale-125 active:scale-110'
                      }`}
                      title={reactionLabels[type]}
                    >
                      <ReactionIcon 
                        type={type} 
                        filled={reactionsData?.myReaction?.type === type}
                        size={32}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              💬 Bình luận
            </button>
            
            <button
              onClick={handleStar}
              disabled={isStarring}
              className={`flex items-center gap-1 text-sm font-semibold transition disabled:opacity-50 ${
                post.starred ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
              }`}
            >
              {post.starred ? '⭐' : '☆'} {post.starred ? 'Đã lưu' : 'Lưu'}
            </button>
          </div>

          {/* Comments Section - Always show if there are comments or if user wants to comment */}
          {(showComments || (commentsData?.comments && commentsData.comments.length > 0)) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {/* Comment List - root + replies */}
              {commentsData?.comments && commentsData.comments.length > 0 && (() => {
                const comments = commentsData.comments
                const rootComments = comments.filter((c: any) => !c.parentCommentId)
                const repliesByParent: Record<string, any[]> = {}
                comments.forEach((c: any) => {
                  if (c.parentCommentId) {
                    if (!repliesByParent[c.parentCommentId]) repliesByParent[c.parentCommentId] = []
                    repliesByParent[c.parentCommentId].push(c)
                  }
                })

                return (
                  <div className="space-y-3 mb-3">
                    {rootComments.map((comment: any) => (
                      <div key={comment.id}>
                        <div className="flex gap-2">
                          {comment.user?.image ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={comment.user.image}
                                alt={comment.user.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
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
                            <p className="text-sm text-gray-800 mb-1">{comment.text}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyOpen((prev) => ({
                                  ...prev,
                                  [comment.id]: !prev[comment.id],
                                }))
                              }}
                              className="text-xs text-gray-500 hover:text-pink-500 font-medium"
                            >
                              Trả lời
                            </button>
                          </div>
                        </div>

                        {/* Replies */}
                        {repliesByParent[comment.id] && repliesByParent[comment.id].length > 0 && (
                          <div className="mt-2 ml-10 space-y-2">
                            {repliesByParent[comment.id].map((reply: any) => (
                              <div key={reply.id} className="flex gap-2">
                                {reply.user?.image ? (
                                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                      src={reply.user.image}
                                      alt={reply.user.name}
                                      width={28}
                                      height={28}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold text-[10px] flex-shrink-0">
                                    {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div className="flex-1 bg-white rounded-lg p-2 border border-gray-100">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-gray-900">{reply.user?.name}</span>
                                    <span className="text-[10px] text-gray-500">{formatTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-gray-800">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input - only show when user clicked Trả lời */}
                        {replyOpen[comment.id] && (
                          <div className="mt-2 ml-10">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={replyTexts[comment.id] || ''}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                }
                                placeholder="Trả lời bình luận..."
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white text-xs"
                              />
                              <button
                                type="button"
                                disabled={isCommenting || !(replyTexts[comment.id] || '').trim()}
                                onClick={() => handleReplySubmit(comment.id)}
                                className="bg-pink-500 text-white px-3 py-1.5 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 text-xs font-semibold"
                              >
                                Gửi
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Comment Form - Always show */}
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

      {/* Image Viewer Modal */}
      {imageViewerOpen && post.images && post.images.length > 0 && (
        <div
          className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center"
          onClick={() => setImageViewerOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageViewerOpen(false)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold"
            >
              ×
            </button>

            {post.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex(
                      (currentImageIndex - 1 + post.images.length) % post.images.length
                    )
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-white text-3xl px-3 py-1"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((currentImageIndex + 1) % post.images.length)
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white text-3xl px-3 py-1"
                >
                  ›
                </button>
              </>
            )}

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-[90vh]">
              {post.images[currentImageIndex]?.url?.startsWith('data:') ? (
                <img
                  src={post.images[currentImageIndex].url}
                  alt={`Post image ${currentImageIndex + 1}`}
                  className="max-h-[90vh] max-w-full object-contain"
                />
              ) : (
                <Image
                  src={post.images[currentImageIndex].url}
                  alt={`Post image ${currentImageIndex + 1}`}
                  width={1000}
                  height={1000}
                  className="max-h-[90vh] max-w-full object-contain"
                  unoptimized={
                    post.images[currentImageIndex].url.startsWith('http') &&
                    !post.images[currentImageIndex].url.includes('cloudinary')
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

