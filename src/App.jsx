import { useEffect, useState } from 'react'
import { primusProof } from './primus'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9000'

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    isPaymentSuccess: params.get('payment') === 'true',
    amount: params.get('amount'),
    merchant: params.get('merchant'),
    ref: params.get('ref'),
  }
}

function hasPaymentParams() {
  const { isPaymentSuccess, amount, merchant } = getUrlParams()
  return isPaymentSuccess || (amount && merchant)
}

const recentTransactions = [
  { name: 'Decent', amount: -10 },
  { name: 'Wakame', amount: 3, note: 'rent' },
  { name: 'Wakame', amount: -1.37 },
  { name: 'Zinyo', amount: 0 },
]

export default function App() {
  const urlParams = getUrlParams()
  const initialShowPayment = hasPaymentParams()
  // If ?payment=true, start as loading; if ?amount&merchant, start as ready
  const getInitialStatus = () => {
    if (urlParams.isPaymentSuccess) return 'loading'
    if (urlParams.amount && urlParams.merchant) return 'ready'
    return 'loading'
  }

  const [showPayment, setShowPayment] = useState(initialShowPayment)
  const [paymentData, setPaymentData] = useState(() => {
    // Pre-populate payment data if we have amount & merchant in URL
    if (urlParams.amount && urlParams.merchant) {
      return {
        amount: Number(urlParams.amount),
        currency: 'USD',
        description: `Payment for order #2847`,
        merchant: { name: urlParams.merchant },
        customer: { name: 'You' },
      }
    }
    return null
  })
  const [paymentStatus, setPaymentStatus] = useState(getInitialStatus)
  const [error, setError] = useState(null)

  // Open payment modal with custom amount/merchant (for Send button)
  const openPaymentModal = (amount, merchant) => {
    const data = {
      amount: amount || 0,
      currency: 'USD',
      description: `Payment to ${merchant || 'Merchant'}`,
      merchant: { name: merchant || 'Merchant' },
      customer: { name: 'You' },
    }
    setPaymentData(data)
    setPaymentStatus('ready')
    setShowPayment(true)
    setError(null)
  }

  useEffect(() => {
    const onPopState = () => {
      const hasPayment = hasPaymentParams()
      setShowPayment(hasPayment)
      if (hasPayment) {
        setPaymentStatus('loading')
        setPaymentData(null)
        setError(null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Handle ?payment=true on mount - fetch from API and show success
  useEffect(() => {
    if (!showPayment) return
    const { isPaymentSuccess } = getUrlParams()
    if (!isPaymentSuccess) return // Only run for ?payment=true

    let cancelled = false
    setPaymentStatus('loading')

      ; (async () => {
        try {
          const res = await fetch(`${apiBase}/api/payment`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (!cancelled) {
            setPaymentData(data)
            setPaymentStatus('success')
          }
        } catch (e) {
          if (!cancelled) {
            setError(e.message)
            setPaymentStatus('loading') // Keep showing loading with error overlay
          }
        }
      })()

    return () => { cancelled = true }
  }, []) // Run once on mount

  const handlePay = async () => {
    setPaymentStatus('processing')
    const { ref } = getUrlParams()
    try {
      const result = await primusProof({ reference: ref ?? undefined })
      if (result?.ok === false) {
        throw new Error(result.error ?? 'Payment failed')
      }
      setPaymentStatus('success')
    } catch (e) {
      setError(e.message)
      setPaymentStatus('ready')
    }
  }

  const closePayment = () => {
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState({}, '', url.pathname)
    setShowPayment(false)
    setPaymentData(null)
    setPaymentStatus('loading')
    setError(null)
  }

  return (
    <>
      <main className="main">
        <header className="main-header">
          <h1 className="main-title">Dashboard</h1>
          <div className="main-actions">
            <button type="button" className="icon-btn" aria-label="Charts">📊</button>
            <button type="button" className="icon-btn" aria-label="Notifications">🔔</button>
            <button type="button" className="avatar-btn" aria-label="Account">D</button>
          </div>
        </header>

        <section className="balance-card">
          <div className="balance-header">
            <span className="balance-avatar">D</span>
            <span>Account</span>
            <span className="balance-chevron">▼</span>
          </div>
          <div className="balance-label">Balance</div>
          <div className="balance-value">$231.00</div>
          <div className="balance-actions">
            <button type="button" className="balance-btn" onClick={() => openPaymentModal(10, 'Merchant')}>
              <span className="balance-btn-icon">👛</span>
              Send
            </button>
            <button type="button" className="balance-btn">
              <span className="balance-btn-icon">⇄</span>
              Transfer
            </button>
          </div>
        </section>

        <section className="recent">
          <div className="recent-header">
            <h2 className="recent-title">Recent transactions</h2>
            <a href="#" className="recent-more">More recent</a>
          </div>
          <ul className="recent-list">
            {recentTransactions.map((tx, i) => (
              <li key={i} className="recent-item">
                <span className="recent-item-icon">📄</span>
                <div className="recent-item-body">
                  <span className="recent-item-name">{tx.name}</span>
                  {tx.note && <span className="recent-item-note">{tx.note}</span>}
                </div>
                <span className={`recent-item-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                  {tx.amount >= 0 ? '' : '-'}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {showPayment && (
        <div className="modal-overlay" onClick={paymentStatus === 'success' ? closePayment : undefined}>
          <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
            {paymentStatus === 'loading' && (
              <div className="payment-modal-status">
                <div className="payment-spinner" />
                <p>Loading payment…</p>
              </div>
            )}

            {error && (
              <div className="payment-modal-status">
                <p style={{ color: '#f87171' }}>Error: {error}</p>
                <button type="button" className="modal-pay" onClick={closePayment} style={{ marginTop: '1rem' }}>
                  Close
                </button>
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="payment-modal-status">
                <div className="payment-spinner" />
                <p>Processing payment…</p>
              </div>
            )}

            {paymentStatus === 'success' && paymentData && (
              <div className="payment-modal-status">
                <h2 className="modal-title" style={{ marginBottom: '1rem' }}>Payment details</h2>
                <div className="payment-card-preview">
                  <div className="payment-badge payment-badge-success">SUCCEEDED</div>
                  <p className="payment-id" style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.75rem 0 0.5rem' }}>ID: {paymentData.id || 'pay_9x7k2m4n1q'}</p>
                  <div className="payment-amount">${Number(paymentData.amount).toFixed(2)} <span className="payment-currency">{paymentData.currency}</span></div>
                  <p className="payment-desc">{paymentData.description || 'Payment for order #2847'}</p>
                  <dl className="payment-dl">
                    <dt>Date</dt>
                    <dd>{new Date().toLocaleString()}</dd>
                    <dt>Completed</dt>
                    <dd>{new Date().toLocaleString()}</dd>
                    <dt>Customer</dt>
                    <dd>{paymentData.customer?.name ?? 'Alex Chen'} ({paymentData.customer?.email ?? 'alex.chen@example.com'})</dd>
                    <dt>Merchant</dt>
                    <dd>{paymentData.merchant?.name ?? '—'} · {paymentData.merchant?.category ?? 'Retail'}</dd>
                  </dl>
                </div>
                <button type="button" className="modal-pay" onClick={closePayment} style={{ marginTop: '1.5rem' }}>
                  Close
                </button>
              </div>
            )}

            {paymentStatus === 'ready' && paymentData && !error && (
              <>
                <h2 className="modal-title">Confirm Payment</h2>
                <div className="payment-card-preview">
                  <div className="payment-amount">${Number(paymentData.amount).toFixed(2)} <span className="payment-currency">{paymentData.currency}</span></div>
                  <dl className="payment-dl">
                    <dt>To</dt>
                    <dd>{paymentData.merchant?.name ?? '—'}</dd>
                    <dt>Description</dt>
                    <dd>{paymentData.description}</dd>
                  </dl>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="modal-pay modal-pay-secondary" onClick={closePayment}>
                    Cancel
                  </button>
                  <button type="button" className="modal-pay" onClick={handlePay}>
                    Pay
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
