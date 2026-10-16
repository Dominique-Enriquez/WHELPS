export function environmentAdminTargets(email, environment = process.env) {
  const configuredEmail = environment.WHELPS_ADMIN_EMAIL?.trim().toLowerCase()
  return Boolean(configuredEmail) && email.trim().toLowerCase() === configuredEmail
}

export function readEnvironmentAdmin(environment = process.env) {
  const name = environment.WHELPS_ADMIN_NAME?.trim()
  const email = environment.WHELPS_ADMIN_EMAIL?.trim().toLowerCase()
  const password = environment.WHELPS_ADMIN_PASSWORD
  if (!name && !email && !password) return null
  return { name, email, password }
}
