import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, ShieldCheck, CheckCircle2, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: any
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  
  if (!transaction) return null

  const handleDownload = async () => {
    if (!receiptRef.current) return
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`AGD-Receipt-${transaction.reference}.pdf`)
    } catch (err) {
      console.error('PDF Generation failed', err)
      window.print()
    }
  }

  const handleShare = async () => {
    const shareText = `AGD Receipt: I just completed a ${transaction.serviceType} purchase of ₦${transaction.amount} on AGD Data Plus! Reference: ${transaction.reference}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AGD Transaction Receipt',
          text: shareText,
          url: window.location.origin
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Direct Social Fallback (Works on HTTP)
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, '_blank')
      
      // Also copy to clipboard for extra utility
      navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-midnight/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[360px] md:max-w-sm max-h-[90vh] flex flex-col"
          >
            {/* Success Icon */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-brand-cyan z-[120]">
              <CheckCircle2 size={48} className="drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
            </div>

            <div className="overflow-y-auto custom-scrollbar rounded-[2.5rem] flex-1">
              <div ref={receiptRef} className="bg-white overflow-hidden relative min-h-full flex flex-col">
                {/* Holographic Top Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-brand-royal via-brand-cyan to-brand-gold opacity-80" />
                
                {/* Paper cut side notches */}
                <div className="absolute top-[48%] -left-4 w-8 h-8 bg-brand-midnight rounded-full shadow-inner" />
                <div className="absolute top-[48%] -right-4 w-8 h-8 bg-brand-midnight rounded-full shadow-inner" />
                
                <div className="p-6 md:p-10 pt-10 md:pt-12 space-y-6 md:space-y-8 flex-1">
                  {/* Elite Header */}
                  <div className="text-center relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                      <ShieldCheck className="text-brand-midnight" size={20} />
                    </div>
                    <h3 className="text-[8px] font-black text-brand-silver/60 uppercase tracking-[0.5em] mb-2">Official Statement</h3>
                    <h2 className="text-2xl md:text-3xl font-black text-brand-midnight tracking-tight">Success</h2>
                    <div className="w-10 h-1 bg-brand-cyan mx-auto mt-3 rounded-full" />
                  </div>

                  {/* Amount Area with Glow */}
                  <div className="py-6 md:py-10 bg-gradient-to-b from-gray-50 to-white rounded-[2rem] text-center border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Settlement Amount</p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-gray-400 mt-1">₦</span>
                      <h2 className="text-4xl md:text-5xl font-black text-brand-midnight tracking-tighter">
                        {transaction.amount?.toLocaleString()}
                      </h2>
                    </div>
                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-[0.2em] mt-3 bg-green-50 px-3 py-1.5 rounded-full inline-block">Authorized</p>
                  </div>

                  {/* Detailed Table */}
                  <div className="space-y-4 md:space-y-5 px-1 md:px-2">
                    <EliteRow label="Product Type" value={transaction.serviceType} />
                    <EliteRow label="Recipient" value={transaction.description?.split('for ')[1] || '---'} />
                    <EliteRow label="Tx Reference" value={transaction.reference} isMono />
                    <EliteRow label="Timestamp" value={new Date(transaction.createdAt || Date.now()).toLocaleString()} />
                    <EliteRow label="Gateway" value={transaction.provider || 'AGD Core'} />
                  </div>

                  {/* Digital Signature */}
                  <div className="pt-6 border-t border-dashed border-gray-200 flex flex-col items-center">
                    <div className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Digital Seal</div>
                    <div className="font-serif italic text-xl text-brand-midnight/20 select-none">AGD Data Plus</div>
                    <p className="text-[6px] text-gray-300 mt-2 font-mono uppercase tracking-tighter">Verified Stream: {transaction.reference?.slice(0, 8)}</p>
                  </div>
                </div>

                {/* Advanced Jagged Bottom */}
                <div className="flex justify-between w-full px-0.5 mb-[-4px] mt-auto">
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-brand-midnight rotate-45 translate-y-2 border border-white/5" />
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 md:mt-8 flex gap-3 print:hidden shrink-0">
              <Button 
                onClick={handleDownload}
                className="flex-1 h-14 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight font-black rounded-2xl gap-2 shadow-[0_10px_25px_rgba(0,212,255,0.2)] transition-all active:scale-95 text-xs"
              >
                <Download size={18} />
                Download PDF
              </Button>
              <Button 
                onClick={handleShare}
                variant="outline"
                className="w-14 h-14 p-0 border-white/10 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <Share2 size={20} />
              </Button>
            </div>

            <button 
              onClick={onClose}
              className="mt-6 w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver/20 hover:text-brand-cyan transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function EliteRow({ label, value, isMono }: { label: string, value: string, isMono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <span className={`text-[11px] font-black text-right ${isMono ? 'font-mono text-brand-midnight/60' : 'text-brand-midnight'}`}>
        {value}
      </span>
    </div>
  )
}
