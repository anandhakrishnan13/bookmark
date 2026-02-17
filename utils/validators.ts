// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Title validation
export function isValidTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 500
}

// Bookmark validation
export interface BookmarkValidation {
  valid: boolean
  errors: {
    title?: string
    url?: string
  }
}

export function validateBookmark(title: string, url: string): BookmarkValidation {
  const errors: { title?: string; url?: string } = {}

  if (!isValidTitle(title)) {
    errors.title = 'Title must be between 1 and 500 characters'
  }

  if (!isValidUrl(url)) {
    errors.url = 'Invalid URL format'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
