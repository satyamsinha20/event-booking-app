import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type PendingTicket = {
  _id: string
  ticketCode: string
  status: string
  createdAt: string
  paymentRef?: string
  amount?: number
  userId: { _id: string; name?: string; email?: string }
  eventId: { _id: string; title: string; date: string; location: string }
}

export function PaymentsPage() {
  const [tickets, setTickets] = useState<PendingTicket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const res = await api.get('/api/tickets/pending')
      setTickets(res.data.tickets ?? [])
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load pending tickets')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function confirmTicket(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await api.post(`/api/tickets/${id}/confirm`)
      setTickets((prev) => prev.filter((t) => t._id !== id))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to confirm ticket')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold tracking-tight">Payment verification</div>
        <div className="mt-1 text-sm text-slate-600">
          Review pending bookings, verify payments, and mark tickets as confirmed.
        </div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">UTR / Transaction</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 text-slate-900">
                  <div className="font-medium">{t.eventId?.title ?? 'Event'}</div>
                  <div className="text-xs text-slate-500">
                    {t.eventId?.location} ·{' '}
                    {t.eventId?.date ? new Date(t.eventId.date).toLocaleString() : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{t.userId?.name ?? 'User'}</td>
                <td className="px-4 py-3 text-slate-700">{t.userId?.email ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{t.paymentRef ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">
                  {typeof t.amount === 'number' ? `₹${Number(t.amount).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void confirmTicket(t._id)}
                      disabled={busyId === t._id}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyId === t._id ? 'Confirming…' : 'Confirm'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-600" colSpan={7}>
                  No pending payments.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

