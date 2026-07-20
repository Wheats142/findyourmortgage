const test = require('node:test')
const assert = require('node:assert/strict')
const { createInitialAvailability, bookSlot } = require('./bookingLogic')

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
