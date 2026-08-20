import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_timeline/')({ component: TimelineIndex })

// The timeline itself lives in the _timeline layout; the index child adds nothing.
function TimelineIndex() {
  return null
}
