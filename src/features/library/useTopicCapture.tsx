import { useState } from 'react'
import { useInbox } from '../../services/inbox/useInbox'
import { CaptureSheet } from './CaptureSheet'

/** The same capture lifecycle serves Library's menu and Home's direct action. */
export function useTopicCapture(onCaptured: () => void) {
  const inbox = useInbox()
  const [capturing, setCapturing] = useState(false)
  return {
    available: inbox.status === 'ready',
    openCapture: () => setCapturing(true),
    overlay: capturing ? (
      <CaptureSheet
        onSubmit={inbox.addRequest}
        onClose={() => setCapturing(false)}
        onCaptured={onCaptured}
      />
    ) : null,
  }
}
