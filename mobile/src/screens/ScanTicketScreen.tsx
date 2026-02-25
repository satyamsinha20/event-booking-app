import { CameraView, useCameraPermissions } from 'expo-camera'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { AxiosInstance } from 'axios'
import { styles } from '../styles'

type ScanTicketProps = {
  api: AxiosInstance
  canScan: boolean
}

export function ScanTicket({ api, canScan }: ScanTicketProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || checking) return
    setScanned(true)
    setChecking(true)
    setError(null)
    try {
      const res = await api.post<{ ticket?: any }>('/api/tickets/check-in', {
        ticketCode: data,
      })
      setResult(res.data?.ticket || null)
    } catch (e: any) {
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

