import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, Users, MessageSquare, Info, Calculator, Trash2 } from 'lucide-react'

export function BulkSmsPage() {
  const [senderId, setSenderId] = useState('')
  const [recipients, setRecipients] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Calculations
  const recipientList = recipients.split(/[\n,]+/).map(r => r.trim()).filter(r => r.length >= 11)
  const charCount = message.length
  const unitsPerMsg = Math.ceil(charCount / 160) || 1
  const totalUnits = recipientList.length * unitsPerMsg
  const totalCost = totalUnits * 4.5 // Assume 4.5 NGN per unit

  const handleSend = async () => {
    if (!senderId || senderId.length > 11) return toast.error('Sender ID must be 1-11 characters')
    if (recipientList.length === 0) return toast.error('Add at least one valid phone number')
    if (!message) return toast.error('Message cannot be empty')

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/vtu/sms/send', {
        sender: senderId,
        recipients: recipientList,
        message: message
      }, { headers: { Authorization: `Bearer ${token}` } })
      
      toast.success(`Successfully sent SMS to ${recipientList.length} recipients!`)
      setSenderId('')
      setRecipients('')
      setMessage('')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to send SMS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h1 className="text-4xl font-black font-display tracking-tight text-white">Bulk <span className="text-brand-cyan">SMS</span></h1>
        <p className="text-brand-silver/40 text-sm mt-1">Send customized messages to thousands of numbers at once.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-brand-royal/10 bg-white/[0.02]">
            <div className="space-y-6">
              {/* Sender ID */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40">Sender ID (Max 11 Chars)</label>
                <Input 
                  placeholder="e.g. AGD-DATA" 
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value.slice(0, 11))}
                  className="bg-brand-midnight/50"
                />
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40">Recipients (Paste numbers separated by comma or newline)</label>
                  <span className="text-[10px] font-bold text-brand-cyan">{recipientList.length} Valid Numbers</span>
                </div>
                <textarea 
                  placeholder="08012345678, 09012345678..."
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full h-40 bg-brand-midnight/50 border border-brand-royal/10 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-brand-cyan transition-all resize-none"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40">Message Content</label>
                  <span className="text-[10px] font-bold text-brand-silver/40">{charCount} Chars | {unitsPerMsg} Unit(s)</span>
                </div>
                <textarea 
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-brand-midnight/50 border border-brand-royal/10 rounded-2xl p-4 text-xs focus:outline-none focus:border-brand-cyan transition-all resize-none"
                />
              </div>

              <Button onClick={handleSend} disabled={loading} className="w-full h-14 text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                {loading ? 'Processing Broadcast...' : 'Launch Broadcast'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-brand-cyan/10 to-transparent border-brand-cyan/20">
            <div className="flex items-center gap-3 mb-6">
              <Calculator size={20} className="text-brand-cyan" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Cost Summary</h3>
            </div>
            
            <div className="space-y-4">
              <SummaryItem label="Total Numbers" value={recipientList.length.toString()} />
              <SummaryItem label="Units per Number" value={unitsPerMsg.toString()} />
              <SummaryItem label="Total Units" value={totalUnits.toString()} />
              <div className="pt-4 border-t border-brand-cyan/10 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40">Total Cost</span>
                <span className="text-2xl font-black text-brand-cyan">₦{totalCost.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-brand-royal/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 text-brand-silver/30 mb-4">
              <Info size={16} />
              <p className="text-[10px] uppercase tracking-widest font-black">Helpful Tips</p>
            </div>
            <ul className="space-y-3">
              <Tip text="Use 11-digit numbers (080...)" />
              <Tip text="Avoid special characters to save units" />
              <Tip text="Sender ID must not exceed 11 chars" />
            </ul>
          </Card>

          <Button 
            variant="outline" 
            onClick={() => { setSenderId(''); setRecipients(''); setMessage(''); }}
            className="w-full border-red-500/10 text-red-400 hover:bg-red-500/10 gap-2 uppercase tracking-widest text-[10px] font-black"
          >
            <Trash2 size={14} />
            Clear Draft
          </Button>
        </div>
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[10px] font-bold text-brand-silver/40 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-white">{value}</span>
    </div>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan mt-1" />
      <span className="text-[10px] font-medium text-brand-silver/50 leading-relaxed">{text}</span>
    </li>
  )
}
