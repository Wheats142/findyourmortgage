import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createInitialAvailability,
  bookSlot,
  resetAvailability,
  addAvailability,
  removeAvailability,
  removeBooking,
  editBooking,
} from './bookingLogic.js'

test('creates availability with all slots open', () => {
  const availability = createInitialAvailability([
    { id: 'slot-1', label: 'Today 15:00' },
    { id: 'slot-2', label: 'Tomorrow 10:00' },
  ])

  assert.equal(availability.length, 2)
  assert.equal(availability[0].status, 'available')
  assert.equal(availability[1].status, 'available')
})

test('books an available slot and refuses a second booking', () => {
  const availability = createInitialAvailability([
    { id: 'slot-1', label: 'Today 15:00' },
  ])

  const firstResult = bookSlot(availability, 'slot-1')
  const secondResult = bookSlot(availability, 'slot-1')

  assert.equal(firstResult.success, true)
  assert.equal(secondResult.success, false)
  assert.equal(availability[0].status, 'booked')
})

test('resets availability and removes a booking by id', () => {
  const availability = createInitialAvailability([
    { id: 'slot-1', label: 'Today 15:00' },
    { id: 'slot-2', label: 'Tomorrow 10:00' },
  ])
  const bookings = [{ id: 'booking-1', applicationId: 'app-1', slotId: 'slot-1', bookedAt: 'now' }]

  const resetResult = resetAvailability(availability)
  const removeResult = removeBooking(bookings, 'booking-1', availability)

  assert.equal(resetResult.success, true)
  assert.equal(availability.every((slot) => slot.status === 'available'), true)
  assert.equal(removeResult.success, true)
  assert.equal(bookings.length, 0)
})

test('adds and removes an available slot', () => {
  const availability = createInitialAvailability([])
  const addResult = addAvailability(availability, 'Friday 10:00')

  assert.equal(addResult.success, true)
  assert.equal(availability[0].label, 'Friday 10:00')

  const removeResult = removeAvailability(availability, availability[0].id)
  assert.equal(removeResult.success, true)
  assert.equal(availability.length, 0)
})

test('moves a booking to another available slot', () => {
  const availability = createInitialAvailability([
    { id: 'slot-1', label: 'Today 15:00' },
    { id: 'slot-2', label: 'Tomorrow 10:00' },
  ])
  const bookings = [{ id: 'booking-1', applicationId: 'app-1', slotId: 'slot-1', bookedAt: 'now' }]

  bookSlot(availability, 'slot-1')
  const result = editBooking(bookings, 'booking-1', 'slot-2', availability)

  assert.equal(result.success, true)
  assert.equal(bookings[0].slotId, 'slot-2')
  assert.equal(availability[0].status, 'available')
  assert.equal(availability[1].status, 'booked')
})
