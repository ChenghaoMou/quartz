import type { QuartzEmitterPlugin } from "@quartz-community/types"

interface Options {
  enableCaseRedirects: boolean
}

export declare const AliasRedirects: QuartzEmitterPlugin<Partial<Options>>
