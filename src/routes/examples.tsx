import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/examples')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/examples"!</div>
}
