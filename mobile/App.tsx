import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import React, { JSX, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, View } from 'react-native'
import { createApi, TOKEN_KEY } from './src/lib/api'
import type { TabKey, User, EventItem } from './src/types'
import { styles } from './src/styles'
import { SplashScreen } from './src/components/SplashScreen'
import { Header } from './src/components/Header'
import { LoginCard } from './src/components/LoginCard'
import { EventList, EventDetail } from './src/screens/EventsScreen'
import { MyTickets } from './src/screens/MyTicketsScreen'
import { ScanTicket } from './src/screens/ScanTicketScreen'

export default function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null)
  const api = useMemo(() => createApi(token), [token])

  const [booting, setBooting] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState<TabKey>('events')
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [user, setUser] = useState<User | null>(null)

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
        const res = await api.get<{ user?: User }>('/api/users/me')
        setUser(res.data?.user ?? null)
      } catch {
        setUser(null)
      }
    })()
  }, [api, token])

  const canScan = user?.role === 'admin'

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

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
          canScan={!!canScan}
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
          <ScanTicket api={api} canScan={!!canScan} />
        )}

        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  )
}