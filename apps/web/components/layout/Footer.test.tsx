/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

// Mock next/link as a passthrough <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock @suzanne/ui Logo
vi.mock('@suzanne/ui', () => ({
  Logo: () => <img alt="Dr. Suzanne Ravenall" />,
}))

describe('Footer', () => {
  describe('structural elements', () => {
    it('renders a <footer> element with role="contentinfo"', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
      expect(footer.tagName).toBe('FOOTER')
    })

    it('renders the Logo image', () => {
      render(<Footer />)
      const logo = screen.getByAltText('Dr. Suzanne Ravenall')
      expect(logo).toBeInTheDocument()
    })

    it('renders a logo link pointing to "/"', () => {
      render(<Footer />)
      const logoLink = screen.getByRole('link', {
        name: /Dr\. Suzanne Ravenall.*return to homepage/i,
      })
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('copyright text', () => {
    it('contains copyright text with "Dr. Suzanne Ravenall"', () => {
      render(<Footer />)
      expect(screen.getByText(/Dr\. Suzanne Ravenall\. All rights reserved\./i)).toBeInTheDocument()
    })

    it('includes the current year in the copyright text', () => {
      render(<Footer />)
      const year = new Date().getFullYear().toString()
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
    })
  })

  describe('"Built by Ai Dynamic Advisory" attribution', () => {
    it('contains "Built by Ai Dynamic Advisory" text', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'Ai Dynamic Advisory' })
      expect(link).toBeInTheDocument()
    })

    it('"Ai Dynamic Advisory" link points to the correct URL', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'Ai Dynamic Advisory' })
      expect(link).toHaveAttribute('href', 'https://aidynamicadvisory.com')
    })

    it('"Ai Dynamic Advisory" link opens in a new tab', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'Ai Dynamic Advisory' })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('social media links', () => {
    it('renders a Facebook link', () => {
      render(<Footer />)
      const fb = screen.getByRole('link', { name: 'Facebook' })
      expect(fb).toBeInTheDocument()
      expect(fb).toHaveAttribute('href', 'https://www.facebook.com/suzanneravenalltransformation')
    })

    it('renders an Instagram link', () => {
      render(<Footer />)
      const ig = screen.getByRole('link', { name: 'Instagram' })
      expect(ig).toBeInTheDocument()
      expect(ig).toHaveAttribute('href', 'https://www.instagram.com/suzanneravenall')
    })

    it('renders a LinkedIn link', () => {
      render(<Footer />)
      const li = screen.getByRole('link', { name: 'LinkedIn' })
      expect(li).toBeInTheDocument()
      expect(li).toHaveAttribute('href', 'https://www.linkedin.com/in/sravenall')
    })

    it('does not render a placeholder YouTube link', () => {
      render(<Footer />)
      expect(screen.queryByRole('link', { name: 'YouTube' })).not.toBeInTheDocument()
    })

    it('all social links open in a new tab with rel="noopener noreferrer"', () => {
      render(<Footer />)
      const socialLabels = ['Facebook', 'Instagram', 'LinkedIn']
      for (const label of socialLabels) {
        const link = screen.getByRole('link', { name: label })
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      }
    })

    it('renders the social media container with aria-label "Social media links"', () => {
      // The container is a plain <div> — not a landmark role — so query by attribute directly
      const { container } = render(<Footer />)
      const socialContainer = container.querySelector('[aria-label="Social media links"]')
      expect(socialContainer).toBeInTheDocument()
    })
  })

  describe('footer navigation columns', () => {
    it('renders "Services" column heading', () => {
      render(<Footer />)
      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('renders "Programs" column heading', () => {
      render(<Footer />)
      expect(screen.getByText('Programs')).toBeInTheDocument()
    })

    it('renders "Company" column heading', () => {
      render(<Footer />)
      expect(screen.getByText('Company')).toBeInTheDocument()
    })

    it('renders "Legal" column heading', () => {
      render(<Footer />)
      expect(screen.getByText('Legal')).toBeInTheDocument()
    })

    it('renders Services column links', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Private Sessions' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Group Coaching' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Executive Coaching' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Corporate Programs' })).toBeInTheDocument()
    })

    it('renders Programs column links', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Practitioner Programmes' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Self-Study Courses' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Masterclass' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Workshops' })).toBeInTheDocument()
    })

    it('renders Company column links', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Resources' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument()
    })

    it('renders Legal column links', () => {
      render(<Footer />)
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Cookie Policy' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Disclaimer' })).toHaveAttribute('href', '/legal/disclaimer')
    })

    it('renders "Group Sites" column with external venture links', () => {
      render(<Footer />)
      expect(screen.getByText('Group Sites')).toBeInTheDocument()
      const ventures: Array<[string, string]> = [
        ['The Ravenall Institute', 'https://ravenallinstitute.com'],
        ['Rapid Repatterning', 'https://repatterning.com'],
        ['Human Performance Replicator', 'https://humanperformancereplicator.com'],
        ['NCCBM', 'https://nccbmglobal.com'],
        ['The Effectiveness Company', 'https://www.effectivenesscompany.com'],
      ]
      for (const [label, href] of ventures) {
        const link = screen.getByRole('link', { name: label })
        expect(link).toHaveAttribute('href', href)
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      }
    })
  })

  describe('contact details', () => {
    it('renders the contact email as a mailto link', () => {
      render(<Footer />)
      const email = screen.getByRole('link', { name: 'sravenall@suzanneravenall.com' })
      expect(email).toHaveAttribute('href', 'mailto:sravenall@suzanneravenall.com')
    })

    it('renders the postal address', () => {
      render(<Footer />)
      expect(screen.getByText(/PO Box 910, Kyalami/)).toBeInTheDocument()
      expect(screen.getByText(/Johannesburg, South Africa/)).toBeInTheDocument()
    })
  })

  describe('professional credentials', () => {
    it('renders the credentials list', () => {
      render(<Footer />)
      const credentialsList = screen.getByRole('list', { name: 'Professional credentials' })
      expect(credentialsList).toBeInTheDocument()
    })

    it('renders all four credential badges', () => {
      render(<Footer />)
      expect(screen.getByText('ICF Member')).toBeInTheDocument()
      expect(screen.getByText('CTAA Accredited')).toBeInTheDocument()
      expect(screen.getByText('ISO 9001 Certified')).toBeInTheDocument()
      expect(screen.getByText('B.Msc. M.Msc. Msc.D.')).toBeInTheDocument()
    })
  })
})
