// The Choir: Server-Sent Events broadcast to every open temple.
const clients = new Set()

export function streamHandler(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 5000\n\n')
  const client = { res }
  clients.add(client)
  broadcast('presence', { online: clients.size })
  const beat = setInterval(() => res.write(': the cascade flows\n\n'), 25000)
  req.on('close', () => {
    clearInterval(beat)
    clients.delete(client)
    broadcast('presence', { online: clients.size })
  })
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const c of clients) c.res.write(payload)
}

export function online() {
  return clients.size
}
