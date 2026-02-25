import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import { CameraView, useCameraPermissions } from 'expo-camera'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import axios from 'axios'

const API_URL =
  Platform.OS === 'android'
    ? 'http://192.168.1.68:4000'
    : Platform.OS === 'web'
      ? 'http://localhost:4000'
      : 'http://192.168.1.68:4000'

const TOKEN_KEY = 'eb_token'

function createApi(token) {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export default function App() {
  const [token, setToken] = useState(null)
  const api = useMemo(() => createApi(token), [token])

  const [booting, setBooting] = useState(true)
  const [tab, setTab] = useState('events') // events | tickets
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    ;(async () => {
      const t = await SecureStore.getItemAsync(TOKEN_KEY)
      setToken(t)
      setBooting(false)
    })()
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/users/me')
        setUser(res.data?.user || null)
      } catch {
        setUser(null)
      }
    })()
  }, [api, token])

  const canScan = user?.role === 'admin'

  if (booting) {
    return (
      <SafeAreaView style={styles.safe}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#0f172a" />
        <View style={styles.center}>
        <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#0f172a" />
        <View style={styles.container}>
        <LoginCard
          onLoggedIn={async (t) => {
            await SecureStore.setItemAsync(TOKEN_KEY, t)
            setToken(t)
          }}
        />
        <StatusBar style="auto" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.container}>
      <Header
        tab={tab}
        onTabChange={setTab}
        canScan={canScan}
        onLogout={async () => {
          await SecureStore.deleteItemAsync(TOKEN_KEY)
          setToken(null)
        }}
      />

      {selectedEvent ? (
        <EventDetail
          api={api}
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
          onBooked={() => {
            setSelectedEvent(null)
            setTab('tickets')
          }}
        />
      ) : tab === 'events' ? (
        <EventList api={api} onSelect={setSelectedEvent} />
      ) : tab === 'tickets' ? (
        <MyTickets api={api} />
      ) : (
        <ScanTicket api={api} canScan={canScan} />
      )}

      <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  )
}

function Header({ tab, onTabChange, onLogout, canScan }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Event Booking</Text>
      <View style={styles.headerActions}>
        <Pressable
          onPress={() => onTabChange('events')}
          style={[styles.tabBtn, tab === 'events' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'events' && styles.tabTextActive]}>Events</Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange('tickets')}
          style={[styles.tabBtn, tab === 'tickets' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'tickets' && styles.tabTextActive]}>My Tickets</Text>
        </Pressable>
        {canScan ? (
          <Pressable
            onPress={() => onTabChange('scan')}
            style={[styles.tabBtn, tab === 'scan' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'scan' && styles.tabTextActive]}>Scan</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  )
}

function LoginCard({ onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await axios.post(`${API_URL}/api/users/login`, { email, password })
      if (!res.data?.token) throw new Error('Missing token')
      onLoggedIn(res.data.token)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>Login</Text>
      <Text style={styles.muted}>Use the same backend as admin. (User accounts work too.)</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={submit} disabled={busy} style={[styles.primaryBtn, busy && styles.btnDisabled]}>
        <Text style={styles.primaryBtnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
    </View>
  )
}

function EventList({ api, onSelect }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/events', { params: { upcoming: 'true' } })
      setEvents(res.data?.events || [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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

function EventDetail({ api, event, onBack, onBooked }) {
  const [booking, setBooking] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState(null)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [utr, setUtr] = useState('')
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState(null)

  const isPaidEvent = Number(event?.price ?? 0) > 0

  async function book() {
    if (isPaidEvent) {
      setPayModalVisible(true)
      setError(null)
      return
    }

    setBooking(true)
    setError(null)
    try {
      const res = await api.post('/api/tickets/book', { eventId: event._id })
      setTicket(res.data?.ticket)
    } catch (e) {
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
      const res = await api.post('/api/tickets/book', { eventId: event._id, utr })
      setPayModalVisible(false)
      setUtr('')
      if (typeof onBooked === 'function') {
        onBooked(res.data?.ticket)
      }
    } catch (e) {
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
      <Text style={styles.muted}>{event.category} · {new Date(event.date).toLocaleString()}</Text>
      <Text style={styles.muted}>{event.location}</Text>
      <Text style={{ lineHeight: 22 }}>{event.description || 'No description.'}</Text>
      <Text style={styles.eventMeta}>₹{Number(event.price).toFixed(2)} · {event.availableTickets} left</Text>

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

function MyTickets({ api }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/api/tickets/mine')
        setTickets(res.data?.tickets || [])
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    })()
  }, [api])

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
    <>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={tickets}
        keyExtractor={(t) => t._id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedTicket(item)} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item?.eventId?.title ?? 'Event'}</Text>
            <Text style={styles.muted}>
              {new Date(item?.eventId?.date ?? item.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.muted}>Status: {item.status}</Text>
            <Text style={styles.codeSmall}>{item.ticketCode}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.muted}>No tickets yet.</Text>}
      />

      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.h1}>Your ticket</Text>
            {selectedTicket?.status === 'pending' ? (
              <Text style={[styles.muted, { marginTop: 8 }]}>
                Payment pending. QR code will be available once your booking is confirmed.
              </Text>
            ) : selectedTicket?.ticketCode ? (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <QRCode value={selectedTicket.ticketCode} size={200} />
                <Text style={styles.code}>{selectedTicket.ticketCode}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => setSelectedTicket(null)}
              style={[styles.primaryBtn, { marginTop: 16 }]}
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

function ScanTicket({ api, canScan }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!permission) {
      requestPermission()
    }
  }, [permission, requestPermission])

  function reset() {
    setScanned(false)
    setResult(null)
    setError(null)
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned || checking) return
    setScanned(true)
    setChecking(true)
    setError(null)
    try {
      const res = await api.post('/api/tickets/check-in', { ticketCode: data })
      setResult(res.data?.ticket || null)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Verification failed')
    } finally {
      setChecking(false)
    }
  }

  if (!canScan) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Scanning is only available for authorised staff.</Text>
      </View>
    )
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Camera permission is required to scan tickets.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={styles.h1}>Scan ticket</Text>
      <Text style={styles.muted}>Point the camera at the ticket QR code.</Text>

      {!result && !error ? (
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        </View>
      ) : (
        <View style={[styles.card, { flex: 1 }]}>
          {result ? (
            <>
              <Text style={[styles.h1, { marginBottom: 4 }]}>User verified</Text>
              <Text style={styles.muted}>
                Ticket code: <Text style={styles.codeSmall}>{result.ticketCode}</Text>
              </Text>
              <Text style={[styles.muted, { marginTop: 8 }]}>
                Email: {result?.userId?.email ?? '—'}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.h1, { marginBottom: 4 }]}>Not valid</Text>
              <Text style={styles.error}>{error}</Text>
            </>
          )}
        </View>
      )}

      <Pressable onPress={reset} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Scan another</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#0b1220' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1220' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white' },
  headerActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto', alignItems: 'center' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#020617' },
  tabBtnActive: { backgroundColor: '#e5e7eb' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#e5e7eb' },
  tabTextActive: { color: 'white' },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  logoutText: { fontSize: 12, fontWeight: '600', color: '#e5e7eb' },
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  h1: { fontSize: 22, fontWeight: '800', color: '#e5e7eb' },
  muted: { color: '#64748b' },
  label: { marginTop: 8, fontSize: 12, fontWeight: '700', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
    color: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  error: { color: '#b91c1c', marginTop: 6 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: 'white', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  eventCard: {
    padding: 14,
    borderRadius: 24,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  eventImage: { width: '100%', height: 150, borderRadius: 20, marginBottom: 8 },
  detailImage: { width: '100%', height: 220, borderRadius: 24, marginBottom: 12 },
  eventTitle: { fontSize: 18, fontWeight: '800', color: '#e5e7eb' },
  eventMeta: { marginTop: 4, fontSize: 13, fontWeight: '700', color: '#f97316' },
  link: { color: '#2563eb', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, padding: 18, borderRadius: 24, backgroundColor: '#020617' },
  code: {
    marginTop: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    fontSize: 12,
    color: '#e5e7eb',
  },
  codeSmall: { marginTop: 8, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }), fontSize: 11, color: '#0f172a' },
})
