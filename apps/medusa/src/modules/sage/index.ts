import { Module } from '@medusajs/framework/utils'
import { SageService } from './service'

export const SAGE_MODULE = 'sageModule'

export default Module(SAGE_MODULE, {
  service: SageService,
})
