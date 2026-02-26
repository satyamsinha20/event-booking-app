import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createEvent,
  deleteEvent,
  fetchEventById,
  updateEvent,
  type EventPayload,
} from '../lib/adminApi'

type EventDto = {
  _id: string
  title: string
  category: string
  description: string
  location: string
  date: string
  expiresAt?: string
  price: number
  availableTickets: number
  imageUrl?: string
  bookingEnabled?: boolean
}

function isoToLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export function EventFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dateLocal, setDateLocal] = useState('')
  const [expiresLocal, setExpiresLocal] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [pricingType, setPricingType] = useState<'free' | 'paid'>('free')
  const [availableTickets, setAvailableTickets] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [bookingEnabled, setBookingEnabled] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode === 'edit'
  const pageTitle = useMemo(() => (isEdit ? 'Edit event' : 'New event'), [isEdit])

  useEffect(() => {
    if (!isEdit || !id) return
      ; (async () => {
        try {
          const e: EventDto = await fetchEventById(id)
          setTitle(e.title)
          setCategory(e.category ?? 'general')
          setDescription(e.description ?? '')
          setLocation(e.location)
          setDateLocal(isoToLocalInput(e.date))
          setExpiresLocal(e.expiresAt ? isoToLocalInput(e.expiresAt) : '')
          const priceNumber = Number(e.price) || 0
          setPrice(priceNumber)
          setPricingType(priceNumber > 0 ? 'paid' : 'free')
          setAvailableTickets(Number(e.availableTickets))
          setImageUrl(e.imageUrl ?? '')
          setBookingEnabled(e.bookingEnabled !== false)
        } catch (err: any) {
          setError(err?.response?.data?.message ?? 'Failed to load event')
        }
      })()
  }, [isEdit, id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const finalPrice = pricingType === 'free' ? 0 : Number(price)
      const payload: EventPayload = {
        title,
        category,
        description,
        location,
        date: new Date(dateLocal).toISOString(),
        expiresAt: expiresLocal ? new Date(expiresLocal).toISOString() : undefined,
        imageUrl: imageUrl || undefined,
        price: finalPrice,
        availableTickets: Number(availableTickets),
        bookingEnabled,
      }

      if (isEdit && id) {
        await updateEvent(id, payload)
      } else {
        const res = await createEvent(payload)
        console.log("Created event:", res)
      }
      navigate('/events')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }

  }

  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) {
      alert('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)

    setUploading(true)
    setError(null)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { secure_url?: string }
      if (!data.secure_url) throw new Error('Upload failed')
      setImageUrl(data.secure_url)
    } catch (err: any) {
      setError(err?.message ?? 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onDelete() {
    if (!id) return
    if (!confirm('Delete this event?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteEvent(id)
      navigate('/events')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{pageTitle}</div>
          <div className="mt-1 text-sm text-slate-600">Fill in the details and save.</div>
        </div>
        <Link className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/events">
          Back
        </Link>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <label className="block">
          <div className="text-sm font-medium text-slate-700">Title</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={bookingEnabled}
            onChange={(e) => setBookingEnabled(e.target.checked)}
          />
          <span className="text-sm font-medium text-slate-700">Allow ticket booking for this event</span>
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Category</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Location</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Date & time</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={dateLocal}
            onChange={(e) => setDateLocal(e.target.value)}
            type="datetime-local"
            required
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Event expires at (optional)</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={expiresLocal}
            onChange={(e) => setExpiresLocal(e.target.value)}
            type="datetime-local"
          />
          <p className="mt-1 text-xs text-slate-500">
            After this time, tickets for this event will automatically expire and be removed.
          </p>
        </label>

        <fieldset className="block">
          <div className="text-sm font-medium text-slate-700">Event type</div>
          <div className="mt-2 flex gap-4 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="pricingType"
                value="free"
                checked={pricingType === 'free'}
                onChange={() => setPricingType('free')}
              />
              <span>Free</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="pricingType"
                value="paid"
                checked={pricingType === 'paid'}
                onChange={() => setPricingType('paid')}
              />
              <span>Paid</span>
            </label>
          </div>
        </fieldset>

        {pricingType === 'paid' ? (
          <label className="block">
            <div className="text-sm font-medium text-slate-700">Price</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              type="number"
              min={0}
              step="0.01"
              required={pricingType === 'paid'}
            />
          </label>
        ) : (
          <div className="block">
            <div className="text-sm font-medium text-slate-700">Price</div>
            <div className="mt-1 text-sm text-slate-500">Free event (₹0)</div>
          </div>
        )}

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Available tickets</div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={availableTickets}
            onChange={(e) => setAvailableTickets(Number(e.target.value))}
            type="number"
            min={0}
            step="1"
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <div className="text-sm font-medium text-slate-700">Description</div>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
          />
        </label>

        <div className="space-y-2 sm:col-span-2">
          <div className="text-sm font-medium text-slate-700">Poster / image</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="text-sm"
            />
            {uploading ? (
              <span className="text-xs text-slate-500">Uploading…</span>
            ) : null}
          </div>
          {imageUrl ? (
            <div className="mt-2 overflow-hidden rounded-xl border bg-slate-50 p-2 sm:max-w-xs">
              <img src={imageUrl} alt="Event poster" className="h-32 w-full rounded-lg object-cover" />
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Optional. A good poster makes the event feel more premium.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={busy}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              Delete
            </button>
          ) : (
            <div />
          )}

          <button
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            type="submit"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

