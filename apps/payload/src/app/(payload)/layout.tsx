import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'
// Payload's base admin styles: the :root theme variables, the font and the
// layout. Without it every admin page rendered unstyled (KI004, the half that
// was never fixed; found 23 Nov 2026). Same import as Payload's own template.
import '@payloadcms/next/css'
import React from 'react'
import { importMap } from './admin/importMap'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
