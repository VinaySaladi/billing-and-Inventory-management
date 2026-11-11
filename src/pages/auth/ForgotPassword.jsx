import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button, Field, Input } from '../../components/ui'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setError('')
    setSent(true)
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">← Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <MailCheck className="mb-2 h-6 w-6" />
          If an account exists for <strong>{email}</strong>, you'll get a reset link shortly.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={error}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} /></Field>
          <Button type="submit" size="lg" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}
