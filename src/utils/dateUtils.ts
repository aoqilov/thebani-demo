export function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB')
}
