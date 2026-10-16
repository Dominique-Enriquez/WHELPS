import test from 'node:test'
import assert from 'node:assert/strict'
import { environmentAdminTargets, readEnvironmentAdmin } from '../src/server/environmentAdminConfig.ts'

test('partial administrator configuration never targets adopter accounts', () => {
  const partial = { WHELPS_ADMIN_NAME: 'Whelps Administrator' }
  assert.equal(environmentAdminTargets('member@example.com', partial), false)
  assert.deepEqual(readEnvironmentAdmin(partial), {
    name: 'Whelps Administrator', email: undefined, password: undefined
  })
})

test('administrator validation applies only to the configured email', () => {
  const configured = {
    WHELPS_ADMIN_NAME: 'Whelps Administrator',
    WHELPS_ADMIN_EMAIL: ' Admin@Example.com ',
    WHELPS_ADMIN_PASSWORD: 'long-secure-password'
  }
  assert.equal(environmentAdminTargets('member@example.com', configured), false)
  assert.equal(environmentAdminTargets('ADMIN@example.com', configured), true)
  assert.equal(readEnvironmentAdmin(configured).email, 'admin@example.com')
})

test('missing administrator configuration is optional for adopter login', () => {
  assert.equal(environmentAdminTargets('member@example.com', {}), false)
  assert.equal(readEnvironmentAdmin({}), null)
})
