import * as ScreenCapture from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import type { AxiosInstance } from 'axios'
import { styles } from '../styles'
import type { EventItem } from '../types'

type EventListProps = {
  api: AxiosInstance
  onSelect: (event: EventItem) => void
}

export function EventList({ api, onSelect }: EventListProps) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ events?: EventItem[] }>('/api/events', {
        params: { upcoming: 'true' },
      })
      setEvents(res.data?.events || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={events}
      keyExtractor={(e) => e._id}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)} style={styles.eventCard}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
          ) : null}
          <View style={{ gap: 4 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.muted}>
              {item.category} · {new Date(item.date).toLocaleString()}
            </Text>
            <Text style={styles.muted}>{item.location}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={styles.eventMeta}>
              {Number(item.price) > 0 ? `₹${Number(item.price).toFixed(0)}` : 'Free'}
            </Text>
            <Text style={[styles.muted, { fontSize: 11 }]}>{item.availableTickets} left</Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.muted}>No upcoming events.</Text>}
    />
  )
}

type EventDetailProps = {
  api: AxiosInstance
  event: EventItem
  onBack: () => void
  onBooked?: (ticket: any) => void
}

export function EventDetail({ api, event, onBack, onBooked }: EventDetailProps) {
  const [booking, setBooking] = useState(false)
  const [ticket, setTicket] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [utr, setUtr] = useState('')
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const isPaidEvent = Number(event?.price ?? 0) > 0

  // Prevent screenshots while ticket QR modal is visible
  useEffect(() => {
    async function prevent() {
      try {
        await ScreenCapture.preventScreenCaptureAsync()
      } catch {
        // ignore
      }
    }
    async function allow() {
      try {
        await ScreenCapture.allowScreenCaptureAsync()
      } catch {
        // ignore
      }
    }

    if (ticket) {
      void prevent()
    } else {
      void allow()
    }

    return () => {
      void allow()
    }
  }, [ticket])

  async function book() {
    if (isPaidEvent) {
      setPayModalVisible(true)
      setError(null)
      return
    }

    setBooking(true)
    setError(null)
    try {
      const res = await api.post<{ ticket?: any }>('/api/tickets/book', { eventId: event._id })
      setTicket(res.data?.ticket ?? null)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  async function submitPayment() {
    if (!utr) return
    setPayBusy(true)
    setPayError(null)
    try {
      const res = await api.post<{ ticket?: any }>('/api/tickets/book', {
        eventId: event._id,
        utr,
      })
      setPayModalVisible(false)
      setUtr('')
      if (typeof onBooked === 'function') {
        onBooked(res.data?.ticket)
      }
    } catch (e: any) {
      setPayError(e?.response?.data?.message || e?.message || 'Payment submit failed')
    } finally {
      setPayBusy(false)
    }
  }

  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.detailImage} />
      ) : null}
      <Text style={styles.h1}>{event.title}</Text>
      <Text style={styles.muted}>
        {event.category} · {new Date(event.date).toLocaleString()}
      </Text>
      <Text style={styles.muted}>{event.location}</Text>
      <Text style={{ lineHeight: 22 }}>{event.description || 'No description.'}</Text>
      <Text style={styles.eventMeta}>
        ₹{Number(event.price).toFixed(2)} · {event.availableTickets} left
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={book}
        disabled={booking}
        style={[styles.primaryBtn, booking && styles.btnDisabled]}
      >
        <Text style={styles.primaryBtnText}>
          {booking ? 'Booking…' : isPaidEvent ? 'Pay & submit UTR' : 'Book ticket'}
        </Text>
      </Pressable>

      {/* Free event ticket modal */}
      <Modal
        visible={!!ticket}
        transparent
        animationType="slide"
        onRequestClose={() => setTicket(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.h1}>Your ticket</Text>
            <Text style={styles.muted}>Show this QR at check-in.</Text>
            {ticket?.ticketCode ? (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <QRCode value={ticket.ticketCode} size={200} />
                <Text style={styles.code}>{ticket.ticketCode}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                const current = ticket
                setTicket(null)
                if (current && typeof onBooked === 'function') {
                  onBooked(current)
                }
              }}
              style={[styles.primaryBtn, { marginTop: 16 }]}
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Paid event payment modal */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!payBusy) {
            setPayModalVisible(false)
            setUtr('')
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.h1}>Pay for this event</Text>
            <Text style={styles.muted}>
              Scan this QR to pay, then enter your Transaction / UTR number below.
            </Text>
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <QRCode value="https://res.cloudinary.com/dyzqidpfx/image/upload/v1771930613/IMG_5408.JPG_msgsap.jpg" size={200} />
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Transaction / UTR Number</Text>
            <TextInput
              value={utr}
              onChangeText={setUtr}
              autoCapitalize="none"
              style={[styles.input, { marginTop: 4 }]}
              placeholder="Enter UTR / transaction id"
            />
            {payError ? <Text style={styles.error}>{payError}</Text> : null}
            <Pressable
              onPress={submitPayment}
              disabled={!utr || payBusy}
              style={[styles.primaryBtn, (!utr || payBusy) && styles.btnDisabled]}
            >
              <Text style={styles.primaryBtnText}>{payBusy ? 'Submitting…' : 'Submit'}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!payBusy) {
                  setPayModalVisible(false)
                  setUtr('')
                }
              }}
              style={[
                styles.primaryBtn,
                { marginTop: 8, backgroundColor: '#e2e8f0' },
              ]}
              disabled={payBusy}
            >
              <Text style={[styles.primaryBtnText, { color: '#0f172a' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

