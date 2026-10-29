const text = (field, label, extra = {}) => ({
  field,
  type: 'string',
  schema: { is_nullable: true },
  meta: {
    interface: 'input',
    translations: [{ language: 'en-US', translation: label }],
    ...extra,
  },
})
const longText = (field, label, extra = {}) => ({
  ...text(field, label, extra),
  type: 'text',
})
const id = {
  field: 'id',
  type: 'uuid',
  schema: { is_primary_key: true, is_nullable: false },
  meta: { special: ['uuid'], hidden: true, readonly: true },
}
const sort = {
  field: 'sort',
  type: 'integer',
  schema: { default_value: 0 },
  meta: { interface: 'input', hidden: true },
}
const required = (field) => ({
  ...field,
  schema: { ...field.schema, is_nullable: false },
  meta: { ...field.meta, required: true },
})
const slug = required({
  ...text('slug', 'URL Slug', {
    note: 'Use lowercase letters, numbers, and hyphens. Avoid changing this after publication.',
    validation: { slug: { _regex: '^[a-z0-9]+(?:-[a-z0-9]+)*$' } },
  }),
  schema: { is_unique: true },
})
const file = (field, label) => ({
  ...text(field, label, {
    interface: 'file-image',
    special: ['file'],
    note: 'Enable Public Access in the file details to make this file available to visitors.',
  }),
  type: 'uuid',
})
const metadata = (name, icon, extra = {}) => ({
  icon,
  translations: [{ language: 'en-US', translation: name }],
  ...extra,
})

export const collections = [
  {
    collection: 'categories',
    meta: metadata('Activity Categories', 'category', {
      sort_field: 'sort',
      display_template: '{{title}}',
    }),
    schema: {},
    fields: [
      id,
      slug,
      required(text('title', 'Chapter Title')),
      text('subtitle', 'Subtitle'),
      longText('description', 'Chapter Description', {
        interface: 'input-multiline',
      }),
      sort,
      {
        ...text('color', 'Theme Color', {
          interface: 'select-dropdown',
          options: {
            choices: ['green', 'orange', 'purple', 'yellow', 'pink'].map(
              (value) => ({ text: value, value }),
            ),
          },
        }),
        schema: { default_value: 'green' },
      },
    ],
  },
  {
    collection: 'profile',
    meta: metadata('Profile', 'person', { singleton: true }),
    schema: {},
    fields: [
      id,
      required(text('name', 'Display Name')),
      text('tagline', 'Tagline'),
      longText('introduction', 'Introduction', {
        interface: 'input-multiline',
      }),
      text('school', 'School'),
      text('interest', 'Area of Interest'),
      file('hero', 'Homepage Photo'),
      text('email', 'Public Contact Email', {
        note: 'Optional. This address will be displayed publicly on the website.',
      }),
    ],
  },
  {
    collection: 'activities',
    meta: metadata('Activity Stories', 'auto_stories', {
      sort_field: 'sort',
      display_template: '{{title}}',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      archive_app_filter: true,
    }),
    schema: {},
    fields: [
      id,
      {
        ...required(
          text('status', 'Publication Status', {
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Draft', value: 'draft' },
                { text: 'Published', value: 'published' },
                { text: 'Archived', value: 'archived' },
              ],
            },
          }),
        ),
        schema: { default_value: 'draft', is_nullable: false },
      },
      required(text('title', 'Activity Title')),
      slug,
      {
        ...required(
          text('category', 'Chapter', {
            interface: 'select-dropdown-m2o',
            special: ['m2o'],
            options: { template: '{{title}}' },
          }),
        ),
        type: 'uuid',
      },
      {
        field: 'date',
        type: 'date',
        schema: { is_nullable: false },
        meta: {
          interface: 'datetime',
          required: true,
          translations: [{ language: 'en-US', translation: 'Activity Date' }],
        },
      },
      required(
        longText('summary', 'Summary', { interface: 'input-multiline' }),
      ),
      text('role', 'My Role'),
      text('location', 'Location'),
      file('cover', 'Cover Image'),
      text('cover_alt', 'Cover Caption'),
      longText('body', 'Story Content', {
        interface: 'input-rich-text-html',
        note: 'Add headings, paragraphs, quotes, lists, and images. Enable Public Access for embedded images.',
      }),
      longText('outcome', 'Outcomes and Takeaways', {
        interface: 'input-multiline',
      }),
      longText('reflection', 'Reflections', { interface: 'input-multiline' }),
      {
        field: 'featured',
        type: 'boolean',
        schema: { default_value: false },
        meta: {
          interface: 'boolean',
          special: ['cast-boolean'],
          translations: [
            { language: 'en-US', translation: 'Featured on Homepage' },
          ],
        },
      },
      sort,
      {
        field: 'media',
        type: 'alias',
        meta: {
          interface: 'list-o2m',
          special: ['o2m'],
          options: { template: '{{kind}} · {{caption}}' },
          translations: [
            { language: 'en-US', translation: 'Gallery and Attachments' },
          ],
        },
      },
    ],
  },
  {
    collection: 'activity_media',
    meta: metadata('Activity Media', 'perm_media', {
      hidden: true,
      sort_field: 'sort',
    }),
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        schema: { is_primary_key: true, has_auto_increment: true },
        meta: { hidden: true, readonly: true },
      },
      {
        ...text('activity', 'Activity', {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          hidden: true,
        }),
        type: 'uuid',
      },
      {
        ...required(file('file', 'File')),
        meta: {
          ...file('file', 'File').meta,
          interface: 'file',
          required: true,
        },
      },
      {
        ...required(
          text('kind', 'Purpose', {
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Gallery', value: 'gallery' },
                { text: 'Attachment', value: 'attachment' },
              ],
            },
          }),
        ),
        schema: { default_value: 'gallery', is_nullable: false },
      },
      text('caption', 'Caption or Attachment Name'),
      sort,
    ],
  },
]

export const relations = [
  {
    collection: 'activities',
    field: 'category',
    related_collection: 'categories',
    schema: { on_delete: 'RESTRICT' },
    meta: {
      many_collection: 'activities',
      many_field: 'category',
      one_collection: 'categories',
    },
  },
  ...[
    ['profile', 'hero'],
    ['activities', 'cover'],
    ['activity_media', 'file'],
  ].map(([collection, field]) => ({
    collection,
    field,
    related_collection: 'directus_files',
    schema: {
      on_delete: collection === 'activity_media' ? 'RESTRICT' : 'SET NULL',
    },
    meta: {
      many_collection: collection,
      many_field: field,
      one_collection: 'directus_files',
    },
  })),
  {
    collection: 'activity_media',
    field: 'activity',
    related_collection: 'activities',
    schema: { on_delete: 'CASCADE' },
    meta: {
      many_collection: 'activity_media',
      many_field: 'activity',
      one_collection: 'activities',
      one_field: 'media',
      sort_field: 'sort',
      one_deselect_action: 'delete',
    },
  },
]

// Uploads are private until explicitly marked public.
export const publicFileField = {
  field: 'is_public',
  type: 'boolean',
  schema: { default_value: false, is_nullable: false },
  meta: {
    interface: 'boolean',
    special: ['cast-boolean'],
    note: 'Anyone with the link can access a public file. Unpublishing a story does not withdraw its files; disable this setting separately.',
    translations: [{ language: 'en-US', translation: 'Public Access' }],
  },
}

export const publicPermissions = [
  {
    collection: 'profile',
    fields: [
      'name',
      'tagline',
      'introduction',
      'school',
      'interest',
      'hero',
      'email',
    ],
    permissions: {},
  },
  {
    collection: 'categories',
    fields: ['id', 'slug', 'title', 'subtitle', 'description', 'sort', 'color'],
    permissions: {},
  },
  {
    collection: 'activities',
    fields: [
      'id',
      'status',
      'slug',
      'title',
      'date',
      'summary',
      'role',
      'location',
      'cover',
      'cover_alt',
      'category',
      'featured',
      'sort',
      'body',
      'outcome',
      'reflection',
      'media',
    ],
    permissions: { status: { _eq: 'published' } },
  },
  {
    collection: 'activity_media',
    fields: ['id', 'file', 'kind', 'caption', 'sort', 'activity'],
    permissions: {
      _and: [
        { activity: { status: { _eq: 'published' } } },
        { file: { is_public: { _eq: true } } },
      ],
    },
  },
  {
    collection: 'directus_files',
    fields: [
      'id',
      'is_public',
      'storage',
      'filename_disk',
      'filename_download',
      'title',
      'type',
      'filesize',
      'width',
      'height',
      'description',
    ],
    permissions: { is_public: { _eq: true } },
  },
]

export const initialCategories = [
  {
    slug: 'volunteering',
    title: 'Volunteering',
    subtitle: 'A little kindness goes a long way',
    description: 'Turning care into action, starting close to home.',
    color: 'green',
    sort: 1,
  },
  {
    slug: 'summer-session',
    title: 'Summer Session',
    subtitle: 'Learning beyond the classroom',
    description: 'New campuses, different perspectives, and room to explore.',
    color: 'orange',
    sort: 2,
  },
  {
    slug: 'academics',
    title: 'Academics',
    subtitle: 'Good questions deserve exploring',
    description: 'Observe, ask, experiment, and think again.',
    color: 'purple',
    sort: 3,
  },
  {
    slug: 'publications',
    title: 'Publications',
    subtitle: 'Giving ideas a life on the page',
    description: 'Collecting observations, reflections, research, and writing.',
    color: 'yellow',
    sort: 4,
  },
  {
    slug: 'hobbies',
    title: 'Hobbies',
    subtitle: 'More than one way to find joy',
    description: 'Finding my own rhythm in the details of everyday life.',
    color: 'pink',
    sort: 5,
  },
]
