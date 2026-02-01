import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Payment.css'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9000'

export default function Payment() {
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchPayment() {
      try {
        const res = await fetch(`${apiBase}/api/payment`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setPayment(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPayment()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <main className="main payment-page">
        <div className="payment-loading">
          <div className="payment-spinner" />
          <p>Loading payment…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="main payment-page">
        <div className="payment-error">
          <p>Could not load payment: {error}</p>
          <Link to="/" className="payment-back">← Back to Dashboard</Link>
        </div>
      </main>
    )
  }

  const date = payment.date ? new Date(payment.date).toLocaleString() : '—'
  const completedAt = payment.completedAt ? new Date(payment.completedAt).toLocaleString() : '—'

  return (
    <main className="main payment-page">
      <div className="payment-layout">
        <header className="payment-header">
          <Link to="/" className="payment-back">← Dashboard</Link>
          <h1>Payment details</h1>
        </header>

        <div className="payment-card">
          <div className="payment-badge payment-badge-success">{payment.status}</div>
          <div className="payment-id">ID: {payment.id}</div>
          <div className="payment-amount">${Number(payment.amount).toFixed(2)} <span className="payment-currency">{payment.currency}</span></div>
          {payment.description && <p className="payment-desc">{payment.description}</p>}

          <dl className="payment-dl">
            <dt>Date</dt>
            <dd>{date}</dd>
            <dt>Completed</dt>
            <dd>{completedAt}</dd>
            <dt>Customer</dt>
            <dd>{payment.customer?.name ?? payment.customer?.id ?? '—'} {payment.customer?.email && <span className="payment-meta">({payment.customer.email})</span>}</dd>
            <dt>Merchant</dt>
            <dd>{payment.merchant?.name ?? payment.merchant?.id ?? '—'} {payment.merchant?.category && <span className="payment-meta"> · {payment.merchant.category}</span>}</dd>
          </dl>
        </div>
      </div>
    </main>
  )
}
