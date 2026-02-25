export type TabKey = 'events' | 'tickets' | 'scan'

export type User = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export type EventItem = {
  _id: string
  title: string
  category: string
  location: string
  date: string
  price: number
  availableTickets: number
  imageUrl?: string
  description?: string
}

export type TicketItem = {
  _id: string
  ticketCode: string
  status: string
  createdAt: string
  eventId?: {
    _id: string
    title: string
    date: string
  }
}

