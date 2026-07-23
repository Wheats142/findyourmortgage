import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:3001'

type AdminSlot = {
  id: string
  label: string
  status: 'available' | 'booked'
}

type AdminBooking = {
  id: string
  applicationId: string
  slotId: string
  bookedAt: string
  updatedAt?: string
}

type AdminApplication = {
  id: string
  applicant?: {
    householdIncome?: number
    employmentType?: string
  }
  mortgage?: {
    purpose?: string
  }
}

function formatDateLabel(date: string, time: string) {
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return `${formattedDate} · ${time}`
}

function AdminPortal() {
  const [slots, setSlots] = useState<AdminSlot[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:30')
  const [editingBookingId, setEditingBookingId] = useState('')
  const [editingSlotId, setEditingSlotId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const slotById = useMemo(
    () => new Map(slots.map((slot) => [slot.id, slot])),
    [slots],
  )

  const applicationById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  )

  async function loadAdminData() {
    const [availabilityResponse, bookingsResponse, applicationsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/availability`),
      fetch(`${API_BASE_URL}/bookings`),
      fetch(`${API_BASE_URL}/applications`),
    ])

    if (!availabilityResponse.ok || !bookingsResponse.ok || !applicationsResponse.ok) {
      throw new Error('Unable to load admin data')
    }

    const [availability, loadedBookings, loadedApplications] = await Promise.all([
      availabilityResponse.json() as Promise<AdminSlot[]>,
      bookingsResponse.json() as Promise<AdminBooking[]>,
      applicationsResponse.json() as Promise<AdminApplication[]>,
    ])

    setSlots(availability)
    setBookings(loadedBookings)
    setApplications(loadedApplications)
  }

  useEffect(() => {
    // The helper performs an asynchronous API fetch before updating dashboard state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdminData().catch(() => {
      setError('We could not load the admin data. Is the API server running?')
    })
  }, [])

  async function addSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: formatDateLabel(date, time) }),
      })

      if (!response.ok) {
        throw new Error('Unable to add availability')
      }

      await loadAdminData()
      setDate('')
      setTime('09:30')
      setFeedback('Availability added.')
    } catch {
      setError('We could not add that availability slot.')
    }
  }

  async function removeSlot(slotId: string) {
    setFeedback('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin/availability/${slotId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json() as { message?: string }
        throw new Error(result.message || 'Unable to remove availability')
      }

      await loadAdminData()
      setFeedback('Availability removed.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We could not remove that slot.')
    }
  }

  function startEditing(booking: AdminBooking) {
    setEditingBookingId(booking.id)
    setEditingSlotId(booking.slotId)
    setFeedback('')
    setError('')
  }

  async function saveBookingEdit(bookingId: string) {
    setFeedback('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: editingSlotId }),
      })

      if (!response.ok) {
        const result = await response.json() as { message?: string }
        throw new Error(result.message || 'Unable to update booking')
      }

      await loadAdminData()
      setEditingBookingId('')
      setEditingSlotId('')
      setFeedback('Appointment updated.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We could not update that booking.')
    }
  }

  async function deleteBooking(bookingId: string) {
    if (!window.confirm('Delete this booked appointment?')) {
      return
    }

    setFeedback('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Unable to delete booking')
      }

      await loadAdminData()
      setFeedback('Appointment deleted and its slot is available again.')
    } catch {
      setError('We could not delete that booking.')
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">1989 Mortgages</p>
          <h1>Admin portal</h1>
          <p>Manage adviser availability and booked appointments.</p>
        </div>
        <a className="secondary-action" href={import.meta.env.BASE_URL}>View customer site</a>
      </header>

      {(feedback || error) && (
        <p className={error ? 'admin-message is-error' : 'admin-message'} role="status">
          {error || feedback}
        </p>
      )}

      <section className="admin-grid">
        <section className="admin-card admin-calendar" aria-labelledby="availability-title">
          <div className="admin-card-heading">
            <div>
              <p className="eyebrow">Your calendar</p>
              <h2 id="availability-title">Advisor availability</h2>
            </div>
            <span className="admin-count">{slots.filter((slot) => slot.status === 'available').length} open</span>
          </div>

          <form className="availability-form" onSubmit={addSlot}>
            <label className="field">
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="field">
              <span>Time</span>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
            </label>
            <button className="primary-action" type="submit">Add availability</button>
          </form>

          <div className="admin-slot-list">
            {slots.length === 0 ? (
              <p className="admin-empty">No availability has been added yet.</p>
            ) : (
              slots.map((slot) => (
                <article className="admin-slot" key={slot.id}>
                  <div>
                    <strong>{slot.label}</strong>
                    <span className={slot.status === 'available' ? 'status-pill' : 'status-pill is-booked'}>
                      {slot.status === 'available' ? 'Available' : 'Booked'}
                    </span>
                  </div>
                  <button
                    className="danger-action"
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    disabled={slot.status === 'booked'}
                  >
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="admin-card" aria-labelledby="bookings-title">
          <div className="admin-card-heading">
            <div>
              <p className="eyebrow">Appointments</p>
              <h2 id="bookings-title">Booked appointments</h2>
            </div>
            <span className="admin-count">{bookings.length} booked</span>
          </div>

          <div className="admin-booking-list">
            {bookings.length === 0 ? (
              <p className="admin-empty">No appointments have been booked yet.</p>
            ) : (
              bookings.map((booking) => {
                const application = applicationById.get(booking.applicationId)
                const currentSlot = slotById.get(booking.slotId)

                return (
                  <article className="admin-booking" key={booking.id}>
                    <div className="admin-booking-details">
                      <strong>{currentSlot?.label || booking.slotId}</strong>
                      <span>Application {booking.applicationId}</span>
                      {application?.mortgage?.purpose && <span>{application.mortgage.purpose === 'buyer' ? 'Purchase' : 'Remortgage'} enquiry</span>}
                    </div>
                    {editingBookingId === booking.id ? (
                      <div className="booking-edit-controls">
                        <select value={editingSlotId} onChange={(event) => setEditingSlotId(event.target.value)}>
                          {slots.map((slot) => (
                            <option key={slot.id} value={slot.id} disabled={slot.status === 'booked' && slot.id !== booking.slotId}>
                              {slot.label}{slot.status === 'booked' && slot.id !== booking.slotId ? ' · Booked' : ''}
                            </option>
                          ))}
                        </select>
                        <button className="small-action" type="button" onClick={() => saveBookingEdit(booking.id)}>Save</button>
                        <button className="text-link" type="button" onClick={() => setEditingBookingId('')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="admin-booking-actions">
                        <button className="small-action" type="button" onClick={() => startEditing(booking)}>Edit</button>
                        <button className="danger-action" type="button" onClick={() => deleteBooking(booking.id)}>Delete</button>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default AdminPortal
