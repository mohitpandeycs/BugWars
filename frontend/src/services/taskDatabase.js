import { DEFAULT_CATEGORY } from '../constants/gameConfig.js'

const CATEGORY_TASKS = {
  'Data Structures & Algorithms': [
    {
      id: 'dsa-r1-reverse-string',
      title: 'Fix reverse_string()',
      description: 'The function returns the original text instead of reversing it.',
      starterCode: `def reverse_string(text):
    # BUG: returns text unchanged
    return text
`,
      tests: [
        {
          id: 'reverse_slice',
          name: 'returns reversed text',
          required: ['return\\s+text\\s*\\[\\s*::-1\\s*\\]'],
        },
      ],
      sabotageActions: [
        {
          id: 'inject_infinite_loop',
          label: 'Inject Infinite Loop',
          description: 'Blocks execution inside reverse_string.',
          patches: [{ search: /return\s+text\s*\[\s*::-1\s*\]|return\s+text/m, replace: 'while True:\n        pass\n    return text' }],
        },
      ],
    },
    {
      id: 'dsa-r2-is-palindrome',
      title: 'Fix is_palindrome()',
      description: 'The function always returns False.',
      starterCode: `def is_palindrome(text):
    cleaned = ''.join(ch.lower() for ch in text if ch.isalnum())
    # BUG: ignores real comparison
    return False
`,
      tests: [
        {
          id: 'pal_compare',
          name: 'compares cleaned text with reverse',
          required: ['cleaned\\s*==\\s*cleaned\\s*\\[\\s*::-1\\s*\\]'],
        },
      ],
      sabotageActions: [
        {
          id: 'always_true',
          label: 'Always Return True',
          description: 'Makes every input look valid.',
          patches: [{ search: /return\s+cleaned\s*==\s*cleaned\s*\[\s*::-1\s*\]/m, replace: 'return True' }],
        },
      ],
    },
    {
      id: 'dsa-r3-find-max',
      title: 'Fix find_max()',
      description: 'Comparator picks minimum value instead of maximum.',
      starterCode: `def find_max(numbers):
    max_val = numbers[0]
    for num in numbers:
        # BUG: wrong comparator
        if num < max_val:
            max_val = num
    return max_val
`,
      tests: [
        {
          id: 'max_comparator',
          name: 'uses > comparator for max',
          required: ['if\\s+num\\s*>\\s*max_val'],
          forbidden: ['if\\s+num\\s*<\\s*max_val'],
        },
      ],
      sabotageActions: [
        {
          id: 'find_minimum',
          label: 'Find Minimum Instead',
          description: 'Flips max search back to min search.',
          patches: [{ search: /if\s+num\s*>\s*max_val/m, replace: 'if num < max_val' }],
        },
      ],
    },
    {
      id: 'dsa-r4-count-vowels',
      title: 'Fix count_vowels()',
      description: 'Uppercase vowels are ignored.',
      starterCode: `def count_vowels(text):
    vowels = 'aeiou'
    count = 0
    for ch in text:
        if ch in vowels:
            count += 1
    return count
`,
      tests: [
        {
          id: 'lower_input',
          name: 'normalizes case before counting',
          required: ['for\\s+ch\\s+in\\s+text\\.lower\\(\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'count_consonants',
          label: 'Count Consonants',
          description: 'Replaces vowel condition with consonant condition.',
          patches: [{ search: /if\s+ch\s+in\s+vowels/m, replace: "if ch.isalpha() and ch not in vowels" }],
        },
      ],
    },
  ],

  'Object-Oriented Programming': [
    {
      id: 'oop-r1-counter',
      title: 'Fix Counter.decrement()',
      description: 'decrement() increases count instead of decreasing.',
      starterCode: `class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        return self.count

    def decrement(self):
        # BUG
        self.count += 1
        return self.count
`,
      tests: [
        {
          id: 'decrement_subtracts',
          name: 'decrement subtracts by one',
          required: ['self\\.count\\s*-\\=\\s*1|self\\.count\\s*=\\s*self\\.count\\s*-\\s*1'],
        },
      ],
      sabotageActions: [
        {
          id: 'decrement_adds',
          label: 'Decrement Adds 1',
          description: 'Switches decrement back to increment behavior.',
          patches: [{ search: /self\.count\s*-=\s*1|self\.count\s*=\s*self\.count\s*-\s*1/m, replace: 'self.count += 1' }],
        },
      ],
    },
    {
      id: 'oop-r2-stack',
      title: 'Fix Stack.pop()',
      description: 'pop() currently removes from the front (FIFO).',
      starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        # BUG: FIFO behavior
        return self.items.pop(0)
`,
      tests: [
        {
          id: 'lifo_pop',
          name: 'uses LIFO pop()',
          required: ['return\\s+self\\.items\\.pop\\(\\)'],
          forbidden: ['pop\\(0\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'force_fifo',
          label: 'Force FIFO pop(0)',
          description: 'Corrupts LIFO behavior into queue behavior.',
          patches: [{ search: /return\s+self\.items\.pop\(\)/m, replace: 'return self.items.pop(0)' }],
        },
      ],
    },
    {
      id: 'oop-r3-bank-account',
      title: 'Fix BankAccount.withdraw()',
      description: 'withdraw() currently increases balance.',
      starterCode: `class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def withdraw(self, amount):
        # BUG: adds instead of subtracting
        self.balance += amount
        return self.balance
`,
      tests: [
        {
          id: 'withdraw_subtracts',
          name: 'withdraw subtracts amount',
          required: ['self\\.balance\\s*-\\=\\s*amount|self\\.balance\\s*=\\s*self\\.balance\\s*-\\s*amount'],
          forbidden: ['self\\.balance\\s*\\+=\\s*amount'],
        },
      ],
      sabotageActions: [
        {
          id: 'withdraw_adds_money',
          label: 'Withdraw Adds Money',
          description: 'Reverts withdrawal to a deposit bug.',
          patches: [{ search: /self\.balance\s*-=\s*amount|self\.balance\s*=\s*self\.balance\s*-\s*amount/m, replace: 'self.balance += amount' }],
        },
      ],
    },
    {
      id: 'oop-r4-todo-list',
      title: 'Fix TodoList.pending_count()',
      description: 'pending_count() counts completed items instead of pending items.',
      starterCode: `class TodoList:
    def __init__(self, items):
        self.items = items

    def pending_count(self):
        # BUG: counts done tasks
        return sum(1 for item in self.items if item.get('done'))
`,
      tests: [
        {
          id: 'pending_logic',
          name: 'counts tasks where done is false',
          required: ["not\\s+item\\.get\\('done'\\)"],
        },
      ],
      sabotageActions: [
        {
          id: 'invert_pending_check',
          label: 'Invert Pending Check',
          description: 'Switches pending logic back to completed logic.',
          patches: [{ search: /not\s+item\.get\('done'\)/m, replace: "item.get('done')" }],
        },
      ],
    },
  ],

  Security: [
    {
      id: 'sec-r1-sanitize-input',
      title: 'Fix sanitize_input()',
      description: 'Raw SQL-like input is returned without cleanup.',
      starterCode: `def sanitize_input(value):
    # BUG: no sanitization
    return value
`,
      tests: [
        {
          id: 'escape_quotes',
          name: 'escapes single quotes',
          required: ["replace\\('\\'',\\s*\"\\\\'\"\\)"],
        },
      ],
      sabotageActions: [
        {
          id: 'bypass_sanitizer',
          label: 'Bypass Sanitizer',
          description: 'Removes quote escaping.',
          patches: [{ search: /return\s+value\.replace\('\'',\s*"\\\\'"\)/m, replace: 'return value' }],
        },
      ],
    },
    {
      id: 'sec-r2-validate-password',
      title: 'Fix validate_password()',
      description: 'Weak passwords are accepted.',
      starterCode: `def validate_password(password):
    # BUG: too weak
    return len(password) >= 1
`,
      tests: [
        {
          id: 'strong_length',
          name: 'minimum length is at least 8',
          required: ['len\\(password\\)\\s*>=\\s*8'],
        },
        {
          id: 'has_digit',
          name: 'requires at least one digit',
          required: ['any\\(ch\\.isdigit\\(\\)\\s+for\\s+ch\\s+in\\s+password\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'allow_weak_passwords',
          label: 'Allow Weak Passwords',
          description: 'Lowers password requirement.',
          patches: [{ search: /len\(password\)\s*>=\s*8/m, replace: 'len(password) >= 1' }],
        },
      ],
    },
    {
      id: 'sec-r3-clean-html',
      title: 'Fix clean_html()',
      description: 'Script tags are not removed.',
      starterCode: `import re

def clean_html(html):
    # BUG: returns raw html
    return html
`,
      tests: [
        {
          id: 'removes_script_tags',
          name: 'removes script blocks',
          required: ['re\\.sub\\(r"<script\\.\\*\\?>\\.\\*\\?</script>"'],
        },
      ],
      sabotageActions: [
        {
          id: 'pass_raw_script_tags',
          label: 'Pass Raw Script Tags',
          description: 'Skips script sanitization.',
          patches: [{ search: /return\s+re\.sub\([^\n]+\)/m, replace: 'return html' }],
        },
      ],
    },
    {
      id: 'sec-r4-validate-token',
      title: 'Fix validate_token()',
      description: 'Bearer prefix is ignored.',
      starterCode: `def validate_token(auth_header):
    # BUG: accepts any non-empty value
    return bool(auth_header)
`,
      tests: [
        {
          id: 'requires_bearer_prefix',
          name: 'requires Bearer prefix',
          required: ['auth_header\\.startswith\\("Bearer\\s"\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'accept_any_token',
          label: 'Accept Any Token',
          description: 'Removes bearer validation.',
          patches: [{ search: /return\s+auth_header\.startswith\("Bearer\s"\)/m, replace: 'return bool(auth_header)' }],
        },
      ],
    },
  ],

  'Front-End': [
    {
      id: 'fe-r1-format-css-class',
      title: 'Fix format_css_class()',
      description: 'Empty class names are not filtered out.',
      starterCode: `def format_css_class(values):
    # BUG: keeps empty items
    return ' '.join(values)
`,
      tests: [
        {
          id: 'filters_empty_values',
          name: 'filters empty or blank entries',
          required: ['if\\s+item\\.strip\\(\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'keep_empty_strings',
          label: 'Keep Empty Strings',
          description: 'Removes empty value filtering.',
          patches: [{ search: /\[item\s+for\s+item\s+in\s+values\s+if\s+item\.strip\(\)\]/m, replace: 'values' }],
        },
      ],
    },
    {
      id: 'fe-r2-parse-query-params',
      title: 'Fix parse_query_params()',
      description: 'Always returns empty dict.',
      starterCode: `def parse_query_params(query):
    # BUG
    return {}
`,
      tests: [
        {
          id: 'parses_pairs',
          name: 'parses key/value pairs',
          required: ['for\\s+part\\s+in\\s+query\\.split\\("&"\\)'],
        },
      ],
      sabotageActions: [
        {
          id: 'return_empty_dict',
          label: 'Return Empty Dict',
          description: 'Clears parsed output.',
          patches: [{ search: /return\s+params/m, replace: 'return {}' }],
        },
      ],
    },
    {
      id: 'fe-r3-truncate-text',
      title: 'Fix truncate_text()',
      description: 'Truncation misses ellipsis.',
      starterCode: `def truncate_text(text, limit):
    if len(text) <= limit:
        return text
    # BUG: no ellipsis
    return text[:limit]
`,
      tests: [
        {
          id: 'adds_ellipsis',
          name: 'adds ellipsis when truncated',
          required: ['text\\[:\\s*limit\\s*-\\s*3\\]\\s*\\+\\s*"\\.\\.\\."'],
        },
      ],
      sabotageActions: [
        {
          id: 'omit_ellipsis',
          label: 'Omit Ellipsis',
          description: 'Reverts truncation back to hard cut.',
          patches: [{ search: /return\s+text\[:\s*limit\s*-\s*3\]\s*\+\s*"\.\.\."/m, replace: 'return text[:limit]' }],
        },
      ],
    },
    {
      id: 'fe-r4-rgb-to-hex',
      title: 'Fix rgb_to_hex()',
      description: 'Returns comma-joined string instead of hex color.',
      starterCode: `def rgb_to_hex(r, g, b):
    # BUG
    return f"{r},{g},{b}"
`,
      tests: [
        {
          id: 'returns_hex',
          name: 'returns #rrggbb format',
          required: ['f"#\\{r:02x\\}\\{g:02x\\}\\{b:02x\\}"'],
        },
      ],
      sabotageActions: [
        {
          id: 'return_comma_string',
          label: 'Return Comma String',
          description: 'Breaks hex formatting.',
          patches: [{ search: /f"#\{r:02x\}\{g:02x\}\{b:02x\}"/m, replace: 'f"{r},{g},{b}"' }],
        },
      ],
    },
  ],

  'Back-End': [
    {
      id: 'be-r1-rate-limit',
      title: 'Fix check_rate_limit()',
      description: 'Current implementation allows traffic over limit.',
      starterCode: `def check_rate_limit(current, limit):
    # BUG
    if current > limit:
        return True
    return True
`,
      tests: [
        {
          id: 'blocks_over_limit',
          name: 'returns False when current reaches limit',
          required: ['if\\s+current\\s*>?=\\s*limit:\\s*\\n\\s*return\\s+False'],
        },
      ],
      sabotageActions: [
        {
          id: 'disable_rate_limit',
          label: 'Disable Rate Limiting',
          description: 'Lets all requests pass.',
          patches: [{ search: /if\s+current\s*>?=\s*limit:\s*\n\s*return\s+False/m, replace: 'if current >= limit:\n        return True' }],
        },
      ],
    },
    {
      id: 'be-r2-format-response',
      title: 'Fix format_response()',
      description: "Response object misses 'success' key.",
      starterCode: `def format_response(data, status_code=200):
    # BUG: missing success
    return {"data": data, "status": status_code}
`,
      tests: [
        {
          id: 'includes_success_flag',
          name: 'includes success field',
          required: ['"success"'],
        },
      ],
      sabotageActions: [
        {
          id: 'omit_success_field',
          label: 'Omit Success Field',
          description: 'Removes success boolean from response.',
          patches: [{ search: /,\s*"success"\s*:\s*status_code\s*<\s*400/m, replace: '' }],
        },
      ],
    },
    {
      id: 'be-r3-extract-user-role',
      title: 'Fix extract_user_role()',
      description: 'Crashes with KeyError when role is missing.',
      starterCode: `def extract_user_role(payload):
    # BUG
    return payload['role']
`,
      tests: [
        {
          id: 'safe_default_role',
          name: 'uses default role when missing',
          required: ["payload\\.get\\('role',\\s*'guest'\\)"],
        },
      ],
      sabotageActions: [
        {
          id: 'force_direct_key',
          label: 'Force Direct Key Access',
          description: 'Restores risky key access.',
          patches: [{ search: /payload\.get\('role',\s*'guest'\)/m, replace: "payload['role']" }],
        },
      ],
    },
    {
      id: 'be-r4-invalidate-key',
      title: 'Fix invalidate_key()',
      description: 'Function returns None instead of boolean.',
      starterCode: `def invalidate_key(store, key):
    if key in store:
        del store[key]
        # BUG
        return None
    return None
`,
      tests: [
        {
          id: 'returns_boolean',
          name: 'returns True/False status',
          required: ['return\\s+True', 'return\\s+False'],
          forbidden: ['return\\s+None'],
        },
      ],
      sabotageActions: [
        {
          id: 'return_none_always',
          label: 'Return None Always',
          description: 'Breaks boolean contract.',
          patches: [
            { search: /return\s+True/m, replace: 'return None' },
            { search: /return\s+False/m, replace: 'return None' },
          ],
        },
      ],
    },
  ],
}

function normalizeRound(round) {
  const parsed = Number(round)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  if (parsed > 4) return 4
  return parsed
}

function normalizeCategory(category) {
  if (typeof category !== 'string') return DEFAULT_CATEGORY
  const found = Object.keys(CATEGORY_TASKS).find((name) => name.toLowerCase() === category.toLowerCase())
  return found || DEFAULT_CATEGORY
}

export function getRoundTask(category, round) {
  const safeCategory = normalizeCategory(category)
  const safeRound = normalizeRound(round)
  const list = CATEGORY_TASKS[safeCategory] || CATEGORY_TASKS[DEFAULT_CATEGORY]
  const task = list[safeRound - 1] || list[0]

  return {
    ...task,
    category: safeCategory,
    round: safeRound,
  }
}

function applyPatches(code, patches = []) {
  return patches.reduce((acc, patch) => {
    if (!patch?.search) return acc
    try {
      return acc.replace(patch.search, patch.replace ?? '')
    } catch {
      return acc
    }
  }, code)
}

export function applySabotage(task, actionId, code) {
  if (!task || typeof code !== 'string') return code
  const action = (task.sabotageActions || []).find((item) => item.id === actionId)
  if (!action) return code
  return applyPatches(code, action.patches)
}

export function getAllCategories() {
  return Object.keys(CATEGORY_TASKS)
}
