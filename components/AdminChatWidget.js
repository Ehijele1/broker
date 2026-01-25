'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, Minimize2, Maximize2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToNewMessages()
    return unsubscribe
  }, [selectedUser])

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id)
      markMessagesAsRead(selectedUser.id)
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      const { data: chatUsers, error } = await supabase
        .from('chat_messages')
        .select('user_id, profiles(full_name, username, email)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const uniqueUsers = []
      const seenUserIds = new Set()
      let totalUnreadCount = 0

      for (const chat of chatUsers) {
        if (!seenUserIds.has(chat.user_id)) {
          seenUserIds.add(chat.user_id)

          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('message, created_at')
            .eq('user_id', chat.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', chat.user_id)
            .eq('sender_type', 'user')
            .eq('is_read', false)

          totalUnreadCount += count || 0

          uniqueUsers.push({
            id: chat.user_id,
            name: chat.profiles?.full_name || chat.profiles?.username || 'Unknown User',
            email: chat.profiles?.email || '',
            lastMessage: lastMsg?.message || '',
            lastMessageTime: lastMsg?.created_at || new Date(),
            unreadCount: count || 0
          })
        }
      }

      uniqueUsers.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
      setUsers(uniqueUsers)
      setTotalUnread(totalUnreadCount)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadMessages = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (userId) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('sender_type', 'user')
        .eq('is_read', false)

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, unreadCount: 0 } : u))
      )
      
      // Recalculate total unread
      const newTotal = users.reduce((sum, u) => sum + (u.id === userId ? 0 : u.unreadCount), 0)
      setTotalUnread(newTotal)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const subscribeToNewMessages = () => {
    const currentSelectedUser = selectedUser
    
    const channel = supabase
      .channel('admin_widget_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          if (currentSelectedUser && payload.new.user_id === currentSelectedUser.id) {
            setMessages(prev => [...prev, payload.new])
            
            if (payload.new.sender_type === 'user' && isOpen) {
              markMessagesAsRead(currentSelectedUser.id)
            }
          }

          loadUsers()
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
    if (!newMessage.trim() || loading || !selectedUser) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: selectedUser.id,
            message: newMessage.trim(),
            sender_type: 'admin',
            is_read: false
          }
        ])

      if (error) throw error

      setNewMessage('')
      loadUsers()
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
      setSelectedUser(null)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleBackToUsers = () => {
    setSelectedUser(null)
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
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
          <span className="absolute right-16 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            User Messages
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all ${
          isMinimized ? 'w-80 h-14' : 'w-[500px] h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedUser && !isMinimized && (
                <button
                  onClick={handleBackToUsers}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageSquare className="text-emerald-500" size={20} />
              </div>
              <div className="text-white">
                <h3 className="font-bold">
                  {selectedUser ? selectedUser.name : 'User Messages'}
                </h3>
                <p className="text-xs text-emerald-100">
                  {selectedUser ? selectedUser.email : `${users.length} conversation${users.length !== 1 ? 's' : ''}`}
                </p>
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
              {!selectedUser ? (
                /* Users List */
                <div className="h-[calc(100%-5rem)] overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="mx-auto mb-2 text-gray-400" size={48} />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                              {user.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-sm text-gray-600 truncate mt-1">{user.lastMessage}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(user.lastMessageTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Messages View */
                <>
                  <div className="h-[calc(100%-9rem)] overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <MessageSquare className="mx-auto mb-2 text-gray-400" size={48} />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              msg.sender_type === 'admin'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_type === 'admin' ? 'text-emerald-100' : 'text-gray-500'
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
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
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
            </>
          )}
        </div>
      )}
    </>
  )
}