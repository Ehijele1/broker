"use client";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  ImagePlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Count unread messages from admin
      const unread =
        data?.filter((msg) => msg.sender_type === "admin" && !msg.is_read)
          .length || 0;
      setUnreadCount(unread);

      // Mark messages as read when chat is open
      if (isOpen) {
        markMessagesAsRead();
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("sender_type", "admin")
        .eq("is_read", false);

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new]);

            // Increment unread count if message is from admin and chat is closed
            if (payload.new.sender_type === "admin" && !isOpen) {
              setUnreadCount((prev) => prev + 1);
            } else if (isOpen) {
              // Mark as read immediately if chat is open
              supabase
                .from("chat_messages")
                .update({ is_read: true })
                .eq("id", payload.new.id);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Please select a JPG, PNG, WEBP or GIF image");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || loading) return;

    setLoading(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("chat_messages").insert([
        {
          user_id: userId,
          message: newMessage.trim(),
          image_url: imageUrl,
          sender_type: "user",
          is_read: false,
        },
      ]);

      if (error) throw error;

      setNewMessage("");
      clearImage();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      markMessagesAsRead();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

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
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="absolute right-16 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with Support
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all ${isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
            }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageSquare className="text-emerald-500" size={20} />
              </div>
              <div className="text-white">
                <h3 className="font-bold">Support Chat</h3>
                <p className="text-xs text-emerald-100">
                  We typically reply in minutes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 size={18} />
                ) : (
                  <Minimize2 size={18} />
                )}
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
              <div
                className={`${imagePreview ? "h-[calc(100%-13.5rem)]" : "h-[calc(100%-8rem)]"
                  } overflow-y-auto p-4 space-y-4 bg-gray-50`}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare
                      className="mx-auto mb-2 text-gray-400"
                      size={48}
                    />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.sender_type === "user"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                          }`}
                      >
                        {msg.image_url && (
                          <a
                            href={msg.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={msg.image_url}
                              alt="Shared image"
                              className="rounded-lg mb-1 max-h-60 w-full object-cover"
                            />
                          </a>
                        )}
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        )}
                        <p
                          className={`text-xs mt-1 ${msg.sender_type === "user"
                            ? "text-emerald-100"
                            : "text-gray-500"
                            }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-200 rounded-b-2xl"
              >
                {imagePreview && (
                  <div className="mb-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-10 h-10 flex-shrink-0 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ImagePlus size={18} />
                  </button>
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500 resize-none max-h-28 overflow-y-auto"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || (!newMessage.trim() && !imageFile)}
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
  );
}