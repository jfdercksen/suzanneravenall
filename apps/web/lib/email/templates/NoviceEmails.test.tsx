import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NoviceChangesRequested, NoviceDocuments, NoviceSubmittedTeam } from './NoviceEmails'
import { NOVICE_CHECKLIST } from '../../novice/checklist'

describe('Novice emails (Suzanne, 19 Nov 2026)', () => {
  const documents = renderToStaticMarkup(
    createElement(NoviceDocuments, {
      firstName: 'Thandi',
      levelTitle: 'Akashic Novice Practitioner - Basic Membership',
      status: NOVICE_CHECKLIST.akashic.status,
      items: NOVICE_CHECKLIST.akashic.items,
      uploadUrl: 'https://suzanneravenall.com/portal/novice',
      pathwayUrl: 'https://suzanneravenall.com/programs/certification/akashic-navigation',
    }),
  )

  it('lists every item to upload, says access starts on approval, and links the upload page', () => {
    for (const item of NOVICE_CHECKLIST.akashic.items) expect(documents).toContain(item.replace(/&/g, '&amp;'))
    expect(documents).toContain('Your Novice access starts once your team')
    expect(documents).toContain('https://suzanneravenall.com/portal/novice')
  })

  it('carries the team note in the changes email, and the team mail carries no files', () => {
    const changes = renderToStaticMarkup(createElement(NoviceChangesRequested, { firstName: null, levelTitle: 'X', note: 'Add your Session Log.\nAnd the consent forms.', uploadUrl: 'https://u' }))
    expect(changes).toContain('Add your Session Log.')
    expect(changes).toContain('And the consent forms.')
    const team = renderToStaticMarkup(createElement(NoviceSubmittedTeam, { memberName: 'Thandi', memberEmail: 'm@example.com', levelTitle: 'X', fileCount: 3, reviewUrl: 'https://s/staff/novice/1' }))
    expect(team).toContain('The files are not in this email.')
    expect(team).toContain('https://s/staff/novice/1')
  })

  it('has no em dash anywhere, checklists included', () => {
    expect(documents).not.toContain('\u2014')
    for (const list of Object.values(NOVICE_CHECKLIST)) for (const item of list.items) expect(item).not.toContain('\u2014')
  })
})
