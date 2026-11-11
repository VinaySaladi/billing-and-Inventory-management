import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Field, Input } from '../../components/ui'
import AuthShell from './AuthShell'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    await register(form)
    navigate('/onboarding/business')
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start billing in a few minutes. No card needed."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name}><Input value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters."><Input type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={errors.confirm}><Input type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" /></Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  )
}
