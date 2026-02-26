import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllEvents, updateEvent } from '../lib/adminApi'

type Event = {
  _id: string
  title: string
  category: string
  location: string
  date: string
  expiresAt?: string
  price: number
  availableTickets: number
  imageUrl?: string
  bookingEnabled?: boolean
}

function getEventStatus(e: Event): 'upcoming' | 'running' | 'expired' {
  const now = new Date()
  const start = new Date(e.date)
  const end = e.expiresAt ? new Date(e.expiresAt) : null

  if (end && end.getTime() < now.getTime()) {
    return 'expired'
  }
  if (!end && start.getTime() < now.getTime()) {
    return 'expired'
  }
  if (start.getTime() > now.getTime()) {
    return 'upcoming'
  }
  return 'running'
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const items = await fetchAllEvents()
      setEvents(items)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load events')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Events</div>
          <div className="mt-1 text-sm text-slate-600">Create, edit, and manage attendees.</div>
        </div>
        <Link
          to="/events/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New event
        </Link>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((e) => {
              const bookingOn = e.bookingEnabled !== false
              return (
                <tr key={e._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-900">{e.title}</td>
                  <td className="px-4 py-3 text-slate-700">{e.category}</td>
                  <td className="px-4 py-3 text-slate-700">{new Date(e.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">
                  {(() => {
                    const status = getEventStatus(e)
                    const base =
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
                    if (status === 'expired') {
                      return (
                        <span className={`${base} bg-red-50 text-red-700 border border-red-100`}>
                          Expired
                        </span>
                      )
                    }
                    if (status === 'running') {
                      return (
                        <span
                          className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}
                        >
                          Running
                        </span>
                      )
                    }
                    return (
                      <span
                        className={`${base} bg-blue-50 text-blue-700 border border-blue-100`}
                      >
                        Upcoming
                      </span>
                    )
                  })()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.location}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {Number(e.price) > 0 ? `₹${Number(e.price).toFixed(2)}` : 'Free'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.availableTickets}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <button
                      type="button"
                      disabled={updatingId === e._id}
                      onClick={async () => {
                        try {
                          setUpdatingId(e._id)
                          await updateEvent(e._id, { bookingEnabled: !bookingOn })
                          await load()
                        } catch (err: any) {
                          setError(err?.response?.data?.message ?? 'Failed to update booking status')
                        } finally {
                          setUpdatingId(null)
                        }
                      }}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        bookingOn
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      } ${updatingId === e._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {bookingOn ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/events/${e._id}/attendees`}
                        className="rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Attendees
                      </Link>
                      <Link
                        to={`/events/${e._id}/edit`}
                        className="rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {events.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-600" colSpan={7}>
                  No events found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Tip: if you don’t see events, create one or remove the “upcoming” filter in the API call.
      </div>
    </div>
  )
}

