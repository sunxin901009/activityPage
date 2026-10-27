export interface Category {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  sort: number
  color: string
}

export interface Profile {
  name: string
  tagline: string
  introduction: string
  school: string
  interest: string
  hero: string | null
  email: string | null
}

export interface Media {
  id: number
  file: string
  kind: 'gallery' | 'attachment'
  caption: string
  sort: number
}

export interface Activity {
  id: string
  slug: string
  title: string
  date: string
  summary: string
  role: string
  location: string
  cover: string | null
  cover_alt: string
  category: Category
  featured: boolean
  sort: number
}

export interface ActivityDetail extends Activity {
  body: string
  outcome: string
  reflection: string
  media: Media[]
}

export interface Portfolio {
  profile: Profile
  categories: Category[]
  activities: Activity[]
  demo: boolean
}
