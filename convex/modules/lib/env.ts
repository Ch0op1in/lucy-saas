export type EnvCtx = {
  env?: {
    get(name: string): string | undefined
  }
}

export const resolveOpenAiKey = (ctx: EnvCtx) => {
  const fromDeployment = ctx.env?.get?.('OPENAI_API_KEY')
  if (fromDeployment) {
    return fromDeployment
  }

  const fromProcess =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.OPENAI_API_KEY

  if (fromProcess) {
    console.warn('[notifications] OPENAI_API_KEY lu via process.env (fallback local)')
    return fromProcess
  }

  return null
}


