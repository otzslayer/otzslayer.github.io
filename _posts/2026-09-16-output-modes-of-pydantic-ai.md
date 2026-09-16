---
created: 2026-09-16
title: Pydantic AI의 세 가지 출력 모드
layout: post
tags: [pydantic-ai, structured-output, llm, agent]
category: AI Engineering
permalink: /ai-engineering/:year/:month/:day/:title.html
image:
  path: https://pub-519d95dbc82948c295bcf57354a5880c.r2.dev/images/673b38fb768f9da0f4143f2ac6773ebf.png
  alt: Image from [Unsplash](https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%ED%85%8D%EC%8A%A4%ED%8A%B8-%EB%B0%95%EC%8A%A4%EC%99%80-%ED%99%94%EC%82%B4%ED%91%9C%EA%B0%80-%EC%9E%88%EB%8A%94-%ED%94%8C%EB%A1%9C%EC%9A%B0%EC%B0%A8%ED%8A%B8-_XXNjSziZuA)
---

요즘 저는 Pydantic AI 공식 문서를 토대로 다시 공부해보고 있습니다. 워낙 코딩 에이전트를 자주 쓰다 보니까 감각을 잃는 것 같아서요. 그러다 조금 오래 붙잡게 된 내용이 바로 **출력 모드(output mode)**였습니다.

Pydantic AI에서 `output_type`에 Pydantic 모델을 넘기면 에이전트는 그 모델의 구조를 그대로 따르는 값을 돌려줍니다. 모델로부터 값을 받아내는 [세 가지 방법](https://pydantic.dev/docs/ai/core-concepts/output/#output-modes)은 `ToolOutput`, `NativeOutput`, `PromptedOutput`이라는 마커 클래스로 구분합니다. 사실 세 클래스 중 어느 것을 써도 결과는 거의 같습니다. 하지만 실제로 돌려보면 요청의 형태, 토큰 비용, 재시도 방식이 모두 다른 데다 **모델에 따라서는 아예 쓸 수 없는 모드도 있습니다.** 이 글에서는 예제로 세 방식이 어떻게 다른지 다룹니다.

이 글에 포함한 예제는 모두 아래 조건에서 실행했습니다. Pydantic AI 버전이 바뀔 때마다 모델 프로파일과 프로바이더 코드가 바뀔 수 있으므로 참고하시길 바랍니다.

| 항목          | 값                                |
| ------------- | --------------------------------- |
| `pydantic-ai` | `2.29.0`                          |
| 모델          | `openai:gpt-5.6-luna` (추론 모델) |
| 확인 시점     | 2026년 9월                        |

## 세 가지 출력 모드

세 가지 출력 모드는 **출력 스키마를 요청의 어디에 적어서 보내는지**에 따라 구분됩니다.

- **Tool Output:** 출력 타입의 JSON 스키마를 **`final_result`**라는 특별한 출력 툴(output tool)에 파라미터 스키마로 넘깁니다. 모델은 이 툴을 호출하는 방식으로 답을 냅니다. 출력 모드의 기본값입니다.
- **Native Output:** 모델 API의 구조화 출력 기능, 흔히 "JSON Schema response format"이라 부르는 기능에 스키마를 넘깁니다. 모델은 스키마에 맞는 텍스트만 생성하도록 API 수준[^1]에서 강제됩니다.
- **Prompted Output:** 지시(instructions) 본문에 스키마를 글로 적어 넣고 모델이 돌려준 평문을 파싱합니다. 모델이 스키마를 지킬 의무는 없습니다.

공식 문서는 세 가지 출력 모드를 아래와 같이 설명합니다.
- Tool Output이 기본값인 이유는 "사실상 모든 모델이 지원하고 매우 잘 동작한다고 확인되었기 때문"입니다.[^2]
- Native Output 항목에는 "모든 모델이 지원하지는 않고 제약이 따르기도 한다"고 적혀 있습니다.
- Prompted Output 항목에서는 "모든 모델에서 쓸 수 있지만 모델이 스키마를 강제로 따르지 않으므로 대체로 가장 불안정하다"고 언급합니다.

## 예시로 비교하기

출장비 정산 결재 요청서를 올리는 시나리오를 구성하여 세 가지 출력 모드를 비교해보겠습니다. 

```python
from typing import Literal

from pydantic import BaseModel


class LineItem(BaseModel):
    """정산 항목 한 줄."""

    name: str
    category: Literal["항공", "숙박", "교통", "식대", "기타"]
    amount: int


class ExpenseReport(BaseModel):
    """출장 정산 결재 요청서."""

    title: str
    items: list[LineItem]
    total: int
    receipt_missing: list[str] = []
    memo: str | None = None
```

위와 같이 결재 요청서 스키마인 `ExpenseReport`는 각 항목을 `LineItem`으로 나타내고 비용 분류는 `LineItem`의 `category` 필드에 `Literal`로 묶어 두었습니다.

### 예시 코드

위에서 언급했듯이 파싱된 값만 보면 세 모드의 차이를 확인하기 어렵습니다. 셋 다 `ExpenseReport`로 반환하기 때문입니다. 차이를 확인하려면 메시지 기록(`result.all_messages()`)을 살펴봐야 합니다.

```python
from collections.abc import Sequence

from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
)


def dump_parts(tag: str, messages: Sequence[ModelMessage]) -> None:
    """응답이 어떤 파트로 왔는지 확인합니다."""
    for message in messages:
        if not isinstance(message, ModelResponse):
            continue
        for part in message.parts:
            if isinstance(part, ToolCallPart):
                log.info("[%s] 응답 파트=ToolCallPart 툴이름=%s", tag, part.tool_name)
            elif isinstance(part, TextPart):
                log.info("[%s] 응답 파트=TextPart 길이=%d", tag, len(part.content))
            else:
                log.info("[%s] 응답 파트=%s", tag, type(part).__name__)


def dump_raw(tag: str, messages: Sequence[ModelMessage]) -> None:
    """툴 호출이면 인자 JSON을, 평문이면 본문을 그대로 출력합니다."""
    for message in messages:
        if not isinstance(message, ModelResponse):
            continue
        for part in message.parts:
            if isinstance(part, ToolCallPart):
                log.info("[%s] 툴 인자=%s", tag, part.args_as_json_str())
            elif isinstance(part, TextPart):
                log.info("[%s] 본문=%s", tag, part.content)


def dump_instructions(tag: str, messages: Sequence[ModelMessage]) -> None:
    """메시지 기록에 남은 지시를 출력합니다."""
    for message in messages:
        if isinstance(message, ModelRequest) and message.instructions:
            log.info("[%s] 지시=\n%s", tag, message.instructions)
```

이제 프롬프트와 지시를 똑같이 두고 `output_type`만 `ToolOutput`, `NativeOutput`, `PromptedOutput`으로 감싸서 에이전트를 따로 만들어 출력해봅니다.

```python
from pydantic_ai import Agent, NativeOutput, PromptedOutput, ToolOutput

MODEL = "openai:gpt-5.6-luna"

prompt = (
    "출장 정산이다. 인천-후쿠오카 왕복 항공권 820000원, "
    "하카타역 호텔 2박 310000원, 공항철도 9500원을 올린다. "
    "호텔 영수증은 아직 받지 못했다."
)
instructions = (
    "출장 정산 요청을 결재 요청서로 옮긴다. "
    "total은 items의 amount 합계다. "
    "영수증을 받지 못한 항목의 이름만 receipt_missing에 담는다."
)

tool_agent: Agent[None, ExpenseReport] = Agent(
    MODEL,
    output_type=ToolOutput(ExpenseReport),
    instructions=instructions,
)
native_agent: Agent[None, ExpenseReport] = Agent(
    MODEL,
    output_type=NativeOutput(ExpenseReport),
    instructions=instructions,
)
prompted_agent: Agent[None, ExpenseReport] = Agent(
    MODEL,
    output_type=PromptedOutput(ExpenseReport),
    instructions=instructions,
)

for tag, agent in (
    ("tool", tool_agent),
    ("native", native_agent),
    ("prompted", prompted_agent),
):
    result = agent.run_sync(prompt)
    log.info("[modes] %s -> %r", tag, result.output)
    log.info(
        "[modes] %s 입력 토큰=%d 출력 토큰=%d",
        tag,
        result.usage.input_tokens,
        result.usage.output_tokens,
    )
    dump_parts(f"modes/{tag}", result.all_messages())
    dump_raw(f"modes/{tag}", result.all_messages())
    if tag == "prompted":
        dump_instructions(f"modes/{tag}", result.all_messages())
```

위 코드의 실행 결과는 아래와 같습니다. 가독성을 높이기 위해 실제 출력에서 들여쓰기를 조금 추가했습니다.

```
[modes] tool -> ExpenseReport(
	title='출장 정산 결재 요청서',
	items=[
		LineItem(
			name='인천-후쿠오카 왕복 항공권',
			category='항공',
			amount=820000
		), 
		LineItem(
			name='하카타역 호텔 2박',
			category='숙박',
			amount=310000
		),
		LineItem(
			name='공항철도',
			category='교통',
			amount=9500
		)
	], 
	total=1139500,
	receipt_missing=['하카타역 호텔 2박'],
	memo=None
)
[modes] tool 입력 토큰=280 출력 토큰=154
[modes/tool] 응답 파트=ThinkingPart
[modes/tool] 응답 파트=ToolCallPart 툴이름=final_result
[modes/tool] 툴 인자={
	"title":"출장 정산 결재 요청서",
	"items":[
		{
			"name":"인천-후쿠오카 왕복 항공권",
			"category":"항공",
			"amount":820000
		},
		{
			"name":"하카타역 호텔 2박",
			"category":"숙박",
			"amount":310000
		},
		{
			"name":"공항철도",
			"category":"교통",
			"amount":9500
		}
	],
	"total":1139500,
	"receipt_missing":["하카타역 호텔 2박"]
}

[modes] native -> ExpenseReport(
	title='인천-후쿠오카 출장 정산 결재 요청서', 
	items=[
		LineItem(
			name='인천-후쿠오카 왕복 항공권',
			category='항공',
			amount=820000
		), 
		LineItem(
			name='하카타역 호텔 2박',
			category='숙박', 
			amount=310000
		), 
		LineItem(
			name='공항철도',
			category='교통',
			amount=9500
		)
	], 
	total=1139500, 
	receipt_missing=['하카타역 호텔 2박'],
	memo=None
)
[modes] native 입력 토큰=359 출력 토큰=175
[modes/native] 응답 파트=ThinkingPart
[modes/native] 응답 파트=TextPart 길이=261
[modes/native] 본문={
	"title":"인천-후쿠오카 출장 정산 결재 요청서",
	"items":[
		{
			"name":"인천-후쿠오카 왕복 항공권",
			"category":"항공",
			"amount":820000
		},
		{
			"name":"하카타역 호텔 2박",
			"category":"숙박",
			"amount":310000
		},
		{
			"name":"공항철도",
			"category":"교통",
			"amount":9500
		}
	],
	"total":1139500,
	"receipt_missing":["하카타역 호텔 2박"],
	"memo":null
}
[modes] prompted -> ExpenseReport(
	title='출장 정산 결재 요청',
	items=[
		LineItem(
			name='인천-후쿠오카 왕복 항공권',
			category='항공',
			amount=820000
		), 
		LineItem(
			name='하카타역 호텔 2박',
			category='숙박',
			amount=310000
		), 
		LineItem(
			name='공항철도',
			category='교통',
			amount=9500
		)
	], 
	total=1139500, 
	receipt_missing=['하카타역 호텔 2박'], 
	memo=None
)

[modes] prompted 입력 토큰=675 출력 토큰=155
[modes/prompted] 응답 파트=ThinkingPart
[modes/prompted] 응답 파트=TextPart 길이=252
[modes/prompted] 본문={
	"title":"출장 정산 결재 요청",
	"items":[
		{
			"name":"인천-후쿠오카 왕복 항공권",
			"category":"항공",
			"amount":820000
		},
		{
			"name":"하카타역 호텔 2박",
			"category":"숙박",
			"amount":310000
		},{
			"name":"공항철도",
			"category":"교통",
			"amount":9500
		}
	],
	"total":1139500,
	"receipt_missing":["하카타역 호텔 2박"],
	"memo":null
}
[modes/prompted] 지시=
출장 정산 요청을 결재 요청서로 옮긴다. total은 items의 amount 합계다. 영수증을 받지 못한 항목의 이름만 receipt_missing에 담는다.
```

### 결과 확인

#### 1. 응답 파트가 다름

파싱된 값은 모두 `ExpenseReport`이고 항목 세 줄과 합계 1,139,500원까지 모두 같습니다. 다만 Tool Output은 `ToolCallPart`의 인자로 응답을 보냈고 Native Output과 Prompted Output은 `TextPart`의 본문으로 응답을 보냈습니다. Native Output과 Prompted Output에서는 모델이 JSON 텍스트를 직접 쓰고 Pydantic AI가 그 텍스트를 파싱해 검증하는 절차를 거칩니다. 모델 입장에서는 아주 다른 작업이죠.[^3]

#### 2. 선택 필드를 다루는 방식이 다름

Tool Output에서 툴 인자를 보면 `memo` 키가 아예 없습니다. 반대로 Native Output과 Prompted Output에선 `"memo":null`이 있는 걸 확인할 수 있습니다. 파싱된 `ExpenseReport` 값에는 모두 `memo=None`이 들어 있습니다. Pydantic이 빠진 키를 기본값으로 채웠기 때문에 파싱된 값만으로는 차이를 바로 확인할 수 없습니다. 원문 JSON을 직접 읽는 코드가 있었다면 모드를 바꾸는 순간 `KeyError`가 발생할 수 있습니다.

참고로 `ToolOutput(ExpenseReport, strict=True)`로 수정해 다시 실행하면 툴 인자에 `"memo":null`이 추가됩니다. 입력 토큰은 280에서 271로 줄어들고요. Strict 모드에서는 모든 키를 필수로 요구하는 형태로 스키마가 변환되기 때문입니다.

```ts
// strict 없음
receipt_missing?: string[], // default: []
memo?: string | null, // default: null

// strict=True
receipt_missing: string[],
memo: string | null,

// 주석 내용이 사라지며 입력 토큰이 줄어듦.
```

#### 3. 입력 토큰이 크게 다름

같은 스키마지만 Tool Output에선 입력 토큰 수가 280, Native Output에선 359, Prompted Output에선 675입니다. Tool Output과 Native Output은 API가 스키마만 받도록 마련해 둔 전용 필드에 스키마를 채워 넣습니다. 두 방식은 입력 토큰 수가 다소 다른데 이 차이는 사실 Pydantic AI 쪽에서 생기지 않습니다. Pydantic AI는 두 모드에 같은 JSON 스키마를 보내지만, 프로바이더가 그 스키마를 모델 입력으로 바꾸는 형태가 필드마다 다릅니다. 아래 코드 블록은 모델이 읽는 입력을 보여 주는 예시입니다. 호스팅 모델에 실제로 들어가는 입력은 API로 볼 수 없어서 공개된 gpt-oss의 Harmony 렌더링 규칙에 맞춰 재구성했습니다. 대충 보더라도 Tool Output 쪽 입력이 더 짧죠. 참고로 이 글에서는 `gpt-5.6-luna` 모델을 사용했기 때문에 아래 입력은 Harmony 포맷으로 작성되어 있습니다.

```
Tool: 스키마는 TypeScript 함수 선언으로 바뀝니다.

<|start|>developer<|message|># Instructions

출장 정산 요청을 결재 요청서로 옮긴다. total은 items의 amount 합계다. ...

# Tools

## functions

namespace functions {

// 출장 정산 결재 요청서.
type final_result = (_: {
title: string,
items: Array<
// 정산 항목 한 줄.
{
name: string,
category: "항공" | "숙박" | "교통" | "식대" | "기타",
amount: number,
}
>,
total: number,
receipt_missing?: string[], // default: []
memo?: string | null, // default: null
}) => any;

} // namespace functions<|end|>

Native: 스키마가 JSON 그대로 들어갑니다.

<|start|>developer<|message|># Instructions

출장 정산 요청을 결재 요청서로 옮긴다. total은 items의 amount 합계다. ...

# Response Formats

## ExpenseReport

// 출장 정산 결재 요청서.
{"properties":{"title":{"type":"string"},"items":{"items":{"$ref":"#/$defs/LineItem"},"type":"array"},"total":{"type":"integer"},"receipt_missing":{"default":[],"items":{"type":"string"},"type":"array"},"memo":{"default":null,"anyOf":[{"type":"string"},{"type":"null"}]}},"required":["title","items","total"],"type":"object","additionalProperties":false,"$defs":{"LineItem":{"description":"정산 항목 한 줄.","properties":{"name":{"type":"string"},"category":{"enum":["항공","숙박","교통","식대","기타"],"type":"string"},"amount":{"type":"integer"}},"required":["name","category","amount"],"type":"object","additionalProperties":false}}}<|end|>
```

Prompted Output은 프롬프트 본문 자체를 늘립니다. Prompted Output 모드에서 지시에 덧붙이는 기본 프롬프트 템플릿은 아래와 같습니다.[^4]

```python
DEFAULT_PROMPTED_OUTPUT_TEMPLATE = dedent(
    """
    Always respond with a JSON object that's compatible with this schema:

    {schema}

    Don't include any text or Markdown fencing before or after.
    """
)
```

스키마가 커질수록 이 차이도 커지기 때문에 토큰 비용을 줄이려면 Prompted Output을 되도록 맨 마지막 후보로 두는 게 좋습니다.

## 모드별 특징과 장단점 

예시에서 모드마다 큰 차이가 있다는 것을 확인했습니다. 이제 각 모드의 특징과 장단점을 살펴보겠습니다.

### ToolOutput

앞서 설명했듯이 `ToolOutput`은 기본 모드이기 때문에 대부분의 경우 명시하지 않고 `output_type=ExpenseReport`로만 적어도 됩니다. 참고로 모드를 명시하지 않으면 모델 프로파일의 `default_structured_output_mode`를 따르며 이 값의 기본값은 `'tool'`입니다. 

`ToolOutput`이 받는 인자는 아래와 같습니다.

| 인자 | 역할 |
| --- | --- |
| `name` | 출력 툴 이름. 기본은 `final_result`이고 후보가 여럿이면 `final_result_<타입>` |
| `description` | 출력 툴 설명. 기본은 타입의 docstring |
| `strict` | strict 모드 사용 여부 |
| `max_retries` | 이 출력 툴 하나의 재시도 한도 |
| `sequential` | 다른 툴 호출과 겹치지 않도록 이 출력 툴을 단독으로 실행할지 여부 |

출력 후보가 여럿이면 모델은 `name`과 `description`을 보고 출력 툴을 고릅니다. 예를 들어 결재 한도만 지시로 알려주고 승인과 반려를 각각 출력 툴로 등록합니다.

```python
agent = Agent[Ledger, Approval | Rejection](
    MODEL,
    deps_type=Ledger,
    output_type=[
        ToolOutput(Approval, name="approve", description="한도 안이면 이것"),
        ToolOutput(
            Rejection, name="reject", description="한도를 넘으면 이것"
        ),
    ],
)


@agent.instructions
def limits(ctx: RunContext[Ledger]) -> str:
    return f"결재 한도는 {ctx.deps.limit}원이다."


result = agent.run_sync("전세기 45000000원이다.", deps=make_ledger())
log.info("[tool_name] output=%r", result.output)
dump_parts("tool_name", result.all_messages())
```

```
[tool_name] output=Rejection(
	item='전세기',
	reason='결재 금액 45,000,000원은 결재 한도 1,000,000원을 초과합니다.'
)
[tool_name] 응답 파트=ThinkingPart
[tool_name] 응답 파트=ToolCallPart 툴이름=reject
```

별도의 지시가 없었는데도 모델은 알아서 `reject`를 골랐습니다. 공식 문서에서는 이처럼 출력 후보를 여러 개의 작은 툴로 나누는 방식을 "스키마 복잡도를 줄이고 모델이 올바르게 응답할 가능성을 높이는 것"이라고 설명합니다.[^5] 이와 다르게 `NativeOutput`이나 `PromptedOutput`은 같은 상황에서 후보를 여러 개 받더라도 하나의 스키마로 합쳐서 보냅니다.

재시도 예산을 다루는 방식도 다른 두 모드와 다릅니다. Tool Output에선 출력 툴마다 카운터가 따로 있고 `Agent(retries={"output": N})`으로 준 값은 툴 하나당 기본 한도가 됩니다. 반면 Native Output과 Prompted Output은 텍스트 경로로 분류되기 때문에 실행 전체가 예산 하나를 나눠 씁니다.

- 장점
	- 거의 모든 모델이 지원하는 툴 호출 규약을 사용하여 호환 범위가 가장 넓음
	- 출력 후보마다 툴을 따로 둬서 스키마를 작게 유지할 수 있고 이름과 설명을 통해 모델의 선택을 유도할 수 있음
	- 입력 토큰이 다른 모드보다 더 적음
	- `max_retries`로 출력 툴마다 재시도 한도를 다르게 둘 수 있음
- 단점
	- 툴 호출 강제를 받아들이지 못하는 모델이나 설정에서는 오류가 발생함[^6]

### NativeOutput

`NativeOutput`은 OpenAI의 [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs), Gemini의 [Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output#structured_outputs_with_tools), Claude의 [Structured Outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)처럼 모델 프로바이더가 직접 구현한 구조화 출력 기능을 사용합니다. 디코딩 단계에서 스키마를 벗어난 토큰이 애초에 생성되지 않도록 막는 방식이라 형식 보장이 가장 강합니다. 

`NativeOutput`에 사용하는 인자는 아래와 같습니다.

| 인자          | 역할                                              |
| ------------- | ------------------------------------------------- |
| `name`        | 구조화 출력의 이름                                |
| `description` | 구조화 출력의 설명                                |
| `strict`      | 모델이 지원하면 strict 모드 사용                  |
| `template`    | 스키마를 지시에도 넣을 때 쓸 템플릿. `False`면 끔 |

모델은 최종 결과와 함께 함수 툴 호출을 보내기도 합니다. 이때 함수 툴을 실행할지, 실행한다면 어떤 순서로 실행할지는 에이전트를 처음 초기화할 때 `Agent()`에 넘기는 `end_strategy` 인자로 정합니다. 최종 결과가 출력 툴로 오든 구조화된 텍스트로 오든 같은 인자가 적용됩니다. `end_strategy`에 줄 수 있는 값은 아래와 같습니다.

- `"graceful"` (기본값)
	- 출력 툴은 호출된 순서대로 실행하고 처음 성공한 결과를 최종 결과로 채택합니다. 그 뒤의 출력 툴은 건너뜁니다.
	- 함수 툴은 호출된 순서대로 모두 실행합니다.
- `"early"`
	- 출력 툴은 호출된 순서대로 실행하다가 처음 성공한 시점에 실행을 끝냅니다.
	- 함수 툴은 실행하지 않고 건너뜁니다. 다만 출력이 모두 실패하면 함수 툴을 실행하고 실행을 이어 갑니다.
- `"exhaustive"`
	- 출력 툴과 함수 툴을 모두 병렬로 실행하고 호출 순서상 처음 나온 유효한 결과를 최종 결과로 채택합니다.

`str`이나 `TextOutput` 같은 평문 출력은 예외여서 `early`에서도 함께 호출된 함수 툴을 건너뛰지 않습니다. 모델은 자신이 쓴 텍스트가 최종 결과로 쓰인다는 사실을 모르기 때문입니다.

- 장점
	- API 수준에서 스키마 준수를 강제하기 때문에 형식 오류로 재시도할 일이 줄어듦
	- 응답이 평범한 텍스트 파트로 오기 때문에 툴 호출 강제를 거치지 않음
	- 자체 서빙 환경에선 구조적 디코딩(guided decoding)이 그대로 적용됨
- 단점
	- 모델마다 지원 여부가 다름
	- Tool Output보다 토큰을 더 사용하는 경우가 있음

### PromptedOutput

`PromptedOutput`은 가장 원시적인 방법입니다. 지시에 스키마를 적고 "이 모양으로 답하라"고 요청한 뒤 모델이 응답한 텍스트를 파싱하는 방식입니다. 

`PromptedOutput`에 사용하는 인자는 아래와 같습니다.

| 인자          | 역할                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | 구조화 출력의 이름                                                     |
| `description` | 구조화 출력의 설명                                                     |
| `template`    | 스키마를 넣을 템플릿. `{schema}` 자리에 스키마가 들어가며 `False`면 끔 |

- 장점
	- 툴 호출이나 구조화된 출력 기능이 필요 없기 때문에 어떤 모델에서든 동작함
		- Tool Output이나 Native Output을 지원하지 않는 모델에서도 쓸 수 있는 대안이 됨
	- 템플릿을 직접 고칠 수 있어서 모델별 프롬프트 튜닝 여지가 있음
- 단점
	- 스키마 준수가 강제되지 않아 가장 불안정함
		- 검증에 실패하면 Pydantic AI가 재시도를 요청하지만 모델 성능이 부족하면 계속 실패할 수 있음
	- 추가 프롬프트가 있기 때문에 입력 토큰이 가장 많이 소모됨
	- 덧붙인 스키마가 메시지 기록에 남지 않아 비용 증가를 확인하기 어려움

### 비교하기

| 구분                       | `ToolOutput`              | `NativeOutput`             | `PromptedOutput`        |
| -------------------------- | ------------------------- | -------------------------- | ----------------------- |
| 스키마를 포함하는 위치     | 출력 툴의 파라미터 스키마 | 응답 형식(response format) | 지시 본문               |
| 응답 파트                  | `ToolCallPart`            | `TextPart`                 | `TextPart`              |
| 스키마 준수 강제           | 툴 호출 규약              | 프로바이더 API             | 없음 (JSON 모드는 선택) |
| 모델 지원                  | 사실상 전부               | 제약 있음                  | 전부                    |
| 입력 토큰                  | 가장 적음                 | 적음                       | 많음                    |
| `strict` 없이 선택 필드 키 | 빠질 수 있음              | 채워짐                     | 채워짐                  |
| 재시도 예산 단위           | 출력 툴 하나당            | 실행 전체 공유             | 실행 전체 공유          |

---


[^1]: 제약 디코딩(Constrained Decoding)을 의미합니다. 다음 토큰을 고를 때 스키마에 없는 값을 고르지 않도록 제약을 줍니다.

[^2]: [Pydantic AI 문서: Tool Output](https://pydantic.dev/docs/ai/core-concepts/output/#tool-output). 원문은 "This is the default as it's supported by virtually all models and has been shown to work very well."입니다.

[^3]: 세 모드 모두 `ThinkingPart`가 먼저 찍혀 있습니다. 사용한 모델인 `gpt-5.6-luna`가 추론 모델이기 때문입니다.

[^4]: [API: `DEFAULT_PROMPTED_OUTPUT_TEMPLATE`](https://pydantic.dev/docs/ai/api/pydantic-ai/profiles/). 모델 프로파일의 `prompted_output_template`으로 모델마다 다른 템플릿을 둘 수 있습니다.

[^5]: [Pydantic AI 문서: Output](https://pydantic.dev/docs/ai/core-concepts/output/#structured-output). "each member is registered with the model as a separate output tool in order to reduce the complexity of the schema and maximise the chances a model will respond correctly."

[^6]: 지금은 전혀 문제가 없지만 올해 초(2026년 봄)에 제가 vLLM으로 gpt-oss-120B를 서빙하여 Pydantic AI를 사용할 때는 vLLM이 gpt-oss-120B가 쓰는 Harmony 포맷에서 구조화된 출력(structured output)을 제대로 지원하지 못해 Tool Output을 사용할 수 없었습니다. 당시에 그 문제를 해결하려면 `profile=harmony_model_profile("gpt-oss-120b")`를 강제 주입하거나 NativeOutput을 사용해야 했습니다.
