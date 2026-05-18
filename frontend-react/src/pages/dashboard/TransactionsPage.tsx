import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeft, Search, Clock, ArrowDownLeft, 
  Smartphone, Wallet, FileText, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { ReceiptModal } from '@/components/dashboard/ReceiptModal'

export function TransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING'>('ALL')
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/vtu/transactions')
      setTransactions(res.data)
    } catch {
      console.error('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = 
      (tx.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-midnight text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-brand-royal/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-brand-silver/50" />
          </button>
          <h1 className="font-black text-xs uppercase tracking-[0.3em] text-white">Transaction Logs</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver/20" size={16} />
            <input 
              type="text"
              placeholder="Search description, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-brand-royal/10 rounded-2xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-brand-cyan transition-all"
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'SUCCESS', 'FAILED', 'PENDING'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  statusFilter === status 
                    ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' 
                    : 'bg-white/5 border-brand-royal/10 text-brand-silver/30 hover:border-brand-royal/20'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-brand-royal/10 bg-white/[0.01]">
          <div className="divide-y divide-brand-royal/10">
            {filteredTxs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-royal/10 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-brand-silver/20" />
                </div>
                <p className="text-brand-silver/30 font-bold text-sm">No transactions matched your filters</p>
                <p className="text-brand-silver/20 text-xs mt-1">Try refining your query or setting filters back to ALL</p>
              </div>
            ) : (
              filteredTxs.map((tx, i) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    setSelectedTx(tx)
                    setIsReceiptOpen(true)
                  }}
                  className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                      tx.status === 'SUCCESS' ? 'bg-green-500/5 border-green-500/10 text-green-400' :
                      tx.status === 'FAILED' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                      'bg-yellow-500/5 border-yellow-500/10 text-yellow-400'
                    }`}>
                      {tx.serviceType === 'WALLET_TOPUP' ? <ArrowDownLeft size={20} /> : <Smartphone size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{tx.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-brand-silver/30 mt-1">
                        <span className="font-mono font-bold tracking-wider">{tx.reference}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      tx.serviceType === 'WALLET_TOPUP' ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.serviceType === 'WALLET_TOPUP' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      {tx.status === 'SUCCESS' && <CheckCircle size={10} className="text-green-400" />}
                      {tx.status === 'FAILED' && <XCircle size={10} className="text-red-400" />}
                      {tx.status === 'PENDING' && <AlertCircle size={10} className="text-yellow-400" />}
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        tx.status === 'SUCCESS' ? 'text-green-400' :
                        tx.status === 'FAILED' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        transaction={selectedTx} 
      />
    </div>
  )
}
