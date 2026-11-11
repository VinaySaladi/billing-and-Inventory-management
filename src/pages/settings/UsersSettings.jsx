import { useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Table, Badge, ConfirmDialog } from '../../components/ui'
import SettingsTabs from './SettingsTabs'
import { formatDate, initials } from '../../lib/format'

const ROLES = {
  owner: 'Manage business, members, settings, all records and subscription.',
  admin: 'Manage day-to-day records and reports.',
  staff: 'Create invoices, customers, products and payments.',
  viewer: 'Read dashboard and reports only.',
}

export default function UsersSettings() {
  const { data, inviteMember, updateMemberRole, removeMember } = useData()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'staff' })
  const [error, setError] = useState('')

  const invite = () => {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a name and a valid email.')
    const res = inviteMember(form)
    if (!res.ok) return setError(res.error)
    toast(`Invite sent to ${form.email}`)
    setOpen(false)
  }

  return (
    <div>
      <PageHeader title="Settings" actions={<Button icon={UserPlus} onClick={() => { setForm({ name: '', email: '', role: 'staff' }); setError(''); setOpen(true) }}>Invite user</Button>} />
      <SettingsTabs />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Team members" subtitle={`${data.members.length} of ${data.business.plan === 'free' ? 1 : data.business.plan === 'starter' ? 2 : data.business.plan === 'business' ? 5 : 'unlimited'} seats on your plan`} />
          <Table rows={data.members} columns={[
            { key: 'name', header: 'User', render: (r) => (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{initials(r.name)}</span>
                <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div>
              </div>
            ) },
            { key: 'role', header: 'Role', render: (r) => r.role === 'owner' ? <Badge color="indigo">Owner</Badge> : (
              <Select value={r.role} onChange={(e) => { updateMemberRole(r.id, e.target.value); toast('Role updated') }} className="w-28" aria-label="Role">
                <option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option>
              </Select>
            ) },
            { key: 'status', header: 'Status', render: (r) => r.status === 'active' ? <Badge color="green">Active</Badge> : <Badge color="amber">Invited</Badge> },
            { key: 'joined', header: 'Added', render: (r) => formatDate(r.joinedAt) },
            { key: 'x', header: '', align: 'right', render: (r) => r.role !== 'owner' && (
              <button onClick={() => setRemoving(r)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${r.name}`}><Trash2 className="h-4 w-4" /></button>
            ) },
          ]} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Roles" />
          <ul className="divide-y divide-slate-100">
            {Object.entries(ROLES).map(([k, v]) => (
              <li key={k} className="px-5 py-3"><p className="text-sm font-medium capitalize text-slate-900">{k}</p><p className="text-xs text-slate-500">{v}</p></li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite user"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={invite}>Send invite</Button></>}>
        <div className="space-y-4">
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role" hint={ROLES[form.role]}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option>
            </Select>
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title={`Remove ${removing?.name}?`}
        message="They will lose access to this business immediately." confirmLabel="Remove"
        onConfirm={() => { removeMember(removing.id); toast('User removed'); setRemoving(null) }} />
    </div>
  )
}
