export const betaModeEnabled = import.meta.env.VITE_BETA_MODE === 'true'

export const newsletterEmbedUrl = (import.meta.env.VITE_NEWSLETTER_EMBED_URL ?? '').trim()
