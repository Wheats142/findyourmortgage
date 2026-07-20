import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type LoanPurpose = 'buyer' | 'remortgage'
type BuyerType = 'first-time-buyer' | 'home-mover' | 'additional-property'
type EmploymentType = 'employed' | 'self-employed'
type View = 'intro' | 'questionnaire' | 'availability'

type MortgageApplication = {
  id: string
  createdAt: string
  consent: {
    dataStorageAccepted: boolean
    acceptedAt: string
    version: string
  }
  mortgage: {
    purpose: LoanPurpose
    buyerType?: BuyerType
    propertyValue?: number
    deposit?: number
    borrowingNeed?: number
    houseWorth?: number
    mortgageBalance?: number
    estimatedEquity?: number
  }
  applicant: {
    householdIncome: number
    employmentType: EmploymentType
    dateOfBirth: string
  }
  advisor: {
    wantsToSpeak: true
    selectedSlot?: string
  }
}

const SESSION_STORAGE_KEY = '1989-mortgages-application'
const CONSENT_VERSION = 'data-storage-consent-v1'
const API_BASE_URL = 'http://localhost:3001'

type AvailabilitySlot = {
  id: string
  label: string
  status: 'available' | 'booked'
}

function createApplicationId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `application-${Date.now()}`
}

function saveApplicationToSession(application: MortgageApplication) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(application))
}

function App() {
  const [view, setView] = useState<View>('intro')
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>('buyer')
  const [buyerType, setBuyerType] = useState<BuyerType>('first-time-buyer')
  const [propertyValue, setPropertyValue] = useState(350000)
  const [deposit, setDeposit] = useState(50000)
  const [houseWorth, setHouseWorth] = useState(375000)
  const [mortgageBalance, setMortgageBalance] = useState(240000)
  const [householdIncome, setHouseholdIncome] = useState(65000)
  const [employmentType, setEmploymentType] = useState<EmploymentType>('employed')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [hasAcceptedDataTerms, setHasAcceptedDataTerms] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const borrowingNeed = Math.max(propertyValue - deposit, 0)
  const remortgageEquity = Math.max(houseWorth - mortgageBalance, 0)

  const borrowingSummary = useMemo(() => {
    if (loanPurpose === 'remortgage') {
      return {
        label: 'Estimated equity',
        value: remortgageEquity,
        detail: 'Based on your estimated property value and current balance.',
      }
    }

    return {
      label: 'Estimated borrowing need',
      value: borrowingNeed,
      detail: 'Based on the property price less your deposit.',
    }
  }, [borrowingNeed, loanPurpose, remortgageEquity])

  const selectedSlotLabel = availabilitySlots.find((slot) => slot.id === selectedSlot)?.label ?? 'Choose a slot'
  const stepLabel = view === 'questionnaire' ? 'Step 1 of 2' : 'Step 2 of 2'

  useEffect(() => {
    fetch(`${API_BASE_URL}/availability`)
      .then((response) => response.json())
      .then((data: AvailabilitySlot[]) => {
        setAvailabilitySlots(data)
      })
      .catch(() => {
        setFeedbackMessage('We could not load the latest availability right now.')
      })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasAcceptedDataTerms) {
      return
    }

    setFeedbackMessage('')

    const acceptedAt = new Date().toISOString()
    const application: MortgageApplication = {
      id: createApplicationId(),
      createdAt: acceptedAt,
      consent: {
        dataStorageAccepted: hasAcceptedDataTerms,
        acceptedAt,
        version: CONSENT_VERSION,
      },
      mortgage:
        loanPurpose === 'remortgage'
          ? {
              purpose: loanPurpose,
              houseWorth,
              mortgageBalance,
              estimatedEquity: remortgageEquity,
            }
          : {
              purpose: loanPurpose,
              buyerType,
              propertyValue,
              deposit,
              borrowingNeed,
            },
      applicant: {
        householdIncome,
        employmentType,
        dateOfBirth,
      },
      advisor: {
        wantsToSpeak: true,
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      })

      if (!response.ok) {
        throw new Error('Unable to save application')
      }

      const savedApplication = await response.json()
      saveApplicationToSession({ ...application, id: savedApplication.id })
      setView('availability')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error(error)
      setFeedbackMessage('We could not save your application right now. Please try again.')
    }
  }

  async function handleConfirmAppointment() {
    const storedApplication = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!storedApplication || !selectedSlot) {
      return
    }

    const application = JSON.parse(storedApplication) as MortgageApplication

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          slotId: selectedSlot,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to book appointment')
      }

      const result = await response.json()
      saveApplicationToSession({
        ...application,
        advisor: {
          ...application.advisor,
          selectedSlot,
        },
      })
      setFeedbackMessage(`Appointment confirmed for ${result.booking.slotId}.`)
    } catch (error) {
      console.error(error)
      setFeedbackMessage('That appointment is no longer available. Please choose another slot.')
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar" aria-label="Main navigation">
        <button className="brand" type="button" onClick={() => setView('intro')} aria-label="1989 Mortgages home">
          <span className="brand-mark" aria-hidden="true">89</span>
          <span>1989 Mortgages</span>
        </button>
        <a className="phone-link" href="tel:+447774441989">0777 444 1989</a>
      </header>

      {view === 'intro' && (
        <section className="intro-screen" id="top">
          <div className="intro-copy">
            <p className="eyebrow">Mortgage advice without the maze</p>
            <h1>Find the right mortgage route with clarity and confidence.</h1>
            <p className="hero-text">
              Start with a short guided questionnaire and we’ll help you move
              from options to advice without the usual confusion.
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={() => setView('questionnaire')}
            >
              Fill in questionnaire
            </button>
            <div className="trust-row" aria-label="Trust signals">
              <span>No obligation</span>
              <span>Whole-of-market search</span>
              <span>FCA authorised advisers</span>
            </div>
          </div>
          <aside className="intro-card" aria-label="Questionnaire preview">
            <div className="intro-card-badge">Trusted, personal mortgage support</div>
            <strong>What happens next</strong>
            <ul className="intro-card-list">
              <li>7 short questions tailored to your move</li>
              <li>Clear borrowing insight before you speak to an adviser</li>
              <li>Book a call when the time feels right</li>
            </ul>
          </aside>
        </section>
      )}

      {view === 'questionnaire' && (
        <section className="questionnaire-screen" id="top">
          <div className="section-heading">
            <div className="section-meta" aria-label="Progress">
              <span className="section-badge">{stepLabel}</span>
              <span className="section-badge section-badge--muted">3 minutes</span>
            </div>
            <button className="text-link" type="button" onClick={() => setView('intro')}>
              ← Back to home
            </button>
            <p className="eyebrow">Quick questionnaire</p>
            <h1>Tell us where you are now.</h1>
            <p>
              Your answers help shape the mortgage conversation before you speak
              to an advisor.
            </p>
          </div>

          <form className="questionnaire-panel" onSubmit={handleSubmit}>
            <fieldset className="question-block">
              <legend>Are you a buyer or re-mortgaging?</legend>
              <div className="option-grid two-column" role="group" aria-label="Mortgage type">
                <button
                  className={loanPurpose === 'buyer' ? 'option-card is-active' : 'option-card'}
                  type="button"
                  onClick={() => setLoanPurpose('buyer')}
                >
                  Buyer
                </button>
                <button
                  className={loanPurpose === 'remortgage' ? 'option-card is-active' : 'option-card'}
                  type="button"
                  onClick={() => setLoanPurpose('remortgage')}
                >
                  Re-mortgaging
                </button>
              </div>
            </fieldset>

            {loanPurpose === 'remortgage' ? (
              <>
                <label className="field question-block">
                  <span>How much is your house worth?</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={houseWorth}
                    onChange={(event) => setHouseWorth(Number(event.target.value))}
                  />
                </label>

                <label className="field question-block">
                  <span>What is your current mortgage balance?</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={mortgageBalance}
                    onChange={(event) => setMortgageBalance(Number(event.target.value))}
                  />
                </label>
              </>
            ) : (
              <>
                <fieldset className="field question-block">
                  <legend>
                    Are you a first time buyer, home mover, or buying an
                    additional property?
                  </legend>
                  <div className="option-grid three-column" role="group" aria-label="Buyer type">
                    <button
                      className={
                        buyerType === 'first-time-buyer' ? 'option-card is-active' : 'option-card'
                      }
                      type="button"
                      onClick={() => setBuyerType('first-time-buyer')}
                    >
                      First time buyer
                    </button>
                    <button
                      className={buyerType === 'home-mover' ? 'option-card is-active' : 'option-card'}
                      type="button"
                      onClick={() => setBuyerType('home-mover')}
                    >
                      Home mover
                    </button>
                    <button
                      className={
                        buyerType === 'additional-property' ? 'option-card is-active' : 'option-card'
                      }
                      type="button"
                      onClick={() => setBuyerType('additional-property')}
                    >
                      Additional property
                    </button>
                  </div>
                </fieldset>

                <fieldset className="question-block calculator-block">
                  <legend>How much do you think you need to borrow?</legend>
                  <div className="calculator-grid">
                    <label className="field">
                      <span>Property price</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={propertyValue}
                        onChange={(event) => setPropertyValue(Number(event.target.value))}
                      />
                    </label>
                    <label className="field">
                      <span>Deposit</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={deposit}
                        onChange={(event) => setDeposit(Number(event.target.value))}
                      />
                    </label>
                  </div>
                </fieldset>
              </>
            )}

            <div className="quote-summary" aria-live="polite">
              <span>{borrowingSummary.label}</span>
              <strong>{borrowingSummary.value.toLocaleString('en-GB')} GBP</strong>
              <small>{borrowingSummary.detail}</small>
            </div>

            <label className="field question-block">
              <span>What’s your total household income?</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={householdIncome}
                onChange={(event) => setHouseholdIncome(Number(event.target.value))}
              />
            </label>

            <fieldset className="question-block">
              <legend>Are you employed or self employed?</legend>
              <div className="option-grid two-column" role="group" aria-label="Employment type">
                <button
                  className={employmentType === 'employed' ? 'option-card is-active' : 'option-card'}
                  type="button"
                  onClick={() => setEmploymentType('employed')}
                >
                  Employed
                </button>
                <button
                  className={
                    employmentType === 'self-employed' ? 'option-card is-active' : 'option-card'
                  }
                  type="button"
                  onClick={() => setEmploymentType('self-employed')}
                >
                  Self employed
                </button>
              </div>
            </fieldset>

            <label className="field question-block">
              <span>What is your date of birth?</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
              />
            </label>

            <section className="advisor-question" aria-labelledby="advisor-question-title">
              <div>
                <p className="eyebrow">Final step</p>
                <h2 id="advisor-question-title">
                  Would you like to speak to a mortgage advisor?
                </h2>
                <p>Click yes to select an available time.</p>
              </div>
              <div className="consent-actions">
                <label className="consent-box">
                  <input
                    type="checkbox"
                    checked={hasAcceptedDataTerms}
                    onChange={(event) => setHasAcceptedDataTerms(event.target.checked)}
                    required
                  />
                  <span>
                    I agree that 1989 Mortgages can store the details I have
                    provided and use them to contact me about mortgage advice.
                    I understand this is currently stored for this browser
                    session and may later be submitted securely to 1989
                    Mortgages systems.
                  </span>
                </label>
                <button
                  className="quote-submit"
                  type="submit"
                  disabled={!hasAcceptedDataTerms}
                >
                  Yes
                </button>
              </div>
            </section>
          </form>
        </section>
      )}

      {view === 'availability' && (
        <section className="availability-screen" id="top">
          <div className="section-heading">
            <div className="section-meta" aria-label="Progress">
              <span className="section-badge">{stepLabel}</span>
              <span className="section-badge section-badge--muted">One step left</span>
            </div>
            <button className="text-link" type="button" onClick={() => setView('intro')}>
              ← Back to home
            </button>
            <p className="eyebrow">Choose a time</p>
            <h1>Select an available advisor slot.</h1>
            <p>
              Pick a time that works and an advisor will be ready to talk
              through your answers.
            </p>
          </div>

          <section className="availability-panel" aria-label="Availability selector">
            {availabilitySlots.map((slot) => (
              <article className="slot-day" key={slot.id}>
                <div>
                  <strong>{slot.label}</strong>
                  <span>{slot.status === 'available' ? 'Available' : 'Booked'}</span>
                </div>
                <div className="time-grid">
                  <button
                    className={selectedSlot === slot.id ? 'time-button is-active' : 'time-button'}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    disabled={slot.status === 'booked'}
                  >
                    {slot.status === 'available' ? 'Select slot' : 'Booked'}
                  </button>
                </div>
              </article>
            ))}

            <div className="booking-summary">
              <div>
                <span>Selected appointment</span>
                <strong>{selectedSlotLabel}</strong>
                <small>{selectedSlot ? 'We will confirm this booking once you press continue.' : 'Choose a slot to continue.'}</small>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={handleConfirmAppointment}
                disabled={!selectedSlot}
              >
                Confirm appointment
              </button>
            </div>
            {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}
          </section>
        </section>
      )}
    </main>
  )
}

export default App
