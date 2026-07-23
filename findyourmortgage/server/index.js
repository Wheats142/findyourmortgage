import express from 'express'
import cors from 'cors'
import { createInitialAvailability, bookSlot, resetAvailability, removeBooking } from './bookingLogic.js'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const availability = createInitialAvailability([
  { id: 'slot-1', label: 'Today 15:00' },
  { id: 'slot-2', label: 'Today 16:30' },
  { id: 'slot-3', label: 'Tomorrow 09:30' },
  { id: 'slot-4', label: 'Tomorrow 12:00' },
])

const applications = []
const bookings = []

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/availability', (_req, res) => {
  res.json(availability)
})

app.get('/applications', (_req, res) => {
  res.json(applications)
})

app.get('/bookings', (_req, res) => {
  res.json(bookings)
})

app.post('/applications', (req, res) => {
  const application = {
    id: `app-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  }

  applications.push(application)

  res.status(201).json(application)
})

app.post('/bookings', (req, res) => {
  const { slotId, applicationId } = req.body
  const result = bookSlot(availability, slotId)

  if (!result.success) {
    return res.status(409).json(result)
  }

  const booking = {
    id: `booking-${Date.now()}`,
    applicationId,
    slotId,
    bookedAt: new Date().toISOString(),
  }

  bookings.push(booking)

  res.status(201).json({ booking, availability })
})

app.post('/admin/reset-availability', (_req, res) => {
  const result = resetAvailability(availability)
  res.json(result)
})

app.delete('/admin/bookings/:bookingId', (req, res) => {
  const result = removeBooking(bookings, req.params.bookingId)

  if (!result.success) {
    return res.status(404).json(result)
  }

  res.json(result)
})

app.listen(port, () => {
  console.log(`Booking API listening on http://localhost:${port}`)
})
