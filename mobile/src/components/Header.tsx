import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { styles } from '../styles'
import type { TabKey } from '../types'

type HeaderProps = {
  tab: TabKey
  onTabChange: (tab: TabKey) => void
  onLogout: () => void
  canScan: boolean
}

export function Header({ tab, onTabChange, onLogout, canScan }: HeaderProps) {
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

