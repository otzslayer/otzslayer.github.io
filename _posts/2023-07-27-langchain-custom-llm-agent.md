---
layout: post
title: 커스텀 LLM 에이전트
tags: [llm, langchain, agent]
category: LLM
image:
  path: https://i.imgur.com/tAjMXbv.png
  alt: Image from [here](https://betterprogramming.pub/make-langchain-agent-actually-works-with-local-llms-vicuna-wizardlm-etc-da42b6b1a97)
---

사내에 공유할 정보가 있어 [LangChain](https://python.langchain.com/docs/modules/agents/how_to/custom_llm_chat_agent) 문서를 번역하였습니다.
개인적으로 LangChain은 좋은 도구지만 여러 문제가 있다고 생각하는데 나중에 기회가 되면 짧은 포스트로 생각을 남겨볼까 합니다.

---

## 커스텀 LLM 에이전트 (`ChatModel` 없이)

LLM 챗 에이전트(LLM chat agent)는 다음 세 개의 파트로 구성되어 있습니다.

- `PromptTemplate`: 언어 모델에 수행할 작업을 지시하는 데 사용할 수 있는 프롬프트 템플릿
- `ChatModel`: 에이전트에 사용하는 언어 모델
- `stop` 시퀀스: 이 문자열이 발견되는 즉시 LLM이 생성 작업을 중단하도록 지시합니다.
- `OutputParser`: `LLMOutput`을 `AgentAction`이나 `AgentFinish` 객체로 파싱하는 방법을 결정합니다.

`LLMAgent`는 `AgentExecutor`에서 사용됩니다. 이 `AgentExecutor`는 다음 수행 절차의 반복으로 볼 수 있습니다.

1. 사용자 입력이나 모든 이전단계를 `LLMAgent`에 전달합니다.
2. 에이전트가 `AgentFinish`를 반환하면 바로 사용자에게 결과를 반환합니다.
3. 에이전트가 `AgentAction`을 반환하면 이를 사용하여 도구를 호출하고 `Observation`을 가져옵니다.
4. `AgentAction`과 `Observation`을 `AgentFinish`가 등장할 때까지 다시 에이전트에 전달하는 일을 반복합니다.

`AgentAction`은 `action`과 `action_input`으로 구성된 어떤 응답입니다.
`action`은 사용할 도구를, `action_input`은 그 도구에 대한 입력값을 나타냅니다.
`log`는 추가 컨텍스트(로깅, 추적 등에 사용할 수 있음)로 제공될 수도 있습니다.

`AgentFinish`는 사용자에게 다시 보낼 최종 메시지가 포함된 응답입니다. 이 응답은 에이전트 실행을 종료하는데 사용되어야 합니다.

```python
import re
from getpass import getpass
from typing import List, Union

from langchain import LLMChain, SerpAPIWrapper
from langchain.agents import (
    AgentExecutor,
    AgentOutputParser,
    LLMSingleActionAgent,
    Tool,
)
from langchain.chat_models import ChatOpenAI
from langchain.prompts import BaseChatPromptTemplate
from langchain.schema import AgentAction, AgentFinish, HumanMessage
```

### 도구 설치

```python
SERPAPI_API_KEY = {YOUR_SERPAPI_API_KEY}

search = SerpAPIWrapper(serpapi_api_key=SERPAPI_API_KEY)
tools = [
    Tool(
        name="Search",
        func=search.run,
        description="useful for when you need to answer questions about current events",
    )
]
```

### 프롬프트 템플릿

에이전트가 무엇을 해야하는지 이 템플릿을 이용하여 지시합니다. 일반적으로 템플릿에는 다음이 포함되어야 합니다.

- `tools` : 에이전트가 액세스할 수 있는 도구와 언제 어떻게 호출해야 하는지 알 수 있습니다.
- `intermediate_steps` : 이전 (`AgentAction`, `Observation`) 쌍의 튜플입니다. 일반적으로 모델에 직접 전달되지는 않지만 프롬프트 템플릿에서 특정 방식으로 포맷을 정합니다.
- `input` : 일반적인 사용자 입력

```python
# Set up the base template
template = """Complete the objective as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

These were previous tasks you completed:



Begin!

Question: {input}
{agent_scratchpad}"""
```

```python
# Set up a prompt template
class CustomPromptTemplate(BaseChatPromptTemplate):
    # The template to use
    template: str
    # The list of tools available
    tools: List[Tool]

    def format_messages(self, **kwargs) -> str:
        # Get the intermediate steps (AgentAction, Observation tuples)
        # Format them in a particular way
        intermediate_steps = kwargs.pop("intermediate_steps")
        thoughts = ""
        for action, observation in intermediate_steps:
            thoughts += action.log
            thoughts += f"\nObservation: {observation}\nThought: "
        # Set the agent_scratchpad variable to that value
        kwargs["agent_scratchpad"] = thoughts
        # Create a tools variable from the list of tools provided
        kwargs["tools"] = "\n".join(
            [f"{tool.name}: {tool.description}" for tool in self.tools]
        )
        # Create a list of tool names for the tools provided
        kwargs["tool_names"] = ", ".join([tool.name for tool in self.tools])
        formatted = self.template.format(**kwargs)
        return [HumanMessage(content=formatted)]


prompt = CustomPromptTemplate(
    template=template,
    tools=tools,
    # This omits the `agent_scratchpad`, `tools`, and `tool_names` variables 
    #   because those are generated dynamically
    # This includes the `intermediate_steps` variable because that is needed
    input_variables=["input", "intermediate_steps"],
)
```

### 아웃풋 파서(Output Parser)

아웃풋 파서는 LLM 출력을 `AgentAction`와 `AgentFinish`로 파싱하는 작업을 담당합니다.
일반적으로 사용되는 프롬프트에 따라 결과가 크게 달라집니다.

```python
class CustomOutputParser(AgentOutputParser):
    def parse(self, llm_output: str) -> Union[AgentAction, AgentFinish]:
        # Check if agent should finish
        if "Final Answer:" in llm_output:
            return AgentFinish(
                # Return values is generally always a dictionary with a single `output` key
                # It is not recommended to try anything else at the moment :)
                return_values={
                    "output": llm_output.split("Final Answer:")[-1].strip()
                },
                log=llm_output,
            )
        # Parse out the action and action input
        regex = (
            r"Action\s*\d*\s*:(.*?)\nAction\s*\d*\s*Input\s*\d*\s*:[\s]*(.*)"
        )
        match = re.search(regex, llm_output, re.DOTALL)
        if not match:
            raise ValueError(f"Could not parse LLM output: `{llm_output}`")
        action = match.group(1).strip()
        action_input = match.group(2)
        # Return the action and action input
        return AgentAction(
            tool=action,
            tool_input=action_input.strip(" ").strip('"'),
            log=llm_output,
        )

output_parser = CustomOutputParser()
```

### LLM 설정

```python
OPENAI_API_KEY = "{YOUR_OPENAI_API_KEY}"
llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, temperature=0)
```

### `stop` 시퀀스 정의하기

이는 LLM에 생성을 중지할 시점을 정하기 때문에 매우 중요합니다.

사용 중인 프롬프트와 모델에 따라 시퀀스 정의가 달라지는데, 일반적으로 프롬프트에서 `Observation`의 시작을 나타내는 데 사용하는 토큰이 무엇이든 상관 없습니다.
(그렇지 않으면 LLM이 hallucination을 반환할 수 있습니다.)

### 에이전트 설정

```python
# LLM chain consisting of the LLM and a prompt
llm_chain = LLMChain(llm=llm, prompt=prompt)

tool_names = [tool.name for tool in tools]
agent = LLMSingleActionAgent(
    llm_chain=llm_chain, 
    output_parser=output_parser,
    stop=["\nObservation:"], 
    allowed_tools=tool_names
)
```

### 에이전트 사용하기

```python
agent_executor = AgentExecutor.from_agent_and_tools(
    agent=agent, tools=tools, verbose=True
)

agent_executor.run("Search for Leo DiCaprio's girlfriend on the internet.")
```

```plain
> Entering new  chain...
Thought: I should search for Leo DiCaprio's girlfriend on the internet to find the answer.
Action: Search
Action Input: "Leo DiCaprio's girlfriend"

Observation:The actor is believed to have recently split from his girlfriend of five years, actor Camila Morrone, but has previously been romantically ...
I need to find more information about Leo DiCaprio's current girlfriend.
Action: Search
Action Input: "Leo DiCaprio current girlfriend"

Observation:According to this TikTok by user @thekylemarisa, Leonardo DiCaprio allegedly has a new girlfriend- Meghan Roche.
I now know the final answer.
Final Answer: Leonardo DiCaprio's current girlfriend is Meghan Roche.

> Finished chain.
```

