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
