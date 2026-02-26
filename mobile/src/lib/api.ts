import axios, { AxiosInstance } from 'axios'
import { Platform } from 'react-native'

export const API_URL =
  Platform.OS === 'android'
    ? 'http://192.168.1.68:4000'
    : Platform.OS === 'web'
      ? 'http://localhost:4000'
      : 'http://192.168.1.68:4000'

export const TOKEN_KEY = 'eb_token'

export function createApi(token: string | null): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function loginRequest(email: string, password: string): Promise<string> {
  const res = await axios.post<{ token?: string }>(`${API_URL}/api/users/login`, {
    email,
    password,
  })
  if (!res.data?.token) {
    throw new Error('Missing token')
  }
  return res.data.token
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await axios.post<{ token?: string }>(`${API_URL}/api/users/register`, {
    name,
    email,
    password,
  })
  if (!res.data?.token) {
    throw new Error('Missing token')
  }
  return res.data.token
}

