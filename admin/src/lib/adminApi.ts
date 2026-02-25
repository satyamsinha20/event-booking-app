import { api } from './api'

// Auth
export async function fetchCurrentUser() {
  const res = await api.get('/api/users/me')
  return res.data.user ?? null
}

export async function loginUser(email: string, password: string) {
  const res = await api.post('/api/users/login', { email, password })
  return res.data.user
}

export async function logoutUser() {
  await api.post('/api/users/logout')
}

// Dashboard / stats
export async function fetchTicketStats() {
  const res = await api.get('/api/tickets/stats')
  return res.data
}

// Events
export async function fetchUpcomingEvents() {
  const res = await api.get('/api/events', { params: { upcoming: '1' } })
  return res.data.events ?? []
}

export async function fetchEventById(id: string) {
  const res = await api.get('/api/events/' + id)
  return res.data.event
}

export type EventPayload = {
  title: string
  category: string
  description: string
  location: string
  date: string
  expiresAt?: string
  imageUrl?: string
  price: number
  availableTickets: number
}

export async function createEvent(payload: EventPayload) {
  const res = await api.post('/api/events', payload)
  return res.data.event
}

export async function updateEvent(id: string, payload: EventPayload) {
  const res = await api.put('/api/events/' + id, payload)
  return res.data.event
}

export async function deleteEvent(id: string) {
  await api.delete('/api/events/' + id)
}

// Tickets / attendees
export async function fetchEventAttendees(eventId: string) {
  const res = await api.get(`/api/tickets/event/${eventId}/attendees`)
  return res.data
}

export async function fetchPendingTickets() {
  const res = await api.get('/api/tickets/pending')
  return res.data.tickets ?? []
}

export async function confirmPendingTicket(id: string) {
  await api.post(`/api/tickets/${id}/confirm`)
}

