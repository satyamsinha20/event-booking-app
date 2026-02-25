import { Video, ResizeMode } from 'expo-av'
import React, { useEffect } from 'react'
import { SafeAreaView, StatusBar as RNStatusBar, View } from 'react-native'
import { styles } from '../styles'

type SplashScreenProps = {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <Video
          source={{ uri: 'https://res.cloudinary.com/dyzqidpfx/video/upload/v1772005318/spl_dlzhbd.mp4' }}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted={false}
          isLooping={false}
        />
      </View>
    </SafeAreaView>
  )
}

