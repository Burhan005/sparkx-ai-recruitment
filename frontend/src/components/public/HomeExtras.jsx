import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Code2, Play, CheckCircle2, ShieldCheck, Cpu, 
  Brain, FileText, Briefcase, TrendingUp, Sparkles, MessageSquare,
  Award, Check, BarChart3, Target, Scale, CheckCircle, ArrowRight
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Home Page Enhancement Components
   - TypingTerminal: Multi-Language Candidate IDE + Business Case Simulator
   - TiltCard:       3D perspective tilt wrapper on mouse move
   - MagneticWrap:   Button wrapper that drifts toward cursor
   - GradientDivider: Subtle section separator
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Multi-Language Sandbox Scenarios with Real Code Demos ──────────────── */
const RUNTIME_SCENARIOS = [
  {
    id: 'python',
    name: 'Python',
    file: 'solution.py',
    badge: 'Isolated Subprocess',
    code: [
      { num: 1, text: 'def merge_intervals(intervals: list[list[int]]):' },
      { num: 2, text: '    intervals.sort(key=lambda x: x[0])' },
      { num: 3, text: '    merged = []' },
      { num: 4, text: '    for start, end in intervals:' },
      { num: 5, text: '        if not merged or merged[-1][1] < start:' },
      { num: 6, text: '            merged.append([start, end])' },
      { num: 7, text: '        else:' },
      { num: 8, text: '            merged[-1][1] = max(merged[-1][1], end)' },
      { num: 9, text: '    return merged' },
    ],
    lines: [
      { text: '$ python3 -m sparkx.runner --file solution.py', type: 'cmd', delay: 0 },
      { text: '  [INIT] Provisioning isolated Python sandbox...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Running 4 test vectors on merge_intervals...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Standard overlapping intervals   PASS 1.8ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Nested subset containment        PASS 1.2ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Disjoint sorted intervals        PASS 1.1ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Stress benchmark (n=100,000)     PASS 8.4ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Time: 12.5ms │ RAM: 14.2MB', type: 'result', delay: 2900 },
      { text: '  Integrity: Proctor Audio Verified │ Focus 100%', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    file: 'debounce.js',
    badge: 'Node.js V8 Engine',
    code: [
      { num: 1, text: 'export function debounce(fn, delayMs = 250) {' },
      { num: 2, text: '  let timerId = null;' },
      { num: 3, text: '  return function (...args) {' },
      { num: 4, text: '    if (timerId) clearTimeout(timerId);' },
      { num: 5, text: '    timerId = setTimeout(() => {' },
      { num: 6, text: '      fn.apply(this, args);' },
      { num: 7, text: '    }, delayMs);' },
      { num: 8, text: '  };' },
      { num: 9, text: '}' },
    ],
    lines: [
      { text: '$ node --eval "require(\'./debounce.test.js\')"', type: 'cmd', delay: 0 },
      { text: '  [INIT] Provisioning isolated Node.js V8 sandbox...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Running 4 async event-loop timer tests...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Immediate call suppression         PASS 1.4ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Delayed invocation accuracy (±2ms) PASS 2.1ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Trailing argument forwarding       PASS 1.0ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Rapid burst cancel (100 ops)       PASS 3.8ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Loop Lag: 0.2ms │ Heap: 16MB', type: 'result', delay: 2900 },
      { text: '  Integrity: Face Presence 100% │ 0 Divergences', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'java',
    name: 'Java',
    file: 'Solution.java',
    badge: 'OpenJDK 21 Runner',
    code: [
      { num: 1, text: 'public class Solution {' },
      { num: 2, text: '  public int[] twoSum(int[] nums, int target) {' },
      { num: 3, text: '    Map<Integer, Integer> map = new HashMap<>();' },
      { num: 4, text: '    for (int i = 0; i < nums.length; i++) {' },
      { num: 5, text: '      int comp = target - nums[i];' },
      { num: 6, text: '      if (map.containsKey(comp)) {' },
      { num: 7, text: '        return new int[]{ map.get(comp), i };' },
      { num: 8, text: '      }' },
      { num: 9, text: '      map.put(nums[i], i);' },
      { num: 10, text: '    }' },
      { num: 11, text: '    return new int[]{};' },
      { num: 12, text: '  }' },
      { num: 13, text: '}' },
    ],
    lines: [
      { text: '$ javac Solution.java && java -cp . SolutionTest', type: 'cmd', delay: 0 },
      { text: '  [INIT] Compiling with OpenJDK 21 headless runner...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Evaluating candidate submission tests...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Standard target sum pair           PASS 2.3ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Negative & zero integer handling   PASS 1.7ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Duplicate element indices          PASS 1.5ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Large array benchmark (n=50,000)   PASS 6.2ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Wall Time: 11.7ms │ Heap: 28MB', type: 'result', delay: 2900 },
      { text: '  Engine: OpenJDK Isolation Sandbox Verified', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'c',
    name: 'C',
    file: 'memory_pool.c',
    badge: 'GCC 13 Isolated Runner',
    code: [
      { num: 1, text: '#include <stdio.h>' },
      { num: 2, text: '#include <stdlib.h>' },
      { num: 3, text: 'typedef struct { size_t sz; void *ptr; } Block;' },
      { num: 4, text: 'Block* pool_alloc(size_t size) {' },
      { num: 5, text: '  Block *b = (Block*)malloc(sizeof(Block));' },
      { num: 6, text: '  if (!b) return NULL;' },
      { num: 7, text: '  b->ptr = calloc(1, size);' },
      { num: 8, text: '  b->sz = size;' },
      { num: 9, text: '  return b;' },
      { num: 10, text: '}' },
    ],
    lines: [
      { text: '$ gcc -O2 -Wall memory_pool.c -o pool_test && ./pool_test', type: 'cmd', delay: 0 },
      { text: '  [INIT] Compiling with GCC 13.2 unprivileged isolation runner...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Executing 4 memory allocation safety tests...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Contiguous block zero-initialization PASS 0.8ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Out-of-memory NULL boundary check   PASS 0.4ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Struct alignment & cache locality   PASS 1.1ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Valgrind zero heap leak audit       PASS 3.2ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Exit Code: 0 │ GCC Wall Time: 5.5ms', type: 'result', delay: 2900 },
      { text: '  Integrity: Zero Buffer Overflows │ POSIX Memory Locked', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'cpp',
    name: 'C++',
    file: 'lru_cache.cpp',
    badge: 'Clang++ C++20 Sandbox',
    code: [
      { num: 1, text: '#include <unordered_map>' },
      { num: 2, text: '#include <list>' },
      { num: 3, text: 'class LRUCache {' },
      { num: 4, text: '  int cap;' },
      { num: 5, text: '  std::list<std::pair<int,int>> order;' },
      { num: 6, text: '  std::unordered_map<int, decltype(order.begin())> map;' },
      { num: 7, text: 'public:' },
      { num: 8, text: '  LRUCache(int c) : cap(c) {}' },
      { num: 9, text: '  int get(int key);' },
      { num: 10, text: '  void put(int key, int val);' },
      { num: 11, text: '};' },
    ],
    lines: [
      { text: '$ clang++ -std=c++20 -O3 lru_cache.cpp -o lru && ./lru', type: 'cmd', delay: 0 },
      { text: '  [INIT] Clang++ LLVM 17 containerized compilation unit...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Evaluating candidate submission against STL suites...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: O(1) key amortized lookup latency   PASS 1.2ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Double-linked list eviction order   PASS 0.9ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Iterator invalidation edge cases    PASS 1.5ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: High-concurrency benchmark (100k)   PASS 4.8ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Loop Latency: 0.1ms │ Peak RAM: 18MB', type: 'result', delay: 2900 },
      { text: '  Integrity: AddressSanitizer Clean │ Proctor Locked', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'sql',
    name: 'SQL',
    file: 'query.sql',
    badge: 'SQL In-Memory Engine',
    code: [
      { num: 1, text: 'SELECT' },
      { num: 2, text: '    d.name AS department,' },
      { num: 3, text: '    e.name AS employee_name,' },
      { num: 4, text: '    e.salary,' },
      { num: 5, text: '    DENSE_RANK() OVER (' },
      { num: 6, text: '      PARTITION BY e.dept_id ORDER BY e.salary DESC' },
      { num: 7, text: '    ) AS salary_rank' },
      { num: 8, text: 'FROM employees e' },
      { num: 9, text: 'JOIN departments d ON e.dept_id = d.id;' },
    ],
    lines: [
      { text: '$ sparkx test --lang sql --schema company_hr.db', type: 'cmd', delay: 0 },
      { text: '  [INIT] Loading schema: employees, departments...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Evaluating query output against dataset...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Window partition DENSE_RANK()      PASS 2.1ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Top compensation tier handling     PASS 2.4ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Tie-breaking salary ordering       PASS 1.9ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Empty department outer join safety PASS 1.5ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Query Time: 7.9ms │ Rows: 36', type: 'result', delay: 2900 },
      { text: '  Integrity: Evaluated against actual SQL test schema', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    file: 'token_bucket.ts',
    badge: 'Node.js Isolated VM',
    code: [
      { num: 1, text: 'export class TokenBucketRateLimiter {' },
      { num: 2, text: '  constructor(private cap: number, private rate: number) {}' },
      { num: 3, text: '  async tryConsume(tokens = 1): Promise<boolean> {' },
      { num: 4, text: '    this.refill();' },
      { num: 5, text: '    if (this.currentTokens >= tokens) {' },
      { num: 6, text: '      this.currentTokens -= tokens;' },
      { num: 7, text: '      return true;' },
      { num: 8, text: '    }' },
      { num: 9, text: '    return false;' },
      { num: 10, text: '  }' },
      { num: 11, text: '}' },
    ],
    lines: [
      { text: '$ ts-node --transpile-only token_bucket.ts', type: 'cmd', delay: 0 },
      { text: '  [INIT] Initializing V8 isolated context in Node 20...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Dispatching asynchronous concurrency stress test...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: Immediate capacity burst allowance PASS 3.2ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Throttled reject on empty bucket   PASS 2.8ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Fractional refill rate precision   PASS 4.1ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: 50 concurrent worker threads race  PASS 6.5ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Loop Lag: 0.3ms │ Heap: 18MB', type: 'result', delay: 2900 },
      { text: '  Integrity: Face Gaze Locked 98.4% │ In-Focus', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'go',
    name: 'Go (Judge0)',
    file: 'lru_cache.go',
    badge: 'Judge0 Cloud API',
    code: [
      { num: 1, text: 'type LRUCache struct {' },
      { num: 2, text: '    capacity int' },
      { num: 3, text: '    cache    map[int]*Node' },
      { num: 4, text: '    mu       sync.RWMutex' },
      { num: 5, text: '}' },
      { num: 6, text: 'func (c *LRUCache) Get(key int) int {' },
      { num: 7, text: '    c.mu.RLock()' },
      { num: 8, text: '    defer c.mu.RUnlock()' },
      { num: 9, text: '    if n, ok := c.cache[key]; ok {' },
      { num: 10, text: '        return n.val' },
      { num: 11, text: '    }' },
      { num: 12, text: '    return -1' },
      { num: 13, text: '}' },
    ],
    lines: [
      { text: '$ curl -X POST api.judge0.com/submissions?wait=true', type: 'cmd', delay: 0 },
      { text: '  [API] Code compiled via Judge0 Go 1.22 remote worker...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Running unit assertions with race detector...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: O(1) eviction on cache overflow    PASS 4.0ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: LRU timestamp update on key hit    PASS 2.2ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Concurrent goroutine read/write    PASS 5.1ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Memory leak profiling on 10k ops   PASS 3.6ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Remote Time: 14.9ms │ Status: 200', type: 'result', delay: 2900 },
      { text: '  Engine: Judge0 Enterprise Cloud Execution Verified', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'bash',
    name: 'Bash',
    file: 'healthcheck.sh',
    badge: 'POSIX Subshell Sandbox',
    code: [
      { num: 1, text: '#!/usr/bin/env bash' },
      { num: 2, text: 'set -euo pipefail' },
      { num: 3, text: 'check_service() {' },
      { num: 4, text: '  local host="$1" port="${2:-443}"' },
      { num: 5, text: '  if nc -z -w2 "$host" "$port" 2>/dev/null; then' },
      { num: 6, text: '    echo "HEALTHY:${host}:${port}"' },
      { num: 7, text: '  else' },
      { num: 8, text: '    echo "FAIL:${host}:${port}" >&2; return 1' },
      { num: 9, text: '  fi' },
      { num: 10, text: '}' },
    ],
    lines: [
      { text: '$ bats ./test_healthcheck.bats', type: 'cmd', delay: 0 },
      { text: '  [INIT] Spawning unprivileged subshell cgroup...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Running 4 assertion suites with mock sockets...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: TCP handshake on port 443          PASS 1.1ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Pipefail non-zero propagation      PASS 0.8ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Unreachable endpoint timeout (2s)  PASS 2.2ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: Default port 443 fallback          PASS 0.9ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ Exit Code: 0 │ Sys Time: 5.0ms', type: 'result', delay: 2900 },
      { text: '  Integrity: POSIX execution verified in container', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'terraform',
    name: 'Terraform',
    file: 'main.tf',
    badge: 'HCL Security & Plan Linter',
    code: [
      { num: 1, text: 'terraform {' },
      { num: 2, text: '  required_providers { aws = { source = "hashicorp/aws" } }' },
      { num: 3, text: '}' },
      { num: 4, text: 'resource "aws_s3_bucket" "audit" {' },
      { num: 5, text: '  bucket = "sparkx-vault-${var.env}"' },
      { num: 6, text: '}' },
      { num: 7, text: 'resource "aws_s3_bucket_server_side_encryption" "kms" {' },
      { num: 8, text: '  bucket = aws_s3_bucket.audit.id' },
      { num: 9, text: '  rule { apply_server_side_encryption_by_default {' },
      { num: 10, text: '    sse_algorithm = "aws:kms"' },
      { num: 11, text: '  } }' },
      { num: 12, text: '}' },
    ],
    lines: [
      { text: '$ terraform validate && tfsec --concise', type: 'cmd', delay: 0 },
      { text: '  [INIT] Parsing HCL AST and dependency graph...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Running 4 infrastructure-as-code audits...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: HCL syntax & block structure       PASS 3.2ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: S3 Server-Side KMS Encryption      PASS 2.4ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Public access ACL blocked          PASS 1.9ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: tfsec zero high-severity CVEs      PASS 4.5ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: Success! Configuration is valid │ Policy: 100%', type: 'result', delay: 2900 },
      { text: '  Engine: HashiCorp HCL2 Engine & Policy Guard Verified', type: 'info', delay: 3300 },
    ],
  },
  {
    id: 'aws-cli',
    name: 'AWS CLI',
    file: 'aws_audit.sh',
    badge: 'AWS IAM Cloud Sandbox',
    code: [
      { num: 1, text: '# Audit untagged EC2 instances' },
      { num: 2, text: 'aws ec2 describe-instances \\' },
      { num: 3, text: '  --filters "Name=instance-state-name,Values=running" \\' },
      { num: 4, text: '  --query "Reservations[].Instances[?!Tags].[Id,State]"' },
      { num: 5, text: '' },
      { num: 6, text: '# Audit unrestricted inbound SSH' },
      { num: 7, text: 'aws ec2 describe-security-groups \\' },
      { num: 8, text: '  --filters "Name=ip-permission.from-port,Values=22"' },
    ],
    lines: [
      { text: '$ sparkx cloud-eval --role CloudEngineer --profile sandbox', type: 'cmd', delay: 0 },
      { text: '  [INIT] Assuming ephemeral read-only STS IAM role...', type: 'dim', delay: 400 },
      { text: '  [EXEC] Dispatching JMESPath filter & security query...', type: 'info', delay: 800 },
      { text: '  ✓ Test 1: JMESPath query filter for EC2      PASS 2.6ms', type: 'pass', delay: 1200 },
      { text: '  ✓ Test 2: Ingress 0.0.0.0/0 SSH audit        PASS 3.0ms', type: 'pass', delay: 1600 },
      { text: '  ✓ Test 3: Least-privilege IAM policy valid   PASS 1.5ms', type: 'pass', delay: 2000 },
      { text: '  ✓ Test 4: JSON formatted output schema match  PASS 1.2ms', type: 'pass', delay: 2400 },
      { text: '', type: 'gap', delay: 2700 },
      { text: '  Summary: 4/4 Passed │ AWS CLI v2 │ Status: 200 OK', type: 'result', delay: 2900 },
      { text: '  Integrity: Isolated AWS STS Read-Only Sandbox Verified', type: 'info', delay: 3300 },
    ],
  },
];

/* ── Business & Non-Tech Evaluation Scenarios (Executive Document + Rubric) ── */
export const BUSINESS_SCENARIOS = [
  {
    id: 'pm',
    name: 'Product Manager',
    badge: 'AI Rubric Benchmark',
    docType: 'Executive PRD Spec',
    docTitle: 'Enterprise Frictionless Onboarding Handoff',
    targetScore: 94,
    grade: 'Strong Hire',
    recommendation: 'Exceptional strategic empathy & KPI rigor. Recommended for Senior PM role.',
    integrityText: 'Single Session Verified · 100% In-Focus · Zero Prompt Leakage',
    sections: [
      {
        heading: 'Executive Problem Statement',
        body: 'Analysis of Q1 funnel telemetry reveals a 42% candidate drop-off during ATS-to-IDE handoffs, creating ~$38,000 monthly leakage in engineering recruiter overhead.',
      },
      {
        heading: 'Prioritization Framework (RICE)',
        metrics: [
          { label: 'Reach', value: '85,000 MAU' },
          { label: 'Impact', value: '3.0x Multiplier' },
          { label: 'Confidence', value: '90% (40 User Interviews)' },
          { label: 'Effort', value: '3 Sprints · Score 765' },
        ],
      },
      {
        heading: 'Measurable Success Metrics',
        body: 'Target Day-30 activation rate uplift from 31% to 49% (+18%). Primary counter-metric: Error escalation latency capped under 2.4s.',
      },
    ],
    rubrics: [
      { dimension: 'Quantitative RICE Prioritization', score: 96, weight: '30%', note: 'Statistically rigorous impact assumptions' },
      { dimension: 'User Empathy & Churn Framing', score: 93, weight: '25%', note: 'Directly maps pain point to drop-off funnel' },
      { dimension: 'Technical Scope Feasibility', score: 91, weight: '25%', note: 'Pragmatic 3-sprint architectural plan' },
      { dimension: 'Day-30 KPI Measurability', score: 95, weight: '20%', note: 'Counter-metric safeguards user retention' },
    ],
    lines: [
      { text: 'Analyzing candidate PRD against strategic rubric...', type: 'dim', delay: 0 },
      { text: '✓ Dimension 1: RICE Prioritization Rigor (96%)', type: 'pass', delay: 600 },
      { text: '✓ Dimension 2: User Empathy & Churn Framing (93%)', type: 'pass', delay: 1200 },
      { text: '✓ Dimension 3: Technical Engineering Scope (91%)', type: 'pass', delay: 1800 },
      { text: '✓ Dimension 4: Day-30 KPI Measurability (95%)', type: 'pass', delay: 2400 },
      { text: 'Overall Rubric: 93.8% · Recommendation: Strong Hire', type: 'result', delay: 2800 },
    ],
  },
  {
    id: 'sales',
    name: 'Sales & AE',
    badge: 'Voice & Objection Telemetry',
    docType: 'Enterprise Discovery Call Transcript',
    docTitle: 'CFO Budget Freeze Objection Defense',
    targetScore: 95,
    grade: 'Quota Leader',
    recommendation: 'Flawless OPEX reframing against budget freeze. Immediate consultative closing aptitude.',
    integrityText: 'Audio Biometric Matched · Natural Cadence · Zero Synthetic Prompts',
    dialogue: [
      {
        speaker: 'Buyer (VP People)',
        tag: 'Prospect',
        text: '"We love SparkX, but our CFO froze all software and tool discretionary spend until Q4."',
      },
      {
        speaker: 'Candidate (Account Executive)',
        tag: 'Candidate',
        text: '"Understood, Sarah. When CFOs freeze spend, it is about OPEX preservation. With 35 open technical roles this quarter, manual resume screening leaks ~$14,000/month in recruiter hours. If we structure a 60-day pilot that guarantees positive net cash recovery before Q4, would your CFO approve a self-funding pilot?"',
      },
      {
        speaker: 'Buyer (VP People)',
        tag: 'Prospect',
        text: '"Yes, if the ROI recovery is mathematically proven, she will sign the pilot order."',
      },
    ],
    rubrics: [
      { dimension: 'Empathetic Objection Reframing', score: 96, weight: '30%', note: 'Transforms freeze into cash preservation win' },
      { dimension: 'Financial ROI Mathematics', score: 95, weight: '30%', note: 'Accurately quantifies $14k/mo recruiter drain' },
      { dimension: 'Mutual Action Plan Closing', score: 93, weight: '25%', note: 'Clear 60-day milestone-based commitment' },
      { dimension: 'Executive Cadence & Assertiveness', score: 97, weight: '15%', note: 'Authoritative, calm, consultative delivery' },
    ],
    lines: [
      { text: 'Analyzing audio cadence & transcript semantics...', type: 'dim', delay: 0 },
      { text: '✓ Criterion 1: Empathetic Objection Reframing (96%)', type: 'pass', delay: 600 },
      { text: '✓ Criterion 2: Financial ROI Mathematics (95%)', type: 'pass', delay: 1200 },
      { text: '✓ Criterion 3: Mutual Action Plan Closing (93%)', type: 'pass', delay: 1800 },
      { text: '✓ Criterion 4: Executive Vocal Cadence (97%)', type: 'pass', delay: 2400 },
      { text: 'Overall Rubric: 95.2% · Recommendation: Quota Leader', type: 'result', delay: 2800 },
    ],
  },
  {
    id: 'marketing',
    name: 'Growth Marketing',
    badge: 'Funnel & ROAS Model',
    docType: 'Multi-Channel Acquisition Model',
    docTitle: 'Autonomous Recruitment Platform Launch',
    targetScore: 93,
    grade: 'Top 5% Cohort',
    recommendation: 'Exceptional LTV/CAC sensitivity modeling and capital discipline.',
    integrityText: 'Mathematical Formulation Authenticated · Single Author Profile',
    sections: [
      {
        heading: 'Campaign Overview & Channel Budget Allocation',
        body: 'Total Initial Spend: $45,000/month allocated dynamically: LinkedIn Account-Based (55%), Meta Paid Social (30%), High-Intent Search SEM (15%).',
      },
      {
        heading: 'Unit Economics & Sensitivity',
        metrics: [
          { label: 'Target CPC', value: '$4.10' },
          { label: 'Lead-to-Demo', value: '14.2%' },
          { label: 'Blended CAC', value: '$380' },
          { label: 'Expected LTV', value: '$3,200 (8.4x)' },
          { label: 'Payback', value: '3.8 Months' },
        ],
      },
    ],
    rubrics: [
      { dimension: 'LTV/CAC Unit Economics Rigor', score: 95, weight: '35%', note: '8.4x multiplier safely above 3.0x industry floor' },
      { dimension: 'Multi-Touch Channel Attribution', score: 92, weight: '25%', note: 'Smart ABM bias toward technical buyers' },
      { dimension: 'Downside Churn Sensitivity Analysis', score: 91, weight: '20%', note: 'Resilient against 2% to 5% retention stress' },
      { dimension: 'Capital Efficiency & Payback Velocity', score: 94, weight: '20%', note: 'Payback under 4 months speeds reinvestment' },
    ],
    lines: [
      { text: 'Executing cohort attribution & unit economics audit...', type: 'dim', delay: 0 },
      { text: '✓ Stress Test 1: LTV/CAC Multiplier Rigor (95%)', type: 'pass', delay: 600 },
      { text: '✓ Stress Test 2: Channel Attribution Balance (92%)', type: 'pass', delay: 1200 },
      { text: '✓ Stress Test 3: Downside Churn Sensitivity (91%)', type: 'pass', delay: 1800 },
      { text: '✓ Stress Test 4: Capital Payback Velocity (94%)', type: 'pass', delay: 2400 },
      { text: 'Overall Rubric: 93.0% · Recommendation: Top 5% Cohort', type: 'result', delay: 2800 },
    ],
  },
  {
    id: 'finance',
    name: 'Financial Analyst',
    badge: 'Quantitative Audit Engine',
    docType: 'DCF & Sensitivity Model',
    docTitle: '3-Year Enterprise SaaS Valuation & WACC',
    targetScore: 96,
    grade: 'Wall St Tier',
    recommendation: 'Flawless unlevered free cash flow mechanics. Zero circular dependency loops.',
    integrityText: 'Formula AST Audited · Timed Financial Sandbox · Zero Formula Errors',
    tableData: {
      headers: ['Fiscal Year', 'Revenue', 'EBITDA', 'Unlevered FCF', 'PV of FCF'],
      rows: [
        ['FY2026', '$12.4M', '$2.1M (16.9%)', '$1.60M', '$1.46M'],
        ['FY2027', '$21.0M', '$4.8M (22.8%)', '$3.70M', '$3.07M'],
        ['FY2028', '$33.2M', '$9.1M (27.4%)', '$7.20M', '$5.40M'],
      ],
      summary: 'WACC: 9.8% │ Terminal Growth: 3.0% │ Implied Enterprise Value: $86.4M',
    },
    rubrics: [
      { dimension: 'Unlevered FCF Formula Integrity', score: 98, weight: '35%', note: 'CapEx & NWC adjustments mathematically sound' },
      { dimension: 'WACC Capital Weighting Logic', score: 95, weight: '25%', note: '9.8% discount rate matches risk profile' },
      { dimension: 'Terminal Value Gordon Growth Bounds', score: 94, weight: '20%', note: '3.0% growth aligned with long-term GDP' },
      { dimension: 'Spreadsheet Cleanliness & Zero Loops', score: 97, weight: '20%', note: 'Zero circular dependencies or broken refs' },
    ],
    lines: [
      { text: 'Auditing financial formulas, circular references & WACC...', type: 'dim', delay: 0 },
      { text: '✓ Audit 1: Unlevered Free Cash Flow Formula (98%)', type: 'pass', delay: 600 },
      { text: '✓ Audit 2: WACC Capital Structure Weighting (95%)', type: 'pass', delay: 1200 },
      { text: '✓ Audit 3: Terminal Value Sensitivity Bounds (94%)', type: 'pass', delay: 1800 },
      { text: '✓ Audit 4: Zero Circular Dependencies (97%)', type: 'pass', delay: 2400 },
      { text: 'Overall Rubric: 96.0% · Recommendation: Wall St Tier', type: 'result', delay: 2800 },
    ],
  },
  {
    id: 'hr',
    name: 'People & HR Ops',
    badge: 'EEOC & Compliance Guard',
    docType: 'Confidential Grievance Protocol',
    docTitle: 'Workplace Dispute Resolution & Anti-Retaliation',
    targetScore: 97,
    grade: 'EEOC Exemplary',
    recommendation: 'Model adherence to Title VII statutory guidelines and procedural fairness.',
    integrityText: 'Legal Framework Verified · Impartial Tone Confirmed · Timestamps Validated',
    sections: [
      {
        heading: 'Escalation Classification & Immediate Quarantine',
        body: 'Category: Level 3 Workplace Grievance. Firewalled reporting lines within 2 hours. Transferred complainant to neutral reporting sponsor without reduction in title or perks.',
      },
      {
        heading: 'Procedural Resolution Protocol',
        items: [
          'Independent Fact-Finding: Executed structured, recorded single-party interviews.',
          'Title VII Legal Cross-Check: Verified zero discriminatory or protected-class breaches.',
          'Corrective Coaching Action: Enacted 60-day executive communication remediation.',
          'Post-Resolution Retention Check: Formal sentiment reviews scheduled at Day 30 and 90.',
        ],
      },
    ],
    rubrics: [
      { dimension: 'Anti-Retaliation Firewall Integrity', score: 98, weight: '30%', note: 'Immediate protective reporting line change' },
      { dimension: 'Title VII & EEOC Statutory Compliance', score: 97, weight: '30%', note: 'Zero protected category liability created' },
      { dimension: 'Procedural Neutrality & Documentation', score: 96, weight: '20%', note: 'Thorough, objective transcript custody' },
      { dimension: 'Post-Remediation Retention Follow-up', score: 95, weight: '20%', note: 'Safeguards long-term organizational health' },
    ],
    lines: [
      { text: 'Ingesting resolution plan against employment law corpus...', type: 'dim', delay: 0 },
      { text: '✓ Check 1: Anti-Retaliation Firewall (98%)', type: 'pass', delay: 600 },
      { text: '✓ Check 2: Title VII & EEOC Compliance (97%)', type: 'pass', delay: 1200 },
      { text: '✓ Check 3: Procedural Neutrality & Custody (96%)', type: 'pass', delay: 1800 },
      { text: '✓ Check 4: Retention Follow-up Schedule (95%)', type: 'pass', delay: 2400 },
      { text: 'Overall Rubric: 96.5% · Recommendation: EEOC Exemplary', type: 'result', delay: 2800 },
    ],
  },
];

export function TypingTerminal() {
  const [activeDomain, setActiveDomain] = useState('tech'); // 'tech' | 'business'
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [inView, setInView] = useState(false);
  const [cycle, setCycle] = useState(0);
  const ref = useRef(null);

  const scenarios = activeDomain === 'tech' ? RUNTIME_SCENARIOS : BUSINESS_SCENARIOS;
  const scenario = scenarios[activeScenarioIdx] || scenarios[0];

  // Replay typing sequence whenever user scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setVisibleLines(0);
          setCycle((c) => c + 1);
        }
      },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Run typing animation for the current active scenario
  useEffect(() => {
    if (!inView) return;

    setVisibleLines(0);
    const timers = scenario.lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );

    // After lines complete, hold for 4.5s then auto-rotate to next scenario
    const lastDelay = scenario.lines[scenario.lines.length - 1]?.delay || 3000;
    const totalDuration = lastDelay + 4500;
    const loopTimer = setTimeout(() => {
      setActiveScenarioIdx((prev) => (prev + 1) % scenarios.length);
      setCycle((c) => c + 1);
    }, totalDuration);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loopTimer);
    };
  }, [inView, cycle, activeScenarioIdx, activeDomain]);

  const handleDomainChange = (domain) => {
    setActiveDomain(domain);
    setActiveScenarioIdx(0);
    setVisibleLines(0);
    setCycle((c) => c + 1);
  };

  const handleSelectScenario = (index) => {
    setActiveScenarioIdx(index);
    setVisibleLines(0);
    setCycle((c) => c + 1);
  };

  const colorMap = {
    cmd: 'text-teal-400 font-semibold',
    dim: 'text-stone-500',
    info: 'text-sky-400',
    pass: 'text-emerald-400 font-medium',
    fail: 'text-red-400 font-medium',
    result: 'text-amber-300 font-bold',
    gap: '',
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ── Domain Mode Switcher Pill (Tech vs Non-Tech) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => handleDomainChange('tech')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeDomain === 'tech'
              ? 'bg-teal-100 text-teal-950 border border-teal-300 shadow-sm dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40 dark:shadow-teal-950/20 scale-[1.02]'
              : 'text-stone-700 bg-white/95 border border-stone-300/90 hover:bg-stone-50 hover:text-stone-950 shadow-2xs dark:text-stone-400 dark:bg-stone-900/60 dark:border-stone-800 dark:hover:bg-stone-800/50 dark:hover:text-stone-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          <span>Technical & Engineering (11 Compilers)</span>
        </button>

        <button
          type="button"
          onClick={() => handleDomainChange('business')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeDomain === 'business'
              ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 dark:shadow-amber-950/20 scale-[1.02]'
              : 'text-stone-700 bg-white/95 border border-stone-300/90 hover:bg-stone-50 hover:text-stone-950 shadow-2xs dark:text-stone-400 dark:bg-stone-900/60 dark:border-stone-800 dark:hover:bg-stone-800/50 dark:hover:text-stone-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>Business & Non-Tech Roles (5 Case Rubrics)</span>
        </button>
      </div>

      {/* ── Interactive Simulation Container ── */}
      <div
        ref={ref}
        className="relative rounded-2xl overflow-hidden border border-stone-800 bg-[#0C0A09] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)]"
      >
        {/* Tier 1: Window Controls + Document/File Title + Live Runtime Badge */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161412] border-b border-stone-800/90">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-stone-300 flex items-center gap-2">
              {activeDomain === 'tech' ? (
                <>
                  <Code2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="font-semibold text-stone-200">{scenario.file}</span>
                  <span className="text-[10px] text-stone-500 hidden sm:inline">• UTF-8</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-sans font-semibold text-stone-200">{scenario.docTitle}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-stone-300 bg-stone-900/90 px-2.5 py-1 rounded-md border border-stone-800 shadow-inner">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeDomain === 'tech' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="font-medium">{scenario.badge}</span>
          </div>
        </div>

        {/* Tier 2: Dedicated Horizontal Language / Rubric Tabs Strip */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#1C1917] border-b border-stone-800 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mr-1.5 shrink-0 hidden md:inline">
            {activeDomain === 'tech' ? 'Languages:' : 'Rubrics:'}
          </span>
          <div className="flex items-center gap-1.5 min-w-max">
            {scenarios.map((sc, i) => {
              const isActive = i === activeScenarioIdx;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(i)}
                  className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? activeDomain === 'tech'
                        ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-xs'
                        : 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 border border-transparent'
                  }`}
                >
                  {sc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TECHNICAL DOMAIN: Code Editor (Left) + Sandbox Terminal (Right) ── */}
        {activeDomain === 'tech' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-800/90">
            {/* Left: Clean Code Editor Pane (NO horizontal scrollbar) */}
            <div className="lg:col-span-6 p-4 sm:p-5 bg-[#0F0D0B] font-mono text-[11px] sm:text-xs leading-relaxed select-text overflow-x-hidden no-scrollbar">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-stone-800/60 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                <span>Candidate Submission</span>
                <span className="text-teal-400">Ready for Evaluation</span>
              </div>

              <div className="space-y-1">
                {scenario.code?.map((line) => (
                  <div key={line.num} className="flex gap-2 sm:gap-3 text-stone-300">
                    <span className="text-stone-600 select-none text-right w-5 shrink-0 text-[10px] sm:text-xs">{line.num}</span>
                    <span className="break-words whitespace-pre-wrap font-mono">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live Execution Console */}
            <div className="lg:col-span-6 p-4 sm:p-5 bg-[#090807] font-mono text-[11px] sm:text-xs leading-relaxed min-h-[260px] flex flex-col justify-between overflow-x-hidden no-scrollbar">
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-stone-800/60 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-teal-400" />
                    <span>Isolated Sandbox Console</span>
                  </span>
                  <span className="text-emerald-400">Live Telemetry</span>
                </div>

                {scenario.lines?.slice(0, visibleLines).map((line, i) => (
                  <div
                    key={i}
                    className={`${colorMap[line.type] || ''} ${line.type === 'gap' ? 'h-2' : ''} break-words whitespace-pre-wrap`}
                    style={{ animation: 'fade-in-line 0.2s ease-out' }}
                  >
                    {line.text}
                  </div>
                ))}
                {/* Blinking cursor */}
                {visibleLines < scenario.lines?.length && inView && (
                  <span className="inline-block w-1.5 h-3.5 animate-pulse ml-0.5 bg-teal-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BUSINESS & NON-TECH DOMAIN: Executive Document (Left) + AI Rubric Scorecard (Right) ── */}
        {activeDomain === 'business' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-800/90">
            {/* Left: Executive Business Case Document Viewer */}
            <div className="lg:col-span-6 p-4 sm:p-5 bg-[#0F0D0B] font-sans text-xs leading-relaxed select-text overflow-x-hidden no-scrollbar">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-800/60 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Candidate Case Submission</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[10px]">
                  {scenario.docType}
                </span>
              </div>

              {/* Document Render Area */}
              <div className="space-y-4">
                {/* Product Manager Sections */}
                {scenario.id === 'pm' && scenario.sections && (
                  <div className="space-y-3.5">
                    {scenario.sections.map((sec, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          {sec.heading}
                        </h4>
                        {sec.body && (
                          <p className="text-stone-300 leading-relaxed text-xs">
                            {sec.body}
                          </p>
                        )}
                        {sec.metrics && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {sec.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px]">
                                <div className="text-stone-500 text-[10px] font-mono">{m.label}</div>
                                <div className="text-stone-100 font-semibold mt-0.5">{m.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sales & AE Dialogue Cards */}
                {scenario.id === 'sales' && scenario.dialogue && (
                  <div className="space-y-2.5">
                    <div className="text-[10.5px] font-mono text-stone-400 pb-1">
                      Context: Fortune 500 Account · CFO Budget Freeze Defense
                    </div>
                    {scenario.dialogue.map((d, dIdx) => (
                      <div
                        key={dIdx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          d.tag === 'Candidate'
                            ? 'bg-teal-950/30 border-teal-800/50 text-teal-200'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                          <span className={d.tag === 'Candidate' ? 'text-teal-400' : 'text-stone-400'}>
                            {d.speaker}
                          </span>
                          <span className="font-mono text-[9px] uppercase">{d.tag}</span>
                        </div>
                        <p>{d.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Growth Marketing Model */}
                {scenario.id === 'marketing' && scenario.sections && (
                  <div className="space-y-3.5">
                    {scenario.sections.map((sec, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          {sec.heading}
                        </h4>
                        {sec.body && (
                          <p className="text-stone-300 leading-relaxed text-xs">
                            {sec.body}
                          </p>
                        )}
                        {sec.metrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {sec.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px]">
                                <div className="text-stone-500 text-[10px] font-mono">{m.label}</div>
                                <div className="text-stone-100 font-semibold mt-0.5">{m.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial Analyst Pro-Forma Forecast Table */}
                {scenario.id === 'finance' && scenario.tableData && (
                  <div className="space-y-2.5">
                    <div className="rounded-lg border border-stone-800 overflow-hidden bg-stone-900/60">
                      <table className="w-full text-[10.5px] text-left">
                        <thead className="bg-[#1C1917] text-stone-400 font-mono text-[10px] border-b border-stone-800">
                          <tr>
                            {scenario.tableData.headers.map((h, i) => (
                              <th key={i} className="px-2.5 py-1.5 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60 font-mono text-stone-300">
                          {scenario.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-stone-800/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-2.5 py-1.5">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 font-mono text-[10.5px] text-amber-300/90 text-center">
                      {scenario.tableData.summary}
                    </div>
                  </div>
                )}

                {/* People & HR Ops Memo */}
                {scenario.id === 'hr' && scenario.sections && (
                  <div className="space-y-3">
                    {scenario.sections.map((sec, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          {sec.heading}
                        </h4>
                        {sec.body && (
                          <p className="text-stone-300 leading-relaxed text-xs">
                            {sec.body}
                          </p>
                        )}
                        {sec.items && (
                          <div className="space-y-1.5 pt-1">
                            {sec.items.map((it, itIdx) => (
                              <div key={itIdx} className="flex items-start gap-2 text-stone-300 text-[11px]">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{it}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI Executive Rubric & Competency Scorecard */}
            <div className="lg:col-span-6 p-4 sm:p-5 bg-[#090807] font-sans text-xs leading-relaxed min-h-[260px] flex flex-col justify-between overflow-x-hidden no-scrollbar">
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/60 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-amber-400" />
                    <span>AI Executive Rubric Scorecard</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold font-mono">
                    Score: {scenario.targetScore}% · {scenario.grade}
                  </span>
                </div>

                {/* Rubric Dimension Bars */}
                <div className="space-y-2.5">
                  {scenario.rubrics?.map((r, rIdx) => {
                    const isEvaluated = visibleLines > rIdx;
                    return (
                      <div key={rIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{r.dimension}</span>
                            <span className="text-stone-500 text-[9.5px] font-mono">({r.weight})</span>
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-[10.5px]">
                            {isEvaluated ? `${r.score}%` : 'Evaluating...'}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-stone-900 border border-stone-800/60 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: isEvaluated ? `${r.score}%` : '0%' }}
                          />
                        </div>
                        <div className="text-[10px] text-stone-500 italic">
                          {r.note}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Recommendation Callout */}
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-300 flex items-start gap-2.5 mt-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-100">Committee Synthesis: </span>
                    <span>{scenario.recommendation}</span>
                  </div>
                </div>
              </div>

              {/* Integrity Stamp */}
              <div className="pt-3 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{scenario.integrityText}</span>
                </span>
                <span className="text-emerald-400 font-bold">100% EEOC Validated</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── TiltCard ────────────────────────────────────────────────────────────── */
export function TiltCard({ children, className = '', intensity = 8 }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

/* ── MagneticWrap ────────────────────────────────────────────────────────── */
export function MagneticWrap({ children, className = '', strength = 0.3 }) {
  const wrapRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    wrapRef.current.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    if (!wrapRef.current) return;
    wrapRef.current.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out will-change-transform inline-block ${className}`}
    >
      {children}
    </div>
  );
}

/* ── GradientDivider ─────────────────────────────────────────────────────── */
export function GradientDivider({ className = '' }) {
  return (
    <div className={`w-full max-w-5xl mx-auto px-4 ${className}`} aria-hidden="true">
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-stone-300/80 dark:via-stone-700/60 to-transparent" />
    </div>
  );
}
