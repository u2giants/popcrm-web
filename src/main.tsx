import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChartProbe } from './dev/ChartProbe'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

// Dev-only chart probe: `npm run dev` then open /__charts to see the three
// chart primitives with fixture data and no Supabase session. Used to verify a
// charting-library upgrade in a real browser. Stripped from production builds.
const isChartProbe = import.meta.env.DEV && window.location.pathname === '/__charts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={200}>
          {isChartProbe ? <ChartProbe /> : <App />}
        </TooltipProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
