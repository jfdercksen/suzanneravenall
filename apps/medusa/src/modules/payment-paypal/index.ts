import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import PayPalPaymentProvider from './provider'

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayPalPaymentProvider],
})
