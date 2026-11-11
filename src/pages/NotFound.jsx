import { Button, EmptyState } from '../components/ui'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      message="The page you are looking for doesn't exist or was moved."
      action={<Button to="/dashboard">Back to dashboard</Button>}
    />
  )
}
