'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (userId) {
      loadMessages()
      subscribeToMessages()
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Count unread messages from admin
      const unread = data?.filter(msg => msg.sender_type === 'admin' && !msg.is_read).length || 0
      setUnreadCount(unread)

      // Mark messages as read when chat is open
      if (isOpen) {
        markMessagesAsRead()
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('sender_type', 'admin')
        .eq('is_read', false)

      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new])
            
            // Increment unread count if message is from admin and chat is closed
            if (payload.new.sender_type === 'admin' && !isOpen) {
              setUnreadCount(prev => prev + 1)
            } else if (isOpen) {
              // Mark as read immediately if chat is open
              supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', payload.new.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: userId,
            message: newMessage.trim(),
            sender_type: 'user',
            is_read: false
          }
        ])

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
      markMessagesAsRead()
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        >
          <MessageSquare className="text-white" size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="absolute right-16 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with Support
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all ${
          isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageSquare className="text-emerald-500" size={20} />
              </div>
              <div className="text-white">
                <h3 className="font-bold">Support Chat</h3>
                <p className="text-xs text-emerald-100">We typically reply in minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[calc(100%-8rem)] overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="mx-auto mb-2 text-gray-400" size={48} />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender_type === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender_type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="text-white" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}