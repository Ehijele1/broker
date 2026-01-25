'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Search, User, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminChatPage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id)
      markMessagesAsRead(selectedUser.id)
    }
  }, [selectedUser])

  useEffect(() => {
    const unsubscribe = subscribeToNewMessages()
    return unsubscribe
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUsers = async () => {
    try {
      // Get all users who have sent messages
      const { data: chatUsers, error } = await supabase
        .from('chat_messages')
        .select('user_id, profiles(full_name, username, email)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get unique users with their last message time and unread count
      const uniqueUsers = []
      const seenUserIds = new Set()

      for (const chat of chatUsers) {
        if (!seenUserIds.has(chat.user_id)) {
          seenUserIds.add(chat.user_id)

          // Get last message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('message, created_at')
            .eq('user_id', chat.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', chat.user_id)
            .eq('sender_type', 'user')
            .eq('is_read', false)

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

      // Sort by last message time
      uniqueUsers.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
      setUsers(uniqueUsers)
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

      // Update unread count in users list
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, unreadCount: 0 } : u))
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const subscribeToNewMessages = () => {
    const currentSelectedUser = selectedUser
    
    const channel = supabase
      .channel('admin_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          // If message is for selected user, add to messages
          if (currentSelectedUser && payload.new.user_id === currentSelectedUser.id) {
            setMessages(prev => [...prev, payload.new])
            
            // Mark as read if it's from user
            if (payload.new.sender_type === 'user') {
              markMessagesAsRead(currentSelectedUser.id)
            }
          }

          // Reload users to update last message and unread count
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
      loadUsers() // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Users List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="text-emerald-500" size={24} />
            User Messages
          </h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="mx-auto mb-2 text-gray-400" size={48} />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                  selectedUser?.id === user.id ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                      {user.unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{user.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(user.lastMessageTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
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
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="text-white" size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a user from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}