/**
 * SPARKX BENCHMARK QUESTIONS CATALOG
 * Authoritative problem descriptions, examples, constraints, function signatures,
 * multi-language starter skeletons (zero leaked solutions), and sample test cases
 * for popular LeetCode & HackerRank interview benchmarks across all 13 Judge0 languages.
 */

export function generateDefaultStarter(lang, functionName = 'solve') {
  const l = (lang || 'python').toLowerCase();
  switch (l) {
    case 'python':
      return `def ${functionName}(*args):\n    # Write your code here\n    pass\n`;
    case 'javascript':
      return `/**\n * @return {any}\n */\nfunction ${functionName}(...args) {\n    // Write your code here\n}\n`;
    case 'typescript':
      return `function ${functionName}(...args: any[]): any {\n    // Write your code here\n    return null;\n}\n`;
    case 'java':
      return `import java.util.*;\n\nclass Solution {\n    public static Object ${functionName}(Object... args) {\n        // Write your code here\n        return null;\n    }\n}\n`;
    case 'cpp':
      return `#include <iostream>\n#include <vector>\n\nclass Solution {\npublic:\n    void ${functionName}() {\n        // Write your code here\n    }\n};\n`;
    case 'c':
      return `#include <stdio.h>\n\nvoid ${functionName}() {\n    // Write your code here\n}\n`;
    case 'csharp':
      return `using System;\nusing System.Collections.Generic;\n\npublic class Solution {\n    public static void ${functionName}() {\n        // Write your code here\n    }\n}\n`;
    case 'go':
      return `package main\n\nfunc ${functionName}() {\n    // Write your code here\n}\n`;
    case 'rust':
      return `fn ${functionName}() {\n    // Write your code here\n}\n`;
    case 'swift':
      return `import Foundation\n\nfunc ${functionName}() {\n    // Write your code here\n}\n`;
    case 'kotlin':
      return `fun ${functionName}() {\n    // Write your code here\n}\n`;
    case 'ruby':
      return `def ${functionName}(*args)\n    # Write your code here\nend\n`;
    case 'php':
      return `<?php\nfunction ${functionName}(...$args) {\n    // Write your code here\n}\n`;
    case 'sql':
      return `-- Write your SQL query below\nSELECT * FROM solution;\n`;
    default:
      return `# Write your solution below\n`;
  }
}

export const BENCHMARK_QUESTIONS = {
  hr_simple_array_sum: {
    id: 'hr_simple_array_sum',
    title: 'Simple Array Sum',
    platform: 'hackerrank',
    difficulty: 'Easy',
    type: 'arrays',
    instructions: `Given an array of integers, find the sum of its elements.

### Function Description:
Complete the \`simpleArraySum\` function in the editor below. It must return the sum of the array elements as an integer.

\`simpleArraySum\` has the following parameter(s):
- \`int ar[n]\`: an array of integers

### Returns:
- \`int\`: the sum of the array's elements

### Example 1:
- **Input:** \`ar = [1, 2, 3, 4, 10, 11]\`
- **Output:** \`31\`
- **Explanation:** \`1 + 2 + 3 + 4 + 10 + 11 = 31\`.

### Constraints:
- \`0 < n <= 1000\`
- \`0 <= ar[i] <= 1000\``,
    examples: [
      { input: '[1, 2, 3, 4, 10, 11]', output: '31', explanation: '1 + 2 + 3 + 4 + 10 + 11 = 31.' },
      { input: '[5, 10, 15]', output: '30', explanation: '5 + 10 + 15 = 30.' }
    ],
    constraints: [
      '0 < n <= 1000',
      '0 <= ar[i] <= 1000'
    ],
    function_signature: {
      python: 'def simpleArraySum(ar: list[int]) -> int:',
      javascript: 'function simpleArraySum(ar)',
      typescript: 'function simpleArraySum(ar: number[]): number',
      java: 'public static int simpleArraySum(List<Integer> ar)',
      cpp: 'int simpleArraySum(vector<int> ar)',
      swift: 'func simpleArraySum(ar: [Int]) -> Int'
    },
    starter_code: {
      python: "def simpleArraySum(ar):\n    # Write your code here\n    pass\n",
      javascript: "/**\n * @param {number[]} ar\n * @return {number}\n */\nfunction simpleArraySum(ar) {\n    // Write your code here\n}\n",
      typescript: "function simpleArraySum(ar: number[]): number {\n    // Write your code here\n    return 0;\n}\n",
      java: "import java.util.*;\n\nclass Solution {\n    public static int simpleArraySum(List<Integer> ar) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      cpp: "#include <vector>\n\nint simpleArraySum(std::vector<int> ar) {\n    // Write your code here\n    return 0;\n}\n",
      c: "int simpleArraySum(int ar_count, int* ar) {\n    // Write your code here\n    return 0;\n}\n",
      csharp: "using System.Collections.Generic;\n\npublic class Solution {\n    public static int SimpleArraySum(List<int> ar) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      go: "package main\n\nfunc simpleArraySum(ar []int32) int32 {\n    // Write your code here\n    return 0\n}\n",
      rust: "fn simpleArraySum(ar: &[i32]) -> i32 {\n    // Write your code here\n    0\n}\n",
      swift: "func simpleArraySum(ar: [Int]) -> Int {\n    // Write your code here\n    return 0\n}\n",
      kotlin: "fun simpleArraySum(ar: Array<Int>): Int {\n    // Write your code here\n    return 0\n}\n",
      ruby: "def simpleArraySum(ar)\n    # Write your code here\nend\n",
      php: "function simpleArraySum($ar) {\n    // Write your code here\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Sample 0: [1, 2, 3, 4, 10, 11]', input: '[1, 2, 3, 4, 10, 11]', expected: '31' },
      { id: 2, name: 'Sample 1: [5, 10, 15]', input: '[5, 10, 15]', expected: '30' },
      { id: 3, name: 'Sample 2: Single element [100]', input: '[100]', expected: '100' }
    ]
  },

  hr_diagonal_difference: {
    id: 'hr_diagonal_difference',
    title: 'Diagonal Difference',
    platform: 'hackerrank',
    difficulty: 'Easy',
    type: 'arrays',
    instructions: `Given a square matrix, calculate the absolute difference between the sums of its diagonals.

For example, the square matrix \`arr\` is shown below:
\`\`\`
1 2 3
4 5 6
9 8 9
\`\`\`
- The left-to-right diagonal: \`1 + 5 + 9 = 15\`.
- The right-to-left diagonal: \`3 + 5 + 9 = 17\`.
- Their absolute difference is \`|15 - 17| = 2\`.

### Function Description:
Complete the \`diagonalDifference\` function in the editor below.

\`diagonalDifference\` takes the following parameter:
- \`int arr[n][m]\`: a 2D array of integers representing a square matrix

### Returns:
- \`int\`: the absolute diagonal difference

### Example 1:
- **Input:** \`arr = [[11, 2, 4], [4, 5, 6], [10, 8, -12]]\`
- **Output:** \`15\`
- **Explanation:**
  - Primary diagonal: \`11 + 5 + (-12) = 4\`
  - Secondary diagonal: \`4 + 5 + 10 = 19\`
  - Absolute difference: \`|4 - 19| = 15\`

### Constraints:
- \`1 <= n <= 100\`
- \`-100 <= arr[i][j] <= 100\``,
    examples: [
      { input: '[[11, 2, 4], [4, 5, 6], [10, 8, -12]]', output: '15', explanation: '|(11 + 5 - 12) - (4 + 5 + 10)| = |4 - 19| = 15.' },
      { input: '[[1, 2], [3, 4]]', output: '0', explanation: '|(1 + 4) - (2 + 3)| = |5 - 5| = 0.' }
    ],
    constraints: [
      '1 <= n <= 100',
      '-100 <= arr[i][j] <= 100'
    ],
    function_signature: {
      python: 'def diagonalDifference(arr: list[list[int]]) -> int:',
      javascript: 'function diagonalDifference(arr)',
      typescript: 'function diagonalDifference(arr: number[][]): number',
      java: 'public static int diagonalDifference(List<List<Integer>> arr)',
      cpp: 'int diagonalDifference(vector<vector<int>> arr)',
      swift: 'func diagonalDifference(arr: [[Int]]) -> Int'
    },
    starter_code: {
      python: "def diagonalDifference(arr):\n    # Write your code here\n    pass\n",
      javascript: "/**\n * @param {number[][]} arr\n * @return {number}\n */\nfunction diagonalDifference(arr) {\n    // Write your code here\n}\n",
      typescript: "function diagonalDifference(arr: number[][]): number {\n    // Write your code here\n    return 0;\n}\n",
      java: "import java.util.*;\n\nclass Solution {\n    public static int diagonalDifference(List<List<Integer>> arr) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      cpp: "#include <vector>\n#include <cmath>\n\nint diagonalDifference(std::vector<std::vector<int>> arr) {\n    // Write your code here\n    return 0;\n}\n",
      csharp: "using System;\nusing System.Collections.Generic;\n\npublic class Solution {\n    public static int DiagonalDifference(List<List<int>> arr) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      go: "package main\n\nfunc diagonalDifference(arr [][]int32) int32 {\n    // Write your code here\n    return 0\n}\n",
      rust: "fn diagonalDifference(arr: &[Vec<i32>]) -> i32 {\n    // Write your code here\n    0\n}\n",
      swift: "func diagonalDifference(arr: [[Int]]) -> Int {\n    // Write your code here\n    return 0\n}\n",
      kotlin: "fun diagonalDifference(arr: Array<Array<Int>>): Int {\n    // Write your code here\n    return 0\n}\n",
      ruby: "def diagonalDifference(arr)\n    # Write your code here\nend\n",
      php: "function diagonalDifference($arr) {\n    // Write your code here\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Sample 0: 3x3 Matrix', input: '[[11, 2, 4], [4, 5, 6], [10, 8, -12]]', expected: '15' },
      { id: 2, name: 'Sample 1: 2x2 Matrix', input: '[[1, 2], [3, 4]]', expected: '0' }
    ]
  },

  hr_solve_me_first: {
    id: 'hr_solve_me_first',
    title: 'Solve Me First',
    platform: 'hackerrank',
    difficulty: 'Easy',
    type: 'warmup',
    instructions: `Complete the function \`solveMeFirst\` to compute the sum of two integers.

### Function Description:
Complete the \`solveMeFirst\` function in the editor below.

### Parameters:
- \`int a\`: the first value
- \`int b\`: the second value

### Returns:
- \`int\`: the sum of \`a\` and \`b\`

### Example 1:
- **Input:** \`a = 2, b = 3\`
- **Output:** \`5\`

### Constraints:
- \`1 <= a, b <= 1000\``,
    examples: [
      { input: 'a = 2, b = 3', output: '5', explanation: '2 + 3 = 5' },
      { input: 'a = 10, b = 20', output: '30', explanation: '10 + 20 = 30' }
    ],
    constraints: ['1 <= a, b <= 1000'],
    function_signature: {
      python: 'def solveMeFirst(a: int, b: int) -> int:',
      javascript: 'function solveMeFirst(a, b)',
      typescript: 'function solveMeFirst(a: number, b: number): number',
      java: 'public static int solveMeFirst(int a, int b)',
      cpp: 'int solveMeFirst(int a, int b)',
      swift: 'func solveMeFirst(a: Int, b: Int) -> Int'
    },
    starter_code: {
      python: "def solveMeFirst(a, b):\n    # Write your code here\n    pass\n",
      javascript: "function solveMeFirst(a, b) {\n    // Write your code here\n}\n",
      typescript: "function solveMeFirst(a: number, b: number): number {\n    // Write your code here\n    return 0;\n}\n",
      java: "class Solution {\n    public static int solveMeFirst(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      cpp: "int solveMeFirst(int a, int b) {\n    // Write your code here\n    return 0;\n}\n",
      c: "int solveMeFirst(int a, int b) {\n    // Write your code here\n    return 0;\n}\n",
      csharp: "public class Solution {\n    public static int SolveMeFirst(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}\n",
      go: "package main\n\nfunc solveMeFirst(a int, b int) int {\n    // Write your code here\n    return 0\n}\n",
      rust: "fn solve_me_first(a: i32, b: i32) -> i32 {\n    // Write your code here\n    0\n}\n",
      swift: "func solveMeFirst(a: Int, b: Int) -> Int {\n    // Write your code here\n    return 0\n}\n",
      kotlin: "fun solveMeFirst(a: Int, b: Int): Int {\n    // Write your code here\n    return 0\n}\n",
      ruby: "def solveMeFirst(a, b)\n    # Write your code here\nend\n",
      php: "function solveMeFirst($a, $b) {\n    // Write your code here\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Sample 0: 2 + 3', input: '[2, 3]', expected: '5' },
      { id: 2, name: 'Sample 1: 10 + 20', input: '[10, 20]', expected: '30' }
    ]
  },

  lc_two_sum: {
    id: 'lc_two_sum',
    title: '1. Two Sum',
    platform: 'leetcode',
    difficulty: 'Easy',
    type: 'array_hashmap',
    instructions: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
- **Input:** \`nums = [2, 7, 11, 15], target = 9\`
- **Output:** \`[0, 1]\`
- **Explanation:** Because \`nums[0] + nums[1] == 9\`, we return \`[0, 1]\`.

### Example 2:
- **Input:** \`nums = [3, 2, 4], target = 6\`
- **Output:** \`[1, 2]\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] == 6' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists'
    ],
    function_signature: {
      python: 'def twoSum(nums: list[int], target: int) -> list[int]:',
      javascript: 'function twoSum(nums, target)',
      typescript: 'function twoSum(nums: number[], target: number): number[]',
      java: 'public int[] twoSum(int[] nums, int target)',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target)',
      swift: 'func twoSum(_ nums: [Int], _ target: Int) -> [Int]'
    },
    starter_code: {
      python: "def twoSum(nums, target):\n    # Write your code here\n    # Return [idx1, idx2]\n    pass\n",
      javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your code here\n    return [];\n}\n",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n    // Write your code here\n    return [];\n}\n",
      java: "import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}\n",
      cpp: "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};\n",
      c: "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}\n",
      csharp: "public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[0];\n    }\n}\n",
      go: "package main\n\nfunc twoSum(nums []int, target int) []int {\n    // Write your code here\n    return []int{}\n}\n",
      rust: "impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        // Write your code here\n        vec![]\n    }\n}\n",
      swift: "class Solution {\n    func twoSum(_ nums: [Int], _ target: Int) -> [Int] {\n        // Write your code here\n        return []\n    }\n}\n",
      kotlin: "class Solution {\n    fun twoSum(nums: IntArray, target: Int): IntArray {\n        // Write your code here\n        return intArrayOf()\n    }\n}\n",
      ruby: "def twoSum(nums, target)\n    # Write your code here\n    []\nend\n",
      php: "function twoSum($nums, $target) {\n    // Write your code here\n    return [];\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Example 1: target=9', input: '[[2, 7, 11, 15], 9]', expected: '[0, 1]' },
      { id: 2, name: 'Example 2: target=6', input: '[[3, 2, 4], 6]', expected: '[1, 2]' }
    ]
  },

  lc_add_two_numbers: {
    id: 'lc_add_two_numbers',
    title: '2. Add Two Numbers',
    platform: 'leetcode',
    difficulty: 'Medium',
    type: 'linked_list',
    instructions: `You are given two non-empty arrays representing two non-negative integers. The digits are stored in reverse order, and each element contains a single digit. Add the two numbers and return the sum as an array in reverse order.

### Example 1:
- **Input:** \`l1 = [2, 4, 3], l2 = [5, 6, 4]\`
- **Output:** \`[7, 0, 8]\`
- **Explanation:** 342 + 465 = 807.

### Example 2:
- **Input:** \`l1 = [0], l2 = [0]\`
- **Output:** \`[0]\`

### Constraints:
- Each list has \`1 <= length <= 100\`.
- \`0 <= digit <= 9\`.
- It is guaranteed that the list represents a number that does not have leading zeros.`,
    examples: [
      { input: 'l1 = [2, 4, 3], l2 = [5, 6, 4]', output: '[7, 0, 8]', explanation: '342 + 465 = 807.' },
      { input: 'l1 = [0], l2 = [0]', output: '[0]', explanation: '0 + 0 = 0.' }
    ],
    constraints: [
      'Each list has 1 <= length <= 100',
      '0 <= digit <= 9'
    ],
    function_signature: {
      python: 'def addTwoNumbers(l1: list[int], l2: list[int]) -> list[int]:',
      javascript: 'function addTwoNumbers(l1, l2)',
      typescript: 'function addTwoNumbers(l1: number[], l2: number[]): number[]',
      java: 'public int[] addTwoNumbers(int[] l1, int[] l2)',
      cpp: 'vector<int> addTwoNumbers(vector<int>& l1, vector<int>& l2)',
      swift: 'func addTwoNumbers(_ l1: [Int], _ l2: [Int]) -> [Int]'
    },
    starter_code: {
      python: "# Definition for singly-linked list or digit array representation\ndef addTwoNumbers(l1, l2):\n    # Write your code here\n    # Return the sum digits in reverse order\n    pass\n",
      javascript: "/**\n * @param {number[]} l1\n * @param {number[]} l2\n * @return {number[]}\n */\nfunction addTwoNumbers(l1, l2) {\n    // Write your code here\n    return [];\n}\n",
      typescript: "function addTwoNumbers(l1: number[], l2: number[]): number[] {\n    // Write your code here\n    return [];\n}\n",
      java: "import java.util.*;\n\nclass Solution {\n    public int[] addTwoNumbers(int[] l1, int[] l2) {\n        // Write your code here\n        return new int[]{};\n    }\n}\n",
      cpp: "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> addTwoNumbers(std::vector<int>& l1, std::vector<int>& l2) {\n        // Write your code here\n        return {};\n    }\n};\n",
      c: "int* addTwoNumbers(int* l1, int l1Size, int* l2, int l2Size, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}\n",
      csharp: "public class Solution {\n    public int[] AddTwoNumbers(int[] l1, int[] l2) {\n        // Write your code here\n        return new int[0];\n    }\n}\n",
      go: "package main\n\nfunc addTwoNumbers(l1 []int, l2 []int) []int {\n    // Write your code here\n    return []int{}\n}\n",
      rust: "impl Solution {\n    pub fn add_two_numbers(l1: Vec<i32>, l2: Vec<i32>) -> Vec<i32> {\n        // Write your code here\n        vec![]\n    }\n}\n",
      swift: "class Solution {\n    func addTwoNumbers(_ l1: [Int], _ l2: [Int]) -> [Int] {\n        // Write your code here\n        return []\n    }\n}\n",
      kotlin: "class Solution {\n    fun addTwoNumbers(l1: IntArray, l2: IntArray): IntArray {\n        // Write your code here\n        return intArrayOf()\n    }\n}\n",
      ruby: "def addTwoNumbers(l1, l2)\n    # Write your code here\n    []\nend\n",
      php: "function addTwoNumbers($l1, $l2) {\n    // Write your code here\n    return [];\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Example 1: 342 + 465 = 807', input: '[[2, 4, 3], [5, 6, 4]]', expected: '[7, 0, 8]' },
      { id: 2, name: 'Example 2: 0 + 0 = 0', input: '[[0], [0]]', expected: '[0]' }
    ]
  },

  hr_compare_triplets: {
    id: 'hr_compare_triplets',
    title: 'Compare the Triplets',
    platform: 'hackerrank',
    difficulty: 'Easy',
    type: 'warmup',
    instructions: `Alice and Bob each created one problem for HackerRank. A reviewer rates the two challenges, awarding points on a scale from 1 to 100 for three categories: problem clarity, originality, and difficulty.

The rating for Alice's challenge is the triplet \`a = (a[0], a[1], a[2])\`, and the rating for Bob's challenge is the triplet \`b = (b[0], b[1], b[2])\`.

The task is to find their comparison points by comparing \`a[0]\` with \`b[0]\`, \`a[1]\` with \`b[1]\`, and \`a[2]\` with \`b[2]\`:
- If \`a[i] > b[i]\`, Alice is awarded 1 point.
- If \`a[i] < b[i]\`, Bob is awarded 1 point.
- If \`a[i] = b[i]\`, neither receives a point.

Return an array with Alice's score first and Bob's second: \`[alice_score, bob_score]\`.`,
    examples: [
      { input: 'a = [5, 6, 7], b = [3, 6, 10]', output: '[1, 1]', explanation: 'a[0] > b[0] (Alice +1), a[1] == b[1] (no points), a[2] < b[2] (Bob +1).' }
    ],
    constraints: [
      '1 <= a[i], b[i] <= 100'
    ],
    function_signature: {
      python: 'def compareTriplets(a: list[int], b: list[int]) -> list[int]:',
      javascript: 'function compareTriplets(a, b)',
      typescript: 'function compareTriplets(a: number[], b: number[]): number[]',
      swift: 'func compareTriplets(a: [Int], b: [Int]) -> [Int]'
    },
    starter_code: {
      python: "def compareTriplets(a, b):\n    # Write your code here\n    # Return [alice_score, bob_score]\n    pass\n",
      javascript: "function compareTriplets(a, b) {\n    // Write your code here\n    return [0, 0];\n}\n",
      typescript: "function compareTriplets(a: number[], b: number[]): number[] {\n    // Write your code here\n    return [0, 0];\n}\n",
      swift: "func compareTriplets(a: [Int], b: [Int]) -> [Int] {\n    // Write your code here\n    return [0, 0]\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Sample 0: [5, 6, 7], [3, 6, 10]', input: '[[5, 6, 7], [3, 6, 10]]', expected: '[1, 1]' },
      { id: 2, name: 'Sample 1: [17, 28, 30], [99, 16, 8]', input: '[[17, 28, 30], [99, 16, 8]]', expected: '[2, 1]' }
    ]
  },

  hr_very_big_sum: {
    id: 'hr_very_big_sum',
    title: 'A Very Big Sum',
    platform: 'hackerrank',
    difficulty: 'Easy',
    type: 'warmup',
    instructions: `In this challenge, you are required to calculate and print the sum of the elements in an array, keeping in mind that some of those integers may be quite large.

### Function Description:
Complete the \`aVeryBigSum\` function in the editor below.

\`aVeryBigSum\` has the following parameter(s):
- \`int ar[n]\`: an array of integers

### Returns:
- \`long\`: the sum of all elements

### Constraints:
- \`1 <= n <= 10\`
- \`0 <= ar[i] <= 10^10\``,
    examples: [
      { input: '[1000000001, 1000000002, 1000000003, 1000000004, 1000000005]', output: '5000000015', explanation: 'Summing large 64-bit integers.' }
    ],
    constraints: ['1 <= n <= 10', '0 <= ar[i] <= 10^10'],
    function_signature: {
      python: 'def aVeryBigSum(ar: list[int]) -> int:',
      javascript: 'function aVeryBigSum(ar)',
      typescript: 'function aVeryBigSum(ar: number[]): number',
      swift: 'func aVeryBigSum(ar: [Int64]) -> Int64'
    },
    starter_code: {
      python: "def aVeryBigSum(ar):\n    # Write your code here\n    pass\n",
      javascript: "function aVeryBigSum(ar) {\n    // Write your code here\n}\n",
      typescript: "function aVeryBigSum(ar: number[]): number {\n    // Write your code here\n    return 0;\n}\n",
      swift: "func aVeryBigSum(ar: [Int64]) -> Int64 {\n    // Write your code here\n    return 0\n}\n"
    },
    sample_test_cases: [
      { id: 1, name: 'Sample 0: Big Sum', input: '[[1000000001, 1000000002, 1000000003, 1000000004, 1000000005]]', expected: '5000000015' }
    ]
  }
};

/**
 * Resolves a complete, high-fidelity question object from incoming job external_questions.
 */
export function enrichCodingQuestion(q, idx = 0) {
  const qId = (q.id || '').toLowerCase().trim();
  const qTitle = (q.title || '').toLowerCase().trim();

  // Find matching benchmark definition
  let matchedBenchmark = null;
  if (BENCHMARK_QUESTIONS[qId]) {
    matchedBenchmark = BENCHMARK_QUESTIONS[qId];
  } else {
    for (const key of Object.keys(BENCHMARK_QUESTIONS)) {
      const b = BENCHMARK_QUESTIONS[key];
      if (b.title.toLowerCase() === qTitle || qTitle.includes(b.title.toLowerCase()) || qId.includes(key)) {
        matchedBenchmark = b;
        break;
      }
    }
  }

  // If question already has rich backend instructions, prioritize them
  const hasExistingRichInstructions = Boolean(
    q.instructions &&
    q.instructions.length > 80 &&
    !q.instructions.includes('Write clean, efficient code that passes all')
  );

  const fallbackInstructions = matchedBenchmark?.instructions || (
    `Solve the challenge "${q.title || 'Coding Problem'}".\n\n` +
    `### Instructions:\n` +
    `Implement an optimal, production-grade algorithm that satisfies the requirements.\n` +
    `Ensure edge cases, boundary invariants, and execution time limits are respected.\n\n` +
    `### Return Value:\n` +
    `Return the computed result directly from the target function.`
  );

  const cleanEntryPoint = (q.title || 'solve')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  // Assemble full 13-language starter codes
  const allLangs = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'swift', 'kotlin', 'ruby', 'php'];
  const compiledStarterCodes = { ...(matchedBenchmark?.starter_code || {}), ...(q.starter_code || {}) };
  allLangs.forEach(lang => {
    if (!compiledStarterCodes[lang] || !compiledStarterCodes[lang].trim()) {
      compiledStarterCodes[lang] = generateDefaultStarter(lang, cleanEntryPoint);
    }
  });

  return {
    id: q.id || `ext_q_${idx}`,
    title: q.title || matchedBenchmark?.title || `Problem ${idx + 1}`,
    difficulty: q.difficulty || matchedBenchmark?.difficulty || 'Medium',
    platform: q.platform || matchedBenchmark?.platform || 'leetcode',
    type: q.type || matchedBenchmark?.type || 'coding',
    instructions: hasExistingRichInstructions ? q.instructions : fallbackInstructions,
    examples: (q.examples && q.examples.length > 0) ? q.examples : (matchedBenchmark?.examples || []),
    constraints: (q.constraints && q.constraints.length > 0) ? q.constraints : (matchedBenchmark?.constraints || []),
    function_signature: q.function_signature || matchedBenchmark?.function_signature || {},
    starter_code: compiledStarterCodes,
    sample_test_cases: (q.sample_test_cases && q.sample_test_cases.length > 0)
      ? q.sample_test_cases
      : (matchedBenchmark?.sample_test_cases || [])
  };
}
