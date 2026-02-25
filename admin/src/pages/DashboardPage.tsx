import { useEffect, useState } from 'react'
import { fetchTicketStats } from '../lib/adminApi'

type Stats = { ticketsSold: number; revenue: number }

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchTicketStats()
        setStats(data)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load stats')
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
        <div className="mt-1 text-sm text-slate-600">Quick view of sales and activity.</div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-slate-600">Tickets sold</div>
          <div className="mt-2 text-3xl font-semibold">{stats ? stats.ticketsSold : '—'}</div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-slate-600">Revenue</div>
          <div className="mt-2 text-3xl font-semibold">
            {stats ? `₹${Number(stats.revenue).toFixed(2)}` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

