import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Bell, X, CheckCircle2, Info, AlertCircle, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (err) {
      console.error('Failed to fetch notifications')
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Polling
    return () => clearInterval(interval)
  }, [])

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      await api.patch('/notifications/read-all', {})
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark all as read')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await api.patch(`/notifications/${id}/read`, {})
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark as read')
    }
  }

  const deleteNotif = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/notifications/${id}`)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to delete notification')
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/50 hover:text-brand-cyan transition-all relative group active:scale-95"
      >
        <Bell size={18} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-midnight flex items-center justify-center text-[8px] font-black text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[150] bg-brand-midnight/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed sm:absolute top-16 sm:top-14 left-4 right-4 sm:left-auto sm:right-0 sm:w-96 z-[151] bg-[#0D1323] border border-brand-royal/20 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-5 border-b border-brand-royal/10 flex items-center justify-between bg-brand-royal/5">
                <h3 className="font-black text-xs uppercase tracking-widest text-white">Notifications</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] font-bold text-brand-cyan hover:underline uppercase tracking-tighter">
                      Mark all as read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-brand-silver/20 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-brand-royal/5 flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-brand-silver/10" />
                    </div>
                    <p className="text-brand-silver/30 font-bold text-xs">All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-royal/5">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group ${!n.isRead ? 'bg-brand-cyan/5' : ''}`}>
                        <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          n.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                          n.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-brand-cyan/10 text-brand-cyan'
                        }`}>
                          {n.type === 'SUCCESS' ? <CheckCircle2 size={14} /> :
                           n.type === 'WARNING' ? <AlertCircle size={14} /> :
                           <Info size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`text-xs font-black truncate ${!n.isRead ? 'text-white' : 'text-brand-silver/60'}`}>{n.title}</p>
                            <span className="text-[8px] font-medium text-brand-silver/20 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-silver/40 leading-relaxed mb-2">{n.message}</p>
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.isRead && (
                              <button onClick={() => markAsRead(n.id)} className="text-[9px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-1">
                                <Check size={10} /> Read
                              </button>
                            )}
                            <button onClick={() => deleteNotif(n.id)} className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                              <Trash2 size={10} /> Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-brand-royal/5 text-center">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-silver/20">Secured Notification Stream</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
