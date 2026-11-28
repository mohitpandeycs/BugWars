function safeRegex(pattern) {
  try {
    return new RegExp(pattern, 's')
  } catch {
    return null
  }
}

export function createPendingTests(testSpecs = []) {
  return testSpecs.map((test) => ({
    id: test.id,
    name: test.name,
    passed: false,
  }))
}

function runRule(testSpec, code) {
  const requiredRules = Array.isArray(testSpec.required) ? testSpec.required : []
  const forbiddenRules = Array.isArray(testSpec.forbidden) ? testSpec.forbidden : []

  const requiredOk = requiredRules.every((pattern) => {
    const regex = safeRegex(pattern)
    return regex ? regex.test(code) : false
  })

  const forbiddenOk = forbiddenRules.every((pattern) => {
    const regex = safeRegex(pattern)
    return regex ? !regex.test(code) : true
  })

  return requiredOk && forbiddenOk
}

export function evaluateTaskTests(code, testSpecs = []) {
  if (typeof code !== 'string') {
    return createPendingTests(testSpecs)
  }

  return testSpecs.map((test) => ({
    id: test.id,
    name: test.name,
    passed: runRule(test, code),
  }))
}
