import { DEFAULT_CATEGORY } from '../constants/gameConfig'

// TEMPORARY mock — real backend will send actual per-category code/bugs/tests.
// Currently returns the same Counter class regardless of category, since
// only one mock task exists. The category parameter is accepted now so
// GameRound.jsx's interface doesn't need to change once real per-category
// data exists.
export function getFakeRoundData(category) {
    const resolvedCategory = category?.trim() ? category : DEFAULT_CATEGORY

    return {
        category: resolvedCategory,
        code: `class Counter:
    def __init__(self):
        self.count = 0
    def increment(self):
        self.count += 1
        return self.count
    def decrement(self):
        # TODO: Fix this — should subtract, not add
        self.count += 1
        return self.count
    def reset(self):
        pass  # TODO: reset count to 0`,
        tests: [
            {
                id: 'test1',
                name: 'increment works',
                passed: false,
                checkFn: (c) => /def increment.*self\.count\s*=\s*self\.count\s*\+\s*1|def increment.*self\.count\s*\+=\s*1/s.test(c),
            },
            {
                id: 'test2',
                name: 'decrement works',
                passed: false,
                checkFn: (c) => /def decrement.*self\.count\s*=\s*self\.count\s*-\s*1|def decrement.*self\.count\s*-=\s*1/s.test(c),
            },
            {
                id: 'test3',
                name: 'reset works',
                passed: false,
                checkFn: (c) => /def reset.*self\.count\s*=\s*0/s.test(c),
            },
        ],
    }
}