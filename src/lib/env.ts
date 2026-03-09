export function getEnv(name: string) {
  return process.env[name];
}

export function hasAiConfig() {
  return Boolean(getEnv("OPENAI_API_KEY"));
}
