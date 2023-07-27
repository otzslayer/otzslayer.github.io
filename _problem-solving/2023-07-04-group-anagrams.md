---
created: 2023-07-04
title: 49. Group Anagrams
layout: pspost
tags: [array, hash-table, string, sorting]
category: Array
difficulty: medium
---

## Problem Description

Given an array of strings `strs`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
<pre><code><b>Input:</b> strs = ["eat","tea","tan","ate","nat","bat"]
<b>Output:</b> [["bat"],["nat","tan"],["ate","eat","tea"]]
</code></pre>

**Example 2:**
<pre><code><b>Input:</b> strs = [""]
<b>Output:</b> [[""]]
</code></pre>

**Example 3:**
<pre><code><b>Input:</b> strs = ["a"]
<b>Output:</b> [["a"]]
</code></pre>

**Constraints:**

- <code>1 <= strs.length <= 10<sup>4</sup></code>
- `0 <= strs[i].length <= 100`
- `strs[i]` consists of lowercase English letters.

## Solution

```python
class Solution:
    def groupAnagrams(self, strs):
        anagram_map = defaultdict(list)
        
        for word in strs:
            sorted_word = ''.join(sorted(word))
            anagram_map[sorted_word].append(word)
        
        return list(anagram_map.values())
```

- Hashmap과 정렬을 사용
- 각 문자열마다 정렬하고 정렬한 단어를 키, 원래 단어가 포함된 리스트를 값으로 하는 딕셔너리 생성
- 딕셔너리의 값만 반환하면 됨
- 시간 복잡도는 입력 리스트 길이 $m$, 각 단어 길이 $n$에 대해서
	- $O(m \times n\log n)$
- 공간 복잡도는 $O(m)$