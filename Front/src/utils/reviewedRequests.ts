const REVIEWED_REQUESTS_KEY = 'me-socorre:reviewed-requests'

function getReviewedRequests() {
  try {
    const stored = localStorage.getItem(REVIEWED_REQUESTS_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []
  } catch {
    return []
  }
}

export function hasReviewedRequest(requestId: number) {
  return getReviewedRequests().includes(requestId)
}

export function markRequestAsReviewed(requestId: number) {
  const reviewed = new Set(getReviewedRequests())
  reviewed.add(requestId)
  localStorage.setItem(REVIEWED_REQUESTS_KEY, JSON.stringify([...reviewed]))
}
