import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'

type AttendeeRow = {
  ticketId: string
  ticketCode: string
  status: 'booked' | 'checked_in' | 'cancelled'
  createdAt: string
  user: { _id: string; name: string; email: string }
}

export function AttendeesPage() {
  const { id } = useParams()
  const [eventTitle, setEventTitle] = useState<string>('')
  const [totalTickets, setTotalTickets] = useState<number>(0)
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const res = await api.get(`/api/tickets/event/${id}/attendees`)
      setEventTitle(res.data.event?.title ?? '')
      setTotalTickets(res.data.totalTickets ?? 0)
      setAttendees(res.data.attendees ?? [])
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load attendees')
    }
  }

  useEffect(() => {
    if (!id) return
    void load()
  }, [id])

  const csv = useMemo(() => {
    const header = ['name', 'email', 'ticketCode', 'status', 'createdAt']
    const rows = attendees.map((a) => [
      a.user?.name ?? '',
      a.user?.email ?? '',
      a.ticketCode,
      a.status,
      a.createdAt,
    ])
    const esc = (s: string) => `"${String(s).replaceAll('"', '""')}"`
    return [header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  }, [attendees])

  function downloadCsv() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(eventTitle || 'attendees').replaceAll(' ', '_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Attendees</div>
          <div className="mt-1 text-sm text-slate-600">
            {eventTitle ? (
              <>
                Event: <span className="font-medium text-slate-900">{eventTitle}</span> · Tickets: {totalTickets}
              </>
            ) : (
              'Loading event…'
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsv}
            className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <Link className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/events">
            Back
          </Link>
        </div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ticket code</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Booked</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {attendees.map((a) => (
              <tr key={a.ticketId} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium text-slate-900">{a.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{a.user?.email ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.ticketCode}</td>
                <td className="px-4 py-3 text-slate-700">{a.status}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {attendees.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-600" colSpan={5}>
                  No attendees yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

