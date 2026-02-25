import * as ScreenCapture from 'expo-screen-capture'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import type { AxiosInstance } from 'axios'
import { styles } from '../styles'
import type { TicketItem } from '../types'

type MyTicketsProps = {
  api: AxiosInstance
}

export function MyTickets({ api }: MyTicketsProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<{ tickets?: TicketItem[] }>('/api/tickets/mine')
        setTickets(res.data?.tickets || [])
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    })()
  }, [api])

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

    if (selectedTicket) {
      void prevent()
    } else {
      void allow()
    }

    return () => {
      void allow()
    }
  }, [selectedTicket])

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

