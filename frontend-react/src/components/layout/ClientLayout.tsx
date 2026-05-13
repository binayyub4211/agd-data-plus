import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { BrandedLoader } from './BrandedLoader'
import { BottomNav } from './BottomNav'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsNavigating(true)
    const t = setTimeout(() => setIsNavigating(false), 600)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <>
      <BrandedLoader isLoading={isNavigating} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0A0F1E',
            color: '#E0E0E0',
            border: '1px solid rgba(26,79,219,0.3)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#00D4FF', secondary: '#0A0F1E' },
          },
          error: {
            iconTheme: { primary: '#F5A623', secondary: '#0A0F1E' },
          },
        }}
      />
      {children}
      <BottomNav />
    </>
  )
}
