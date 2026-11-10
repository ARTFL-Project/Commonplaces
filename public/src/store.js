import { reactive } from 'vue'

export const webConfig = {}

export const state = reactive({
  formData: { duplicates: 'ignore', sorting: -1 },
  formOpen: true,
})

export function toQuery(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value ?? '')}`)
    .join('&')
}

export async function getJSON(path, params) {
  const response = await fetch(params ? `${path}?${toQuery(params)}` : path)
  if (!response.ok) throw new Error(`${response.status} ${path}`)
  return response.json()
}
