export function createInitialAvailability(slots) {
  return slots.map((slot) => ({
    id: slot.id,
    label: slot.label,
    status: 'available',
  }))
}

export function bookSlot(availability, slotId) {
  const slot = availability.find((item) => item.id === slotId)

  if (!slot) {
    return { success: false, message: 'Slot not found.' }
  }

  if (slot.status === 'booked') {
    return { success: false, message: 'Slot already booked.' }
  }

  slot.status = 'booked'
  return { success: true, slot }
}

export function addAvailability(availability, label) {
  const trimmedLabel = label?.trim()

  if (!trimmedLabel) {
    return { success: false, message: 'A slot label is required.' }
  }

  const slot = {
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: trimmedLabel,
    status: 'available',
  }

  availability.push(slot)
  return { success: true, slot }
}

export function removeAvailability(availability, slotId) {
  const index = availability.findIndex((slot) => slot.id === slotId)

  if (index === -1) {
    return { success: false, message: 'Slot not found.' }
  }

  if (availability[index].status === 'booked') {
    return { success: false, message: 'Booked slots cannot be removed.' }
  }

  availability.splice(index, 1)
  return { success: true, availability }
}

export function resetAvailability(availability) {
  availability.forEach((slot) => {
    slot.status = 'available'
  })

  return { success: true, availability }
}

export function removeBooking(bookings, bookingId, availability) {
  const index = bookings.findIndex((booking) => booking.id === bookingId)

  if (index === -1) {
    return { success: false, message: 'Booking not found.' }
  }

  const [booking] = bookings.splice(index, 1)
  const slot = availability?.find((item) => item.id === booking.slotId)

  if (slot) {
    slot.status = 'available'
  }

  return { success: true, bookings }
}

export function editBooking(bookings, bookingId, newSlotId, availability) {
  const booking = bookings.find((item) => item.id === bookingId)
  const newSlot = availability.find((slot) => slot.id === newSlotId)

  if (!booking) {
    return { success: false, message: 'Booking not found.' }
  }

  if (!newSlot) {
    return { success: false, message: 'New slot not found.' }
  }

  if (booking.slotId !== newSlotId && newSlot.status === 'booked') {
    return { success: false, message: 'New slot is already booked.' }
  }

  const oldSlot = availability.find((slot) => slot.id === booking.slotId)

  if (oldSlot && oldSlot.id !== newSlot.id) {
    oldSlot.status = 'available'
  }

  newSlot.status = 'booked'
  booking.slotId = newSlotId
  booking.updatedAt = new Date().toISOString()

  return { success: true, booking, availability }
}
