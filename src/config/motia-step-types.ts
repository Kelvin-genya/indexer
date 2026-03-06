// Local Motia step type helpers to work around RC type incompatibilities.
// Motia v1.0.0-rc.26 types don't match runtime API for queue/cron steps.
// These provide correct typing until Motia stable release.

export interface QueueStepConfig {
  name: string
  triggers: Array<{ type: 'queue'; subscribes: string[] }>
  enqueues?: string[]
  flows: string[]
}

export interface CronStepConfig {
  name: string
  triggers: Array<{ type: 'cron'; expression: string }>
  enqueues?: string[]
  flows: string[]
}

export interface StepState {
  get(params: { group: string; key: string }): Promise<{ value: any } | null>
  set(params: { group: string; key: string; value: any }): Promise<void>
  delete(params: { group: string; key: string }): Promise<void>
  getGroup(params: { group: string }): Promise<Array<{ key: string; value: any }>>
}

export interface EnqueueFn {
  (params: { topic: string; data: any }): Promise<void>
}

export interface StepLogger {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

export interface QueueHandlerInput {
  data: Record<string, any>
}

export interface FlowContext {
  state: StepState
  enqueue: EnqueueFn
  logger: StepLogger
}

export type QueueStepHandler = (input: QueueHandlerInput, ctx: FlowContext) => Promise<void>
export type CronStepHandler = (input: unknown, ctx: FlowContext) => Promise<void>
