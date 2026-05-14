import { useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

type LoanPurpose = 'buy' | 'remortgage'

const rates = [
  { lender: 'Halifax', rate: '4.42%', fee: '999 GBP', monthly: '1,226 GBP' },
  { lender: 'Santander', rate: '4.49%', fee: '0 GBP', monthly: '1,241 GBP' },
  { lender: 'Nationwide', rate: '4.58%', fee: '499 GBP', monthly: '1,258 GBP' },
]

const steps = ['Property', 'Deposit', 'Situation', 'Results']

function App() {
  const [purpose, setPurpose] = useState<LoanPurpose>('buy')
  const [propertyValue, setPropertyValue] = useState(375000)
  const [deposit, setDeposit] = useState(75000)

  const loanAmount = Math.max(propertyValue - deposit, 0)
  const ltv = useMemo(() => {
    if (!propertyValue) return 0
    return Math.round((loanAmount / propertyValue) * 100)
  }, [loanAmount, propertyValue])

  return (
    <main className="site-shell">
      <header className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Find Your Mortgage home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Find Your Mortgage</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#compare">Compare</a>
          <a href="#process">How it works</a>
          <a href="#advice">Advice</a>
        </nav>
        <a className="phone-link" href="tel:+442045551234">020 4555 1234</a>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Mortgage advice without the maze</p>
          <h1>Find a mortgage that fits your next move.</h1>
          <p className="hero-text">
            Compare leading UK lenders, check what you could borrow, and get
            matched with an adviser who can keep the application moving.
          </p>
          <div className="hero-actions" aria-label="Key actions">
            <a className="primary-action" href="#quote">Start my quote</a>
            <a className="secondary-action" href="#compare">View rates</a>
          </div>
          <ul className="trust-row" aria-label="Trust signals">
            <li>No obligation</li>
            <li>Whole-of-market search</li>
            <li>FCA authorised advisers</li>
          </ul>
        </div>

        <section className="quote-panel" id="quote" aria-labelledby="quote-title">
          <div className="quote-heading">
            <p>Step 1 of 4</p>
            <h2 id="quote-title">What are you looking to do?</h2>
          </div>

          <div className="segmented-control" role="group" aria-label="Mortgage purpose">
            <button
              className={purpose === 'buy' ? 'is-active' : ''}
              type="button"
              onClick={() => setPurpose('buy')}
            >
              Buy a home
            </button>
            <button
              className={purpose === 'remortgage' ? 'is-active' : ''}
              type="button"
              onClick={() => setPurpose('remortgage')}
            >
              Remortgage
            </button>
          </div>

          <label className="field">
            <span>Property value</span>
            <input
              type="number"
              min="50000"
              step="5000"
              value={propertyValue}
              onChange={(event) => setPropertyValue(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>{purpose === 'buy' ? 'Deposit' : 'Current equity'}</span>
            <input
              type="number"
              min="0"
              step="5000"
              value={deposit}
              onChange={(event) => setDeposit(Number(event.target.value))}
            />
          </label>

          <div className="quote-summary" aria-live="polite">
            <span>Estimated loan</span>
            <strong>{loanAmount.toLocaleString('en-GB')} GBP</strong>
            <small>{ltv}% loan to value</small>
          </div>

          <a className="quote-submit" href="#compare">See my options</a>

          <ol className="progress-list" aria-label="Quote progress">
            {steps.map((step, index) => (
              <li className={index === 0 ? 'is-current' : ''} key={step}>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section className="stats-band" aria-label="Service highlights">
        <div>
          <strong>90+</strong>
          <span>lenders searched</span>
        </div>
        <div>
          <strong>15 min</strong>
          <span>first eligibility check</span>
        </div>
        <div>
          <strong>4.9/5</strong>
          <span>customer adviser rating</span>
        </div>
      </section>

      <section className="comparison-section" id="compare">
        <div className="section-heading">
          <p className="eyebrow">Live-style comparison</p>
          <h2>Clear options before you apply.</h2>
        </div>
        <div className="rate-table" role="table" aria-label="Example mortgage rates">
          <div className="rate-row rate-head" role="row">
            <span role="columnheader">Lender</span>
            <span role="columnheader">Initial rate</span>
            <span role="columnheader">Fee</span>
            <span role="columnheader">Monthly</span>
          </div>
          {rates.map((rate) => (
            <div className="rate-row" role="row" key={rate.lender}>
              <span role="cell">{rate.lender}</span>
              <strong role="cell">{rate.rate}</strong>
              <span role="cell">{rate.fee}</span>
              <span role="cell">{rate.monthly}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>A guided path from search to offer.</h2>
        </div>
        <div className="process-grid">
          <article>
            <span className="step-mark">01</span>
            <h3>Share the basics</h3>
            <p>Tell us about the property, deposit, income, and timing.</p>
          </article>
          <article>
            <span className="step-mark">02</span>
            <h3>Compare your match</h3>
            <p>See suitable lenders and products before a full application.</p>
          </article>
          <article>
            <span className="step-mark">03</span>
            <h3>Apply with support</h3>
            <p>An adviser helps package the case and manage next steps.</p>
          </article>
        </div>
      </section>

      <section className="advice-strip" id="advice">
        <img src={heroImg} alt="" aria-hidden="true" />
        <div>
          <p className="eyebrow">Protection included</p>
          <h2>Mortgage, life cover, and income protection in one conversation.</h2>
          <p>
            Keep the practical bits together so you can make a confident choice
            without repeating the same details across separate forms.
          </p>
        </div>
        <a className="secondary-action" href="#quote">Check eligibility</a>
      </section>
    </main>
  )
}

export default App
