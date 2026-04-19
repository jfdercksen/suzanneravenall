import { getPayload } from 'payload'
import config from '../payload.config'

async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'users', limit: 1 })
  if (existing.totalDocs > 0) {
    console.log('Admin user already exists — no action taken.')
    process.exit(0)
  }

  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@suzanneravenall.com',
      password: 'ChangeMe123!',
      name: 'Admin',
      role: 'admin',
    },
  })

  console.log('Admin user created: admin@suzanneravenall.com')
  console.log('Password: ChangeMe123! — change immediately after first login')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
