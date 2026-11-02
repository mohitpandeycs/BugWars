// TEMPORARY mock — real backend will actually execute the code server-side
// and return real pass/fail results based on running the code, not text
// matching. This naive version only checks if certain patterns/strings
// exist in the code — it can be tricked (e.g., typing the expected pattern
// inside a comment instead of real logic). Fine for testing UI flow now,
// must be replaced before any real evaluation is needed.
export function evaluateTests(code, tests) {
    if (typeof code !== 'string' || !Array.isArray(tests)) {
        console.warn('evaluateTests: invalid arguments', { code, tests })
        return Array.isArray(tests) ? tests : []
    }

    return tests.map((test) => {
        if (typeof test.checkFn !== 'function') {
            console.warn(`evaluateTests: test "${test.id}" has no checkFn — leaving unchanged`)
            return test
        }

        try {
            return { ...test, passed: test.checkFn(code) }
        } catch (err) {
            console.error(`evaluateTests: checkFn for test "${test.id}" threw an error`, err)
            return { ...test, passed: false }
        }
    })
}
