import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import PayFastPaymentProvider from './provider'

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayFastPaymentProvider],
})
