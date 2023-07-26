---
created: 2023-05-21
title: 242. Valid Anagram
layout: pspost
tags: [array, hash-table, sorting]
category: Array
difficulty: easy
---

## Problem Description

Given two strings `s` and `t`, return `true` _if_ `t` _is an anagram of_ `s`_, and_ `false` _otherwise_.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
<pre><code><b>Input:</b> s = "anagram", t = "nagaram"
<b>Output:</b> true
</code></pre>

**Example 2:**
<pre><code><b>Input:</b> s = "rat", t = "car"
<b>Output:</b> false
</code></pre>

**Constraints:**

- <code>1 <= s.length, t.length <= 5 * 10<sup>4</sup></code>
- `s` and `t` consist of lowercase English letters.

**Follow up:** What if the inputs contain Unicode characters? How would you adapt your solution to such a case?

## Solution

```python
from collections import defaultdict

class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        
        if set(s) != set(t):
            return False

        d = defaultdict(int)

        for i, j in zip(s, t):
            d[i] += 1
            d[j] -= 1

        for key, val in d.items():
            if val != 0:
                return False
        return True
```


- 우선 두 문자열의 길이가 다르면 무조건 Anagram이 아님
- 두 문자열이 문자의 종류와 그 숫자가 같다면 문자를 키로 하는 딕셔너리를 만들었을 때 
	- 첫 번째 문자열에 대해서는 해당 문자에 1을 더하고, 두 번째 문자열에 대해서는 해당 문자에 대해 1을 빼서
	- 딕셔너리의 모든 값이 0이어야 함
- 시간 복잡도와 공간 복잡도 모두 $O(N)$