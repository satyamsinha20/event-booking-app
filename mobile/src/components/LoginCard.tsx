import React, { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from '../styles'
import { loginRequest, registerRequest } from '../lib/api'

type LoginCardProps = {
  onLoggedIn: (token: string) => void | Promise<void>
}

export function LoginCard({ onLoggedIn }: LoginCardProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const token =
        mode === 'login'
          ? await loginRequest(email, password)
          : await registerRequest(name, email, password)
      await onLoggedIn(token)
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (mode === 'login' ? 'Login failed' : 'Registration failed'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
      <Text style={styles.muted}>
        {mode === 'login'
          ? 'Use the same backend as admin. (User accounts work too.)'
          : 'Register a new account. New accounts start as regular users.'}
      </Text>

      {mode === 'register' ? (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={styles.input}
          />
        </>
      ) : null}

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
        <Text style={styles.primaryBtnText}>
          {busy
            ? mode === 'login'
              ? 'Signing in…'
              : 'Creating account…'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </Text>
      </Pressable>

      <View style={{ marginTop: 12, alignItems: 'center' }}>
        {mode === 'login' ? (
          <Pressable
            onPress={() => {
              setMode('register')
              setError(null)
            }}
          >
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              setMode('login')
              setError(null)
            }}
          >
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

