import type { ActivityDetail, Category, Profile } from './types'

// Used only in explicit demo mode, never as a fallback when the CMS is unavailable.
export const categories: Category[] = [
  { id: 'volunteering', slug: 'volunteering', title: 'Volunteering', subtitle: 'A little kindness goes a long way', description: 'Turning care into action, starting close to home. Stories of showing up, connecting with others, and making a difference together.', sort: 1, color: 'green' },
  { id: 'summer-session', slug: 'summer-session', title: 'Summer Session', subtitle: 'Learning beyond the classroom', description: 'New campuses, different perspectives, and room to explore. Spending summer following a question a little further.', sort: 2, color: 'orange' },
  { id: 'academics', slug: 'academics', title: 'Academics', subtitle: 'Good questions deserve exploring', description: 'Observe, ask, experiment, and think again. A collection of research and discoveries, in and beyond the classroom.', sort: 3, color: 'purple' },
  { id: 'publications', slug: 'publications', title: 'Publications', subtitle: 'Giving ideas a life on the page', description: 'Putting observations into words and sharing ideas. Writing, research notes, and published work collected in one place.', sort: 4, color: 'yellow' },
  { id: 'hobbies', slug: 'hobbies', title: 'Hobbies', subtitle: 'More than one way to find joy', description: 'Finding my own rhythm in the outdoors, behind a camera, and in everyday details. The things I love, with no right answers required.', sort: 5, color: 'pink' },
]

export const profile: Profile = {
  name: 'Wang Tairan',
  tagline: 'Stay curious. Step into the world.',
  introduction: 'I am a high school student at Beijing 21st Century School, drawn to environmental science and curious about the world around me. Through learning and action, I hope to better understand and protect the planet we share.',
  school: 'Beijing 21st Century School',
  interest: 'Environmental Science',
  hero: '/images/forest.jpg',
  nature_photo: '/images/_forest.jpg',
  email: null,
}

const entries = [
  ['community-cleanup', 'Giving Our Park Room to Breathe', '2025-04-19', 'volunteering', 'Picking up litter, sorting recyclables, and taking notes in a city park, while reflecting on our relationship with the environment.', 'cleanup', 'Volunteer', 'Beijing · Community Park'],
  ['rural-teaching', 'One Classroom, Many Possibilities', '2024-07-16', 'volunteering', 'Bringing nature observation into a rural classroom, exploring the world with children, one leaf at a time.', 'classroom', 'Teaching Volunteer', 'Rural Primary School'],
  ['charity-bake-sale', 'A Little Sweetness, Shared', '2024-10-12', 'volunteering', 'Planning and working together on a school bake sale, discovering how small acts of kindness can become collective action.', 'baking', 'Event Volunteer', 'School Campus'],
  ['summer-field-notes', 'A Classroom in the Wild', '2025-07-22', 'summer-session', 'Stepping outside the classroom to connect environmental science with observations in the field.', 'forest', 'Program Participant', 'Summer Program'],
  ['water-observation', 'Big Questions in a Drop of Water', '2025-03-08', 'academics', 'Keeping an observation journal to turn curiosity about water and ecology into questions worth investigating.', 'water', 'Student Researcher', 'Science Classroom'],
  ['nature-journal', 'A Nature Journal for the City', '2025-01-18', 'publications', 'Gathering fragments of everyday observation and putting the small lives of the city into words.', 'journal', 'Author', 'Independent Writing'],
  ['weekend-outdoors', 'Weekends on the Trail', '2025-05-03', 'hobbies', 'Heading out with a camera and a curious mind, collecting light, fresh air, and unexpected encounters along the trail.', 'hiking', 'Nature Enthusiast', 'Mountain Trails'],
] as const

export const activities: ActivityDetail[] = entries.map((entry, index) => ({
  id: entry[0], slug: entry[0], title: entry[1], date: entry[2],
  category: categories.find(category => category.slug === entry[3])!,
  summary: entry[4], role: entry[6], location: entry[7],
  cover: `/images/${entry[5]}.jpg`, cover_alt: `${entry[1]} · Illustrative photo, not a photo of this activity`,
  featured: [0, 3, 4].includes(index), sort: index,
  body: `<p>This sample story demonstrates the page layout. The photos are illustrative and do not represent actual student experiences. Replace them with authentic activity descriptions and your own photos before publishing.</p><h2>Starting with a Small Question</h2><p>${entry[4]} Exploration does not always start with a grand ambition. Sometimes it begins with an observation, a conversation, or a question that stays with you.</p><h2>Turning Ideas into Action</h2><p>Describe what you actually did: how you prepared, who you worked with, what challenges you faced, and how you adapted. The most useful story goes beyond attendance to explain your contribution.</p><blockquote>Real learning begins when we look a little closer and ask one more question.</blockquote><h2>Details Worth Remembering</h2><p>Add photos, observation notes, and key moments to show the thinking behind your actions. Combine text and images, stay specific and honest, and use short captions to give each photo context.</p>`,
  outcome: 'Example: Describe verifiable outcomes, work produced, or lessons learned. Avoid unconfirmed numbers.',
  reflection: 'Example: How did this experience change your perspective? What would you do differently next time?',
  media: [],
}))
