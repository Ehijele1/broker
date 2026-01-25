'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Circle } from 'lucide-react'

export default function ActiveUsers() {
  const [activeUsers, setActiveUsers] = useState([])
  const [totalOnline, setTotalOnline] = useState(0)

  useEffect(() => {
    fetchActiveUsers()

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000)

    // Subscribe to changes
    const channel = supabase
      .channel('active_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions'
        },
        () => {
          fetchActiveUsers()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchActiveUsers = async () => {
    try {
      // Mark users as offline if they haven't been seen in 5 minutes
      await supabase.rpc('mark_inactive_users')

      const { data, error } = await supabase
        .from('active_sessions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            email
          )
        `)
        .eq('is_online', true)
        .order('last_seen', { ascending: false })

      if (error) throw error

      setActiveUsers(data || [])
      setTotalOnline(data?.length || 0)
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Active Users
        </h3>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
          {totalOnline} Online
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeUsers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No active users</p>
        ) : (
          activeUsers.map((session) => (
            <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {session.profiles?.full_name?.charAt(0) || 'U'}
                </div>
                <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{session.profiles?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{session.profiles?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {new Date(session.last_seen).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}