import React, { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from '../styles'
import { loginRequest } from '../lib/api'

type LoginCardProps = {
  onLoggedIn: (token: string) => void | Promise<void>
}

export function LoginCard({ onLoggedIn }: LoginCardProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const token = await loginRequest(email, password)
      await onLoggedIn(token)
    } catch (e: any) {
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
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy}
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
      >
        <Text style={styles.primaryBtnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
    </View>
  )
}

