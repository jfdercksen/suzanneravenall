import { Module } from '@medusajs/framework/utils'
import { VtigerService } from './service'

export const VTIGER_MODULE = 'vtigerModule'

export default Module(VTIGER_MODULE, {
  service: VtigerService,
})

// Re-export public types and the service class for use by other modules
export { VtigerService } from './service'
export type {
  VtigerContact,
  VtigerActivity,
  PipelineStage,
} from './types'
