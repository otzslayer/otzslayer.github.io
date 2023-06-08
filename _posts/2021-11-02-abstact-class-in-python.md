---
title: 파이썬에서의 추상 클래스
tags: [abstract, oop, python]
category: Python
aside:
  toc: true
show_category: true
---

Python에도 추상 클래스는 있지만 다른 언어들하고는 조금 다릅니다.

<!--more-->

## 들어가며

객체지향 언어를 강력하게 만들어주는 것 중 하나는 바로 상속과 다형성입니다. 모든 개발에 있어 기본으로 쓰이는 이 기능들은 기존에 작성된 클래스를 재사용하여 유지보수 비용을 줄일 수 있도록 하고 코드 작성을 간결하게 만들 수 있습니다. 그런데 이런 좋은 기능들을 사용하다가 작은 실수를 했다고 생각해봅시다. 상속받는 클래스에서 부모 클래스에 있는 특정 메서드를 구현하지 않았다고 해보죠. 사실 작은 규모의 코드 베이스에선 이럴 일이 거의 없지만 큰 규모에선 종종 발생할 수도 있습니다. 이런 경우 즉각적인 문제가 발생하지 않겠지만 추후 Side effect가 어떤 형태로 생길지 알 길이 없습니다. 이럴 때 추상클래스를 사용하면 이런 문제를 사전에 방지할 수 있습니다.

추상 클래스는 실제 사용할 클래스들 내 공통적인 메서드들에 대한 설계를 통해 그 구현을 강제하는 역할을 합니다. 추상 클래스를 사용하면 이 추상 클래스를 상속받은 자식 클래스에서 메서드 구현이 되어 있지 않으면 오류를 발생시킵니다. 그러다보니 추상 클래스는 프로그램을 표준화하기에 용이하고 추후 유지보수도 용이하다는 점 등 많은 장점들이 있습니다. 


### ML에서의 추상 클래스?

그러면 데이터 분석을 하거나 ML 모델을 만들 때는 추상 클래스는 어떻게 쓰일까요? 사실 Kaggle 등을 통해 데이터 사이언스를 접하게 되면 추상 클래스를 사용한 코드들을 쉽게 보기는 힘듭니다. 하지만 파이썬으로 데이터를 다루는 분들께서 필수로 사용하는 Scikit-learn을 코드 레벨로 뜯어보면 정말 수많은 추상 클래스가 있는 것을 확인할 수 있습니다.

예를 들어, Scikit-learn에 있는 `RandomForestClassifier` 클래스를 보면 이렇게 시작합니다.

```python
class RandomForestClassifier(ForestClassifier):
    ...
```

`RandomForestClassifier`는 `ForestClassifier`라는 추상 클래스를 상속 받습니다. 여기서 더 한 번 거슬러 올라가볼까요? `ForestClassifier`는 또 이렇게 시작합니다.

```python
class ForestClassifier(ClassfierMixin, BaseForest, metaclass=ABCMeta):
    ...
```

여기서는 `ForestClassifier`는 또 한 번 추상 클래스들을 상속받습니다. 조금 풀어서 생각해본다면 이렇게 될 것 같습니다.

- Random Forest Classifier는 Forest 계열 Classifier다.
- Forest 계열의 Classifier는 결국 Classifier이고, 기본적인 Forest 계열 알고리즘의 기능을 갖는다.

이처럼 복잡한 알고리즘이라도 몇 개의 추상 클래스가 갖는 기능들을 이해하면 굉장히 쉽게 이해할 수 있는 구조를 갖습니다. 최근에 추천 관련 프로젝트를 하며 여러 추천 알고리즘을 구현할 일이 있었는데, Scikit-learn에서 자주 사용하는 인터페이스처럼 `RecommenderMixin` 이라는 이름의 추상 클래스를 만들어 다른 알고리즘들이 상속 받도록 해봤더니 굉장히 논리적인 구조로 코드를 짤 수 있었습니다.

## 파이썬에서 추상 클래스 사용하기

### ABC (Abstract Base Class)

파이썬에서 추상 클래스를 사용할 때는 파이썬 기본 라이브러리 중 하나인 `abc`를 사용합니다. 

```python
from abc import abstractmethod, ABCMeta

class BaseClass(metaclass=ABCMeta):
    @abstractmethod
    def method_name(self, ...):
        ...
```

- 추상 클래스를 선언할 때 클래스 인자로 `metaclass`를 추가하고 그 값은 `ABCMeta`로 설정합니다.
  - 클래스 인자로 추가하지 않고 매직 오브젝트를 사용할 수도 있습니다.


```python
class BaseClass():
    __metaclass__ = ABCMeta

    @abstractmethod
    def method_name(self, ...):
        ...
```

- 추상 클래스 내에 추상 메서드가 필요하다면 해당 메서드 위에 `@abstractmethod` 데코레이터를 추가해줍니다.

예를 들어 자동차에 대한 클래스를 만든다고 했을 때, 모든 자동차는 달리고 멈추는 기능이 있겠죠. BMW와 Audi 클래스를 만들고 이들을 클래스를 상속하게 한다면 이렇게 될겁니다.

```python
class Car(metaclass=ABCMeta):
    @abstractmethod
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def run(self):
        pass
    
    @abstractmethod
    def stop(self):
        pass

class BMW(Car):
    def __init__(self, name):
        super().__init__(name)
        
    def __repr__(self):
        return self.name
    
    def run(self):
        print(f"{self.name} 달립니다!")
    
    def stop(self):
        print(f"{self.name} 멈춥니다!")
```

인스턴스를 생성해서 각각의 메서드를 실행했을 때 문제 없이 원하는 내용이 출력되는 것을 확인할 수 있습니다.

```python
>>> bmw = BMW("BMW_1")
>>> bmw.run()
BMW_1 달립니다!
>>> bmw.stop()
BMW_1 멈춥니다!
```

만약 추상 클래스에 있는 메서드를 상속받을 메서드에서 구현하지 않으면 어떻게 될까요? 예를 들어 `stop` 메서드를 빼고 구현하여 인스턴스를 생성해보겠습니다.

```python
class BMW(Car):
    def __init__(self, name):
        super().__init__(name)
        
    def __repr__(self):
        return self.name
    
    def run(self):
        print(f"{self.name} 달립니다!")
```

```python
>>> bmw = BMW("BMW_2")
TypeError: Can't instantiate abstract class BMW with abstract method stop
```

추상 클래스를 상속받았고 추상 메서드가 클래스 내에서 구현되지 않은 채 인스턴스로 생성했기 때문에 오류가 발생합니다. 따라서 모든 추상 메서드들에 대한 구현이 강제가 됩니다.


### `NotImplementedError`와의 차이

`abc`를 사용하지 않고 `NotImplementedError`를 사용하여 클래스 상속에 대한 관리를 하는 경우도 있습니다. 위 `Car` 클래스에 적용을 해보면 아래와 같습니다.

```python
class Car(metaclass=ABCMeta):
    def __init__(self, name):
        self.name = name

    def run(self):
        raise NotImplementedError
    
    def stop(self):
        raise NotImplementedError
```

그렇다면 `abc`를 사용하는 경우와는 무슨 차이가 있을까요? 바로 **오류의 발생 시점**입니다. `abc` 모듈을 사용한 경우엔 인스턴스를 생성할 때 바로 오류가 발생합니다. 하지만 `NotImplementedError`를 사용하면 인스턴스 생성에선 오류가 발생하지 않습니다. 하지만 구현되지 않은 메서드를 호출할 때 오류가 발생합니다.

```python
>>> bmw = BMW("BMW_3")
>>> bmw.run()
BMW_3 달립니다!
>>> bmw.stop()
NotImplementedError: 
```

개인적으로는 **`abc` 모듈을 사용하는 것이 `NotImplementedError`를 사용하는 것보다 보다 더 엄격하게 상속 클래스들을 관리**할 수 있다고 생각합니다.