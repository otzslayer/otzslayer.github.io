---
created: 2023-05-21
title: 217. Contains Duplicate
layout: pspost
tags: [array, hash-table, sorting]
category: Array
difficulty: easy
---

## Problem Description

Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.

**Example 1:**
<pre><code><b>Input:</b> nums = [1,2,3,1]
<b>Output:</b> true
</code></pre>

**Example 2:**
<pre><code><b>Input:</b> nums = [1,2,3,4]
<b>Output:</b> false
</code></pre>

**Example 3:**
<pre><code><b>Input:</b> nums = [1,1,1,3,3,4,3,2,4,2]
<b>Output:</b> true
</code></pre>

**Constraints:**

- <code>1 <= nums.length <= 10<sup>5</sup></code>
- <code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code>

## Solution

```python
class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        hashset = set()
        for n in nums:
            if n not in hashset:
                hashset.add(n)
            else:
                return True
        return False
```

- Hash set이나 Hash table을 쓰는 것이 가장 효율적
- 시간 복잡도와 공간 복잡도 모두 $O(N)$