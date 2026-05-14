import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import heroImg from './assets/hero.png'
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

const availabilitySlots = [
  { day: 'Today', date: '14 May', times: ['15:00', '16:30', '18:00'] },
  { day: 'Tomorrow', date: '15 May', times: ['09:30', '12:00', '17:30'] },
  { day: 'Saturday', date: '16 May', times: ['10:00', '11:30', '13:00'] },
]

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
  const [selectedSlot, setSelectedSlot] = useState('15 May 12:00')

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasAcceptedDataTerms) {
      return
    }

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

    saveApplicationToSession(application)
    setView('availability')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleConfirmAppointment() {
    const storedApplication = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!storedApplication) {
      return
    }

    const application = JSON.parse(storedApplication) as MortgageApplication
    saveApplicationToSession({
      ...application,
      advisor: {
        ...application.advisor,
        selectedSlot,
      },
    })
  }

  return (
    <main className="site-shell">
      <header className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="1989 Mortgages home">
          <span className="brand-mark" aria-hidden="true">89</span>
          <span>1989 Mortgages</span>
        </a>
        <a className="phone-link" href="tel:+447774441989">0777 444 1989</a>
      </header>

      {view === 'intro' && (
        <section className="intro-screen" id="top">
          <div className="intro-copy">
            <p className="eyebrow">Mortgage advice without the maze</p>
            <h1>Let’s find the right mortgage route for you.</h1>
            <p className="hero-text">
              Answer a few quick questions and we’ll get you to the right next
              step, whether you’re buying, moving, or remortgaging.
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={() => setView('questionnaire')}
            >
              Fill in questionnaire
            </button>
            <ul className="trust-row" aria-label="Trust signals">
              <li>No obligation</li>
              <li>Whole-of-market search</li>
              <li>FCA authorised advisers</li>
            </ul>
          </div>
          <aside className="intro-card" aria-label="Questionnaire preview">
            <img src={heroImg} alt="" aria-hidden="true" />
            <strong>7 questions</strong>
            <span>Property, borrowing, income, employment, and advisor booking.</span>
          </aside>
        </section>
      )}

      {view === 'questionnaire' && (
        <section className="questionnaire-screen" id="top">
          <div className="section-heading">
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
            <p className="eyebrow">Choose a time</p>
            <h1>Select an available advisor slot.</h1>
            <p>
              Pick a time that works and an advisor will be ready to talk
              through your answers.
            </p>
          </div>

          <section className="availability-panel" aria-label="Availability selector">
            {availabilitySlots.map((slot) => (
              <article className="slot-day" key={slot.date}>
                <div>
                  <strong>{slot.day}</strong>
                  <span>{slot.date}</span>
                </div>
                <div className="time-grid">
                  {slot.times.map((time) => {
                    const slotValue = `${slot.date} ${time}`

                    return (
                      <button
                        className={selectedSlot === slotValue ? 'time-button is-active' : 'time-button'}
                        type="button"
                        key={slotValue}
                        onClick={() => setSelectedSlot(slotValue)}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}

            <div className="booking-summary">
              <span>Selected appointment</span>
              <strong>{selectedSlot}</strong>
              <button
                className="primary-action"
                type="button"
                onClick={handleConfirmAppointment}
              >
                Confirm appointment
              </button>
            </div>
          </section>
        </section>
      )}
    </main>
  )
}

export default App
