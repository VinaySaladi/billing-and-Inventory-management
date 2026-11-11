import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Field, Input } from '../../components/ui'
import AuthShell from './AuthShell'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: 'owner@srisaitraders.example', password: 'demo1234' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    await login(form.email)
    navigate(location.state?.from || '/dashboard', { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your billing and stock."
      footer={<>Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input type="password" autoComplete="current-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">Demo mode: any email and a 6+ character password will sign you in.</p>
      </form>
    </AuthShell>
  )
}
