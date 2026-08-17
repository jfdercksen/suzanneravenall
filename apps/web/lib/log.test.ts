import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}))

import { logError, logWarn } from './log'

describe('logError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    captureException.mockReset()
    captureMessage.mockReset()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('console.errors the message and captures a real Error via captureException', () => {
    const err = new Error('boom')
    logError('[test] something failed', err)

    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] something failed', err)
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledWith(err, {
      level: 'error',
      extra: { logMessage: '[test] something failed' },
    })
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('forwards context as extras alongside the Error', () => {
    const err = new Error('boom')
    logError('[test] payment failed', err, { orderId: 'ord_1', status: 502 })

    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] payment failed', err, {
      orderId: 'ord_1',
      status: 502,
    })
    expect(captureException).toHaveBeenCalledWith(err, {
      level: 'error',
      extra: { logMessage: '[test] payment failed', orderId: 'ord_1', status: 502 },
    })
  })

  it('captures a message-only call via captureMessage at error level', () => {
    logError('[test] SECRET is not set')

    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] SECRET is not set')
    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(captureMessage).toHaveBeenCalledWith('[test] SECRET is not set', {
      level: 'error',
      extra: {},
    })
    expect(captureException).not.toHaveBeenCalled()
  })

  it('captures non-Error thrown values via captureMessage with the value as extra', () => {
    logError('[test] weird throw', 'a string error', { cartId: 'cart_1' })

    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] weird throw', 'a string error', {
      cartId: 'cart_1',
    })
    expect(captureMessage).toHaveBeenCalledWith('[test] weird throw', {
      level: 'error',
      extra: { thrown: 'a string error', cartId: 'cart_1' },
    })
    expect(captureException).not.toHaveBeenCalled()
  })

  it('captures context-only calls (no error) via captureMessage with context as extras', () => {
    logError('[test] verification failed', undefined, { transmissionId: 'tx_1' })

    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] verification failed', {
      transmissionId: 'tx_1',
    })
    expect(captureMessage).toHaveBeenCalledWith('[test] verification failed', {
      level: 'error',
      extra: { transmissionId: 'tx_1' },
    })
  })

  it('never throws when Sentry capture fails, and still console.errors', () => {
    captureException.mockImplementation(() => {
      throw new Error('sentry is down')
    })
    captureMessage.mockImplementation(() => {
      throw new Error('sentry is down')
    })

    expect(() => logError('[test] with error', new Error('boom'))).not.toThrow()
    expect(() => logError('[test] message only')).not.toThrow()
    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] with error', expect.any(Error))
    expect(consoleErrorSpy).toHaveBeenCalledWith('[test] message only')
  })
})

describe('logWarn', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    captureException.mockReset()
    captureMessage.mockReset()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('console.warns and captures at warning level', () => {
    logWarn('[test] payment denied', undefined, { cartId: 'cart_1' })

    expect(consoleWarnSpy).toHaveBeenCalledWith('[test] payment denied', { cartId: 'cart_1' })
    expect(captureMessage).toHaveBeenCalledWith('[test] payment denied', {
      level: 'warning',
      extra: { cartId: 'cart_1' },
    })
  })

  it('routes a real Error to captureException at warning level', () => {
    const err = new Error('denied')
    logWarn('[test] warn with error', err)

    expect(consoleWarnSpy).toHaveBeenCalledWith('[test] warn with error', err)
    expect(captureException).toHaveBeenCalledWith(err, {
      level: 'warning',
      extra: { logMessage: '[test] warn with error' },
    })
  })
})
