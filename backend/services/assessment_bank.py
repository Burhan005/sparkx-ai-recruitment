"""
(S) Assessment Bank Service - Comprehensive 4-Category Technical Question Repository
Contains job-calibrated, multi-language question pools across:
1. Technical (MCQs & Concepts)
2. Scenario (Real-World Architecture & Problem Solving)
3. Hands-on (Practical Coding in Python, JS, Java, C++, TS)
4. Troubleshooting (Live Code Debugging & Bug-Fixing)
"""
from typing import Dict, List, Any, Optional
import random

# ─────────────────────────────────────────────────────────────────────────────
# 1. TECHNICAL MCQs & CONCEPTUAL QUESTIONS
# ─────────────────────────────────────────────────────────────────────────────
TECHNICAL_MCQS: List[Dict[str, Any]] = [
    # Python & Backend
    {
        "id": "mcq-py-gil",
        "category": "technical",
        "skills": ["python", "backend", "concurrency", "fastapi"],
        "difficulty": "Mid-Level",
        "question": "In standard CPython, how does the Global Interpreter Lock (GIL) affect multithreaded performance?",
        "options": {
            "A": "It enables full parallel CPU execution across multiple physical cores using threading.Thread.",
            "B": "It prevents multiple native threads from executing Python bytecode simultaneously, making threading effective for I/O-bound tasks but not CPU-bound tasks.",
            "C": "It automatically converts recursive function calls into iterative loops to prevent stack overflows.",
            "D": "It forces all database connections to serialize onto a single shared socket connection."
        },
        "correct_option": "B",
        "explanation": "CPython's GIL ensures thread safety by allowing only one native thread to execute Python bytecode at a time. It excels at concurrent I/O waits, while CPU-bound parallel workloads require multiprocessing or native C extensions."
    },
    {
        "id": "mcq-py-generators",
        "category": "technical",
        "skills": ["python", "backend", "performance"],
        "difficulty": "Mid-Level",
        "question": "Why is using a generator expression or 'yield' preferred over list comprehensions when streaming 10 million database rows?",
        "options": {
            "A": "Generators compress the data using gzip before storing it in memory.",
            "B": "Generators evaluate lazily on-demand, consuming O(1) memory instead of allocating memory for all 10 million objects up-front.",
            "C": "Generators bypass Python's type checking system for faster execution.",
            "D": "Generators automatically distribute database rows across multiple GPU tensor cores."
        },
        "correct_option": "B",
        "explanation": "Generators produce items one at a time on-demand via the iterator protocol, maintaining minimal memory overhead (O(1)) rather than allocating space for the entire collection."
    },
    {
        "id": "mcq-sql-indexing",
        "category": "technical",
        "skills": ["sql", "database", "postgresql", "backend"],
        "difficulty": "Mid-Level",
        "question": "Given a composite B-Tree index on (company_id, created_at, status), which of the following queries CANNOT efficiently utilize this index?",
        "options": {
            "A": "SELECT * FROM jobs WHERE company_id = 'c1' AND created_at >= '2026-01-01'",
            "B": "SELECT * FROM jobs WHERE company_id = 'c1' AND status = 'Active'",
            "C": "SELECT * FROM jobs WHERE created_at >= '2026-01-01' AND status = 'Active'",
            "D": "SELECT * FROM jobs WHERE company_id = 'c1' AND created_at = '2026-02-01' AND status = 'Active'"
        },
        "correct_option": "C",
        "explanation": "B-Tree composite indexes follow the leftmost prefix rule. A query filtering only on created_at and status without specifying the leading column (company_id) cannot use the composite index efficiently."
    },
    {
        "id": "mcq-db-acid",
        "category": "technical",
        "skills": ["sql", "database", "system design", "backend"],
        "difficulty": "Senior",
        "question": "Under PostgreSQL's default READ COMMITTED transaction isolation level, which phenomenon is prevented, and which can still occur?",
        "options": {
            "A": "Dirty reads are prevented; non-repeatable reads and phantom reads can still occur.",
            "B": "All anomalies including phantom reads are completely eliminated.",
            "C": "Dirty reads and non-repeatable reads are both prevented; only serialization anomalies occur.",
            "D": "No anomalies are prevented without an explicit table-level lock."
        },
        "correct_option": "A",
        "explanation": "READ COMMITTED guarantees that any data read was committed prior to the query start (no dirty reads). However, concurrent commits can cause subsequent SELECTs in the same transaction to see newly committed rows (non-repeatable or phantom reads)."
    },

    # React & Frontend
    {
        "id": "mcq-react-reconciliation",
        "category": "technical",
        "skills": ["react", "frontend", "javascript", "typescript"],
        "difficulty": "Mid-Level",
        "question": "What is the primary danger of using array indices as 'key' props in dynamic React lists that support reordering or item deletion?",
        "options": {
            "A": "React will throw an uncaught runtime syntax exception during compilation.",
            "B": "Component internal state (like input focus or form state) will be incorrectly mapped to adjacent items, causing subtle visual and data bugs.",
            "C": "It disables browser CSS grid rendering completely.",
            "D": "It forces React to bypass the Virtual DOM and directly manipulate the DOM synchronously."
        },
        "correct_option": "B",
        "explanation": "React's reconciliation algorithm uses 'key' to identify which items have changed, been added, or removed. Index keys mutate when items are inserted or deleted, causing React to associate existing subtrees and local state with the wrong data item."
    },
    {
        "id": "mcq-react-hooks",
        "category": "technical",
        "skills": ["react", "frontend", "javascript", "typescript"],
        "difficulty": "Mid-Level",
        "question": "In React 18, what causes a 'stale closure' inside a useEffect or useCallback hook?",
        "options": {
            "A": "Running React in StrictMode during development.",
            "B": "Omitting a mutable state variable or prop from the hook's dependency array, causing the hook function to capture older values from previous render scopes.",
            "C": "Using TypeScript interfaces instead of types.",
            "D": "Calling setState inside an event handler instead of inside requestAnimationFrame."
        },
        "correct_option": "B",
        "explanation": "JavaScript closures capture variable references from the scope in which they were created. If dependencies aren't declared, the callback retains the variables from the initial render and never sees updated values."
    },
    {
        "id": "mcq-web-perf",
        "category": "technical",
        "skills": ["react", "frontend", "performance", "javascript"],
        "difficulty": "Mid-Level",
        "question": "Which of the following practices most effectively reduces Cumulative Layout Shift (CLS) on a rich dashboard?",
        "options": {
            "A": "Loading all CSS stylesheets asynchronously using JavaScript eval.",
            "B": "Reserving aspect-ratio bounding boxes or explicit width/height dimensions for dynamic images, video containers, and ad slots.",
            "C": "Converting all SVG icons into high-resolution uncompressed BMP files.",
            "D": "Rendering the entire page inside an HTML5 iframe with zero margins."
        },
        "correct_option": "B",
        "explanation": "CLS measures unexpected layout shifts. Reserving exact dimensions or aspect ratios ensures the browser reserves the layout geometry before assets or asynchronous streams finish loading."
    },

    # Systems, Cloud & Concurrency
    {
        "id": "mcq-api-idempotency",
        "category": "technical",
        "skills": ["api", "system design", "backend", "cloud"],
        "difficulty": "Mid-Level",
        "question": "In financial or recruitment payment APIs, what is the purpose of an 'Idempotency-Key' HTTP header in POST requests?",
        "options": {
            "A": "To encrypt the request payload using AES-256 before transmission.",
            "B": "To ensure that if a client retries a timed-out network request, the server executes the mutation exactly once and returns the cached result without duplicate processing.",
            "C": "To authenticate the user without requiring a bearer token or session cookie.",
            "D": "To force the API gateway to compress the HTTP response using brotli."
        },
        "correct_option": "B",
        "explanation": "An idempotency key allows clients to safely retry requests without fear of accidentally processing the same operation twice (e.g. charging a card or submitting double applications)."
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. SCENARIO ENGINEERING QUESTIONS (Real-World Architecture & Systems)
# ─────────────────────────────────────────────────────────────────────────────
SCENARIO_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "sc-db-exhaustion",
        "category": "scenario",
        "skills": ["backend", "database", "python", "system design", "postgresql"],
        "difficulty": "Senior",
        "title": "Database Connection Pool Exhaustion under Peak Traffic",
        "prompt": "During a massive hiring campaign, candidate traffic spikes 10x. Your API latency jumps from 45ms to 3.8s, and logs show 'FATAL: remaining connection slots are reserved for non-replication superuser connections' and 'QueuePool limit of size 20 overflow 10 reached'. Describe how you diagnose the root cause immediately, implement an emergency mitigation, and architect a long-term resilient solution.",
        "rubric_keywords": ["connection pooling", "pgbouncer", "slow query", "transaction duration", "read replica", "timeout", "circuit breaker"],
        "guidance": "Focus on connection lifecycle, pool sizing vs CPU cores, separating read vs write traffic, and tuning transaction scopes."
    },
    {
        "id": "sc-cache-stampede",
        "category": "scenario",
        "skills": ["backend", "system design", "algorithms", "cloud"],
        "difficulty": "Mid-Level",
        "title": "Mitigating Cache Stampede on Job Catalog Endpoints",
        "prompt": "Your popular job listings cache in Redis expires simultaneously every 15 minutes. When it expires, 15,000 concurrent candidate requests miss the cache at the exact same millisecond and bombard the underlying PostgreSQL database, threatening a complete outage. Explain at least two distinct architectural patterns you would implement to prevent this 'thundering herd' phenomenon.",
        "rubric_keywords": ["probabilistic early expiration", "xfetch", "mutex", "distributed lock", "background refresh", "stale-while-revalidate", "jitter"],
        "guidance": "Address jittered TTLs, stale-while-revalidate with background workers, or distributed lock / single-flight patterns."
    },
    {
        "id": "sc-realtime-proctor",
        "category": "scenario",
        "skills": ["react", "frontend", "webrtc", "javascript", "performance"],
        "difficulty": "Senior",
        "title": "Handling Packet Loss & Jitter in Live Video Proctored Assessments",
        "prompt": "Candidates in remote regions take live AI video interviews on unstable 4G networks experiencing 20% UDP packet loss, variable latency, and occasional tab switches. How would you architect the client-side telemetry and video transport to ensure proctoring integrity events are guaranteed to reach the server without dropping data or freezing the candidate's browser thread?",
        "rubric_keywords": ["indexeddb", "offline queue", "service worker", "retry with backoff", "webrtc data channel", "bandwidth adaptation", "web worker"],
        "guidance": "Cover local offline persistence (IndexedDB), worker threads to decouple video processing from UI, and guaranteed delivery protocols for integrity events."
    },
    {
        "id": "sc-microservice-migration",
        "category": "scenario",
        "skills": ["backend", "system design", "cloud", "devops"],
        "difficulty": "Senior",
        "title": "Zero-Downtime Data Migration for Job Applications Table",
        "prompt": "You need to migrate the 'applications' table (50 million rows) to a new schema that supports multi-tenant sharding and encrypted candidate resumes without taking the platform offline. Detail your deployment strategy, data migration pipeline, and rollback mechanisms.",
        "rubric_keywords": ["strangler fig", "dual-write", "shadow read", "feature flag", "backfill", "cdc", "reconciliation script", "zero downtime"],
        "guidance": "Explain dual-write phase, background historical backfill, shadow verification/reconciliation, and atomic cutover with feature flags."
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. HANDS-ON CODING CHALLENGES (Multi-Language: Python, JS, Java, C++, TS)
# ─────────────────────────────────────────────────────────────────────────────
HANDS_ON_CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": "hands-telemetry-debounce",
        "category": "hands_on",
        "title": "Real-time Telemetry Event Aggregator & Debounce",
        "difficulty": "Mid-Level",
        "skills": ["algorithms", "backend", "frontend", "python", "javascript"],
        "instructions": (
            "Implement a telemetry event aggregator that collapses consecutive duplicate suspicious events "
            "(e.g., candidate switching tabs or looking away) occurring within a window of 3000ms.\n\n"
            "Input: A list/array of events where each event has:\n"
            "  - type (string)\n"
            "  - timestamp (integer in milliseconds)\n\n"
            "Output: A list/array of aggregated events where consecutive events with the SAME type within 3000ms "
            "of the previous event are combined into one event with an added/incremented 'count' property. "
            "Events of different types or separated by > 3000ms must start a new entry."
        ),
        "supported_languages": ["python", "javascript", "java", "cpp", "typescript"],
        "starter_code": {
            "python": (
                "# Implement aggregate_events(events)\n"
                "# events: list of dicts [{'type': str, 'timestamp': int}]\n"
                "# Return list of aggregated events with 'count' field\n\n"
                "def aggregate_events(events):\n"
                "    if not events:\n"
                "        return []\n"
                "    result = []\n"
                "    # Write your implementation here\n"
                "    for ev in events:\n"
                "        if not result or result[-1]['type'] != ev['type'] or (ev['timestamp'] - result[-1]['timestamp']) > 3000:\n"
                "            result.append({'type': ev['type'], 'timestamp': ev['timestamp'], 'count': 1})\n"
                "        else:\n"
                "            result[-1]['count'] += 1\n"
                "    return result\n"
            ),
            "javascript": (
                "// Implement aggregateEvents(events)\n"
                "// events: array of { type: string, timestamp: number }\n"
                "// Return array of aggregated events with 'count' field\n\n"
                "function aggregateEvents(events) {\n"
                "  if (!events || events.length === 0) return [];\n"
                "  const result = [];\n"
                "  for (const ev of events) {\n"
                "    const last = result[result.length - 1];\n"
                "    if (!last || last.type !== ev.type || (ev.timestamp - last.timestamp) > 3000) {\n"
                "      result.push({ type: ev.type, timestamp: ev.timestamp, count: 1 });\n"
                "    } else {\n"
                "      last.count += 1;\n"
                "    }\n"
                "  }\n"
                "  return result;\n"
                "}\n"
            ),
            "typescript": (
                "interface TelemetryEvent {\n"
                "  type: string;\n"
                "  timestamp: number;\n"
                "  count?: number;\n"
                "}\n\n"
                "function aggregateEvents(events: TelemetryEvent[]): TelemetryEvent[] {\n"
                "  if (!events || events.length === 0) return [];\n"
                "  const result: TelemetryEvent[] = [];\n"
                "  for (const ev of events) {\n"
                "    const last = result[result.length - 1];\n"
                "    if (!last || last.type !== ev.type || (ev.timestamp - last.timestamp) > 3000) {\n"
                "      result.push({ type: ev.type, timestamp: ev.timestamp, count: 1 });\n"
                "    } else {\n"
                "      last.count = (last.count || 1) + 1;\n"
                "    }\n"
                "  }\n"
                "  return result;\n"
                "}\n"
            ),
            "java": (
                "import java.util.*;\n\n"
                "public class Solution {\n"
                "    public static class Event {\n"
                "        public String type;\n"
                "        public long timestamp;\n"
                "        public int count;\n"
                "        public Event(String t, long ts, int c) { type = t; timestamp = ts; count = c; }\n"
                "    }\n\n"
                "    public static List<Event> aggregateEvents(List<Event> events) {\n"
                "        List<Event> result = new ArrayList<>();\n"
                "        if (events == null || events.isEmpty()) return result;\n"
                "        for (Event ev : events) {\n"
                "            if (result.isEmpty()) {\n"
                "                result.add(new Event(ev.type, ev.timestamp, 1));\n"
                "            } else {\n"
                "                Event last = result.get(result.size() - 1);\n"
                "                if (!last.type.equals(ev.type) || (ev.timestamp - last.timestamp) > 3000) {\n"
                "                    result.add(new Event(ev.type, ev.timestamp, 1));\n"
                "                } else {\n"
                "                    last.count += 1;\n"
                "                }\n"
                "            }\n"
                "        }\n"
                "        return result;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <iostream>\n"
                "#include <vector>\n"
                "#include <string>\n\n"
                "struct Event {\n"
                "    std::string type;\n"
                "    long long timestamp;\n"
                "    int count;\n"
                "};\n\n"
                "std::vector<Event> aggregateEvents(const std::vector<Event>& events) {\n"
                "    std::vector<Event> result;\n"
                "    if (events.empty()) return result;\n"
                "    for (const auto& ev : events) {\n"
                "        if (result.empty() || result.back().type != ev.type || (ev.timestamp - result.back().timestamp) > 3000) {\n"
                "            result.push_back({ev.type, ev.timestamp, 1});\n"
                "        } else {\n"
                "            result.back().count += 1;\n"
                "        }\n"
                "    }\n"
                "    return result;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Debounce consecutive identical events (<3000ms)",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'TAB_SWITCH', timestamp: 2500}]",
                "expected": "1 event with count=2 at timestamp 1000"
            },
            {
                "name": "Separate events exceeding debounce window (>3000ms)",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'TAB_SWITCH', timestamp: 5000}]",
                "expected": "2 distinct events with count=1 each"
            },
            {
                "name": "Alternate different event types sequentially",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'FACE_LOST', timestamp: 1500}]",
                "expected": "2 distinct events with count=1 each (different types)"
            }
        ]
    },
    {
        "id": "hands-token-bucket",
        "category": "hands_on",
        "title": "Token Bucket Rate Limiter with Burst Allowance",
        "difficulty": "Senior",
        "skills": ["algorithms", "system design", "backend", "python", "concurrency"],
        "instructions": (
            "Implement a TokenBucket rate limiter class.\n\n"
            "Requirements:\n"
            "- Constructor receives 'capacity' (max burst tokens) and 'refill_rate' (tokens added per second).\n"
            "- Method 'allow_request(tokens, current_time_sec)': returns True if sufficient tokens exist, "
            "deducts the tokens, and updates internal state. Returns False if insufficient tokens.\n"
            "- Tokens refill smoothly according to elapsed time since last refill, capped at capacity."
        ),
        "supported_languages": ["python", "javascript", "java", "cpp", "typescript"],
        "starter_code": {
            "python": (
                "class TokenBucket:\n"
                "    def __init__(self, capacity: float, refill_rate: float):\n"
                "        self.capacity = float(capacity)\n"
                "        self.refill_rate = float(refill_rate)\n"
                "        self.tokens = float(capacity)\n"
                "        self.last_timestamp = 0.0\n\n"
                "    def allow_request(self, tokens: float, current_time: float) -> bool:\n"
                "        # Calculate refilled tokens based on elapsed time\n"
                "        elapsed = max(0.0, current_time - self.last_timestamp)\n"
                "        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)\n"
                "        self.last_timestamp = current_time\n"
                "        if self.tokens >= tokens:\n"
                "            self.tokens -= tokens\n"
                "            return True\n"
                "        return False\n"
            ),
            "javascript": (
                "class TokenBucket {\n"
                "  constructor(capacity, refillRate) {\n"
                "    this.capacity = capacity;\n"
                "    this.refillRate = refillRate;\n"
                "    this.tokens = capacity;\n"
                "    this.lastTimestamp = 0;\n"
                "  }\n\n"
                "  allowRequest(tokens, currentTime) {\n"
                "    const elapsed = Math.max(0, currentTime - this.lastTimestamp);\n"
                "    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "    this.lastTimestamp = currentTime;\n"
                "    if (this.tokens >= tokens) {\n"
                "      this.tokens -= tokens;\n"
                "      return true;\n"
                "    }\n"
                "    return false;\n"
                "  }\n"
                "}\n"
            ),
            "typescript": (
                "class TokenBucket {\n"
                "  private capacity: number;\n"
                "  private refillRate: number;\n"
                "  private tokens: number;\n"
                "  private lastTimestamp: number;\n\n"
                "  constructor(capacity: number, refillRate: number) {\n"
                "    this.capacity = capacity;\n"
                "    this.refillRate = refillRate;\n"
                "    this.tokens = capacity;\n"
                "    this.lastTimestamp = 0;\n"
                "  }\n\n"
                "  allowRequest(tokens: number, currentTime: number): boolean {\n"
                "    const elapsed = Math.max(0, currentTime - this.lastTimestamp);\n"
                "    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "    this.lastTimestamp = currentTime;\n"
                "    if (this.tokens >= tokens) {\n"
                "      this.tokens -= tokens;\n"
                "      return true;\n"
                "    }\n"
                "    return false;\n"
                "  }\n"
                "}\n"
            ),
            "java": (
                "public class TokenBucket {\n"
                "    private double capacity;\n"
                "    private double refillRate;\n"
                "    private double tokens;\n"
                "    private double lastTimestamp;\n\n"
                "    public TokenBucket(double capacity, double refillRate) {\n"
                "        this.capacity = capacity;\n"
                "        this.refillRate = refillRate;\n"
                "        this.tokens = capacity;\n"
                "        this.lastTimestamp = 0.0;\n"
                "    }\n\n"
                "    public boolean allowRequest(double tokensNeeded, double currentTime) {\n"
                "        double elapsed = Math.max(0.0, currentTime - this.lastTimestamp);\n"
                "        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "        this.lastTimestamp = currentTime;\n"
                "        if (this.tokens >= tokensNeeded) {\n"
                "            this.tokens -= tokensNeeded;\n"
                "            return true;\n"
                "        }\n"
                "        return false;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <algorithm>\n\n"
                "class TokenBucket {\n"
                "private:\n"
                "    double capacity;\n"
                "    double refillRate;\n"
                "    double tokens;\n"
                "    double lastTimestamp;\n"
                "public:\n"
                "    TokenBucket(double cap, double rate) : capacity(cap), refillRate(rate), tokens(cap), lastTimestamp(0.0) {}\n"
                "    bool allowRequest(double tokensNeeded, double currentTime) {\n"
                "        double elapsed = std::max(0.0, currentTime - lastTimestamp);\n"
                "        tokens = std::min(capacity, tokens + elapsed * refillRate);\n"
                "        lastTimestamp = currentTime;\n"
                "        if (tokens >= tokensNeeded) {\n"
                "            tokens -= tokensNeeded;\n"
                "            return true;\n"
                "        }\n"
                "        return false;\n"
                "    }\n"
                "};\n"
            )
        },
        "test_cases": [
            {
                "name": "Allow burst requests up to capacity",
                "input": "Bucket(capacity=5, rate=1), requests at t=0 for 3, 2, 1 tokens",
                "expected": "True, True, False (exhausted capacity)"
            },
            {
                "name": "Refill tokens over elapsed time",
                "input": "Bucket exhausted at t=0, request 2 tokens at t=2.0s with rate=1",
                "expected": "True (refilled 2 tokens)"
            },
            {
                "name": "Cap tokens strictly at maximum capacity",
                "input": "Bucket idle for 100s with capacity=5",
                "expected": "Tokens capped at 5.0"
            }
        ]
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 4. TROUBLESHOOTING & DEBUGGING CHALLENGES (Fix Real Buggy Code)
# ─────────────────────────────────────────────────────────────────────────────
TROUBLESHOOTING_CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": "trouble-race-condition",
        "category": "troubleshooting",
        "title": "Fix Concurrency Race Condition in Shared State Store",
        "difficulty": "Mid-Level",
        "skills": ["debugging", "concurrency", "python", "javascript", "backend"],
        "bug_description": (
            "The following function processes a stream of concurrent user score increments. "
            "Under concurrent operations, the current implementation experiences lost updates because it "
            "reads a stale reference without proper atomic aggregation. "
            "Fix the bug so that all increments are accurately tallied without dropping concurrent updates."
        ),
        "broken_code": {
            "python": (
                "# BUGGY IMPLEMENTATION:\n"
                "# When multiple updates arrive, items get lost or overwritten.\n"
                "def tally_scores(records):\n"
                "    totals = {}\n"
                "    for item in records:\n"
                "        # BUG: Missing safe default and drops previous total\n"
                "        user = item.get('user')\n"
                "        pts = item.get('points', 0)\n"
                "        totals[user] = pts # <-- BUG: overwriting instead of accumulating!\n"
                "    return totals\n"
            ),
            "javascript": (
                "// BUGGY IMPLEMENTATION:\n"
                "// When multiple updates arrive, items get overwritten.\n"
                "function tallyScores(records) {\n"
                "  const totals = {};\n"
                "  for (const item of records) {\n"
                "    // BUG: overwrites existing score instead of summing\n"
                "    totals[item.user] = item.points;\n"
                "  }\n"
                "  return totals;\n"
                "}\n"
            ),
            "typescript": (
                "interface ScoreRecord { user: string; points: number; }\n\n"
                "function tallyScores(records: ScoreRecord[]): Record<string, number> {\n"
                "  const totals: Record<string, number> = {};\n"
                "  for (const item of records) {\n"
                "    // BUG: overwrites instead of accumulating\n"
                "    totals[item.user] = item.points;\n"
                "  }\n"
                "  return totals;\n"
                "}\n"
            ),
            "java": (
                "import java.util.*;\n\n"
                "public class Solution {\n"
                "    public static Map<String, Integer> tallyScores(List<Map<String, Object>> records) {\n"
                "        Map<String, Integer> totals = new HashMap<>();\n"
                "        for (Map<String, Object> item : records) {\n"
                "            String user = (String) item.get(\"user\");\n"
                "            int pts = (int) item.get(\"points\");\n"
                "            totals.put(user, pts); // BUG: Overwriting instead of sum!\n"
                "        }\n"
                "        return totals;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <string>\n"
                "#include <vector>\n"
                "#include <map>\n\n"
                "struct Record { std::string user; int points; };\n\n"
                "std::map<std::string, int> tallyScores(const std::vector<Record>& records) {\n"
                "    std::map<std::string, int> totals;\n"
                "    for (const auto& item : records) {\n"
                "        totals[item.user] = item.points; // BUG: Overwrites previous accumulation\n"
                "    }\n"
                "    return totals;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Accumulate multiple score increments for the same candidate",
                "input": "[{user: 'Aarav', points: 10}, {user: 'Aarav', points: 25}]",
                "expected": "{'Aarav': 35}"
            },
            {
                "name": "Maintain independent totals across multiple distinct candidates",
                "input": "[{user: 'Aarav', points: 10}, {user: 'Priya', points: 40}, {user: 'Aarav', points: 5}]",
                "expected": "{'Aarav': 15, 'Priya': 40}"
            }
        ]
    },
    {
        "id": "trouble-sliding-window",
        "category": "troubleshooting",
        "title": "Fix Off-by-One Boundary Defect in Sliding Window Rate Limiter",
        "difficulty": "Mid-Level",
        "skills": ["debugging", "algorithms", "python", "javascript"],
        "bug_description": (
            "A sliding window filter is dropping events that occur exactly at the boundary limit of the window. "
            "Inspect the boundary comparison operator and fix the defect."
        ),
        "broken_code": {
            "python": (
                "# BUGGY IMPLEMENTATION:\n"
                "def is_within_window(current_ts, event_ts, window_size_ms=5000):\n"
                "    diff = current_ts - event_ts\n"
                "    # BUG: using '<' strictly drops events that occur exactly at boundary\n"
                "    return 0 < diff and diff < window_size_ms\n"
            ),
            "javascript": (
                "// BUGGY IMPLEMENTATION:\n"
                "function isWithinWindow(currentTs, eventTs, windowSizeMs = 5000) {\n"
                "  const diff = currentTs - eventTs;\n"
                "  // BUG: misses boundary at 0 and windowSizeMs\n"
                "  return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            ),
            "typescript": (
                "function isWithinWindow(currentTs: number, eventTs: number, windowSizeMs: number = 5000): boolean {\n"
                "  const diff = currentTs - eventTs;\n"
                "  return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            ),
            "java": (
                "public class Solution {\n"
                "    public static boolean isWithinWindow(long currentTs, long eventTs, long windowSizeMs) {\n"
                "        long diff = currentTs - eventTs;\n"
                "        return diff > 0 && diff < windowSizeMs;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "bool isWithinWindow(long long currentTs, long long eventTs, long long windowSizeMs = 5000) {\n"
                "    long long diff = currentTs - eventTs;\n"
                "    return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Include events with diff == 0 (simultaneous arrival)",
                "input": "current=5000, event=5000, window=5000",
                "expected": "True"
            },
            {
                "name": "Include events precisely on window boundary (diff == 5000)",
                "input": "current=10000, event=5000, window=5000",
                "expected": "True"
            },
            {
                "name": "Reject events outside window (diff == 5001)",
                "input": "current=10001, event=5000, window=5000",
                "expected": "False"
            }
        ]
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# ASSESSMENT GENERATOR & RANDOMIZER
# ─────────────────────────────────────────────────────────────────────────────
def generate_job_assessment_bundle(job_skills: List[str], languages: List[str] = None, seed_candidate_id: str = None) -> Dict[str, Any]:
    """
    Selects a randomized 4-category assessment bundle based on the job's skills and allowed languages.
    If seed_candidate_id is given, randomization is deterministic per candidate to maintain consistency.
    """
    rng = random.Random(seed_candidate_id) if seed_candidate_id else random.Random()
    normalized_skills = [s.strip().lower() for s in (job_skills or [])]

    # 1. Technical MCQs: Pick 3 questions matching job skills if possible, else sample from pool
    matching_mcqs = [
        q for q in TECHNICAL_MCQS 
        if any(s in normalized_skills or any(ms in s for ms in normalized_skills) for s in q["skills"])
    ]
    if len(matching_mcqs) < 3:
        remaining = [q for q in TECHNICAL_MCQS if q not in matching_mcqs]
        pool = matching_mcqs + remaining
    else:
        pool = matching_mcqs
    
    selected_mcqs = rng.sample(pool, min(3, len(pool)))

    # 2. Scenario Question: Pick 1 matching scenario
    matching_scenarios = [
        q for q in SCENARIO_QUESTIONS
        if any(s in normalized_skills for s in q["skills"])
    ] or SCENARIO_QUESTIONS
    selected_scenario = rng.choice(matching_scenarios)

    # 3. Hands-on Coding: Pick 1 challenge
    selected_hands_on = rng.choice(HANDS_ON_CHALLENGES)

    # 4. Troubleshooting: Pick 1 bug fix
    selected_trouble = rng.choice(TROUBLESHOOTING_CHALLENGES)

    allowed_langs = languages or ["javascript", "python", "typescript", "java", "cpp"]

    return {
        "technical_mcqs": [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "difficulty": q["difficulty"]
            }
            for q in selected_mcqs
        ],
        "scenario": {
            "id": selected_scenario["id"],
            "title": selected_scenario["title"],
            "prompt": selected_scenario["prompt"],
            "guidance": selected_scenario["guidance"],
            "difficulty": selected_scenario["difficulty"]
        },
        "hands_on": {
            "id": selected_hands_on["id"],
            "title": selected_hands_on["title"],
            "instructions": selected_hands_on["instructions"],
            "difficulty": selected_hands_on["difficulty"],
            "supported_languages": [l for l in selected_hands_on["supported_languages"] if l in [al.lower() for al in allowed_langs]] or ["javascript", "python"],
            "starter_code": selected_hands_on["starter_code"],
            "test_cases": selected_hands_on["test_cases"]
        },
        "troubleshooting": {
            "id": selected_trouble["id"],
            "title": selected_trouble["title"],
            "bug_description": selected_trouble["bug_description"],
            "difficulty": selected_trouble["difficulty"],
            "broken_code": selected_trouble["broken_code"],
            "test_cases": selected_trouble["test_cases"]
        }
    }
