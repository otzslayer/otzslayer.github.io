---
created: 2024-05-29
title: SOLID 원칙으로 ML 프로젝트 확장하기
layout: post
tags: [solid, clean-code]
category: ML
image:
  path: https://i.imgur.com/bXNV3VT.png
  alt: 
---

본 포스트는 [Jeremy Arancio](https://medium.com/@jeremyarancio)의 ["Scale your Machine Learning Projects with SOLID Principles"](https://towardsdatascience.com/scale-your-machine-learning-projects-with-solid-principles-824230fa8ba1)을 번역하였습니다.

---

제가 주니어 데이터 사이언티스트일 때의 목표는 단순히 잘 작동하는 코드를 작성하는 것이었습니다. 저는 Python을 Pandas, Numpy, Matplotlib을 사용하기 위한 프레임워크로만 생각했죠. 다른 사람들처럼 Jupyter Notebook에서 셀 단위로 데이터를 처리하고 모델을 학습했습니다.

첫 직장에 다닐 때를 떠올려보았습니다. 프로젝트를 진행할 수록 노트북 파일은 점점 커져갔고 마크다운을 이용해 자세한 설명을 작성하더라도 코드는 점점 지저분해졌습니다. 첫 번째 모델 학습을 완료했고 개발자의 도움을 받아 성능을 평가한 후 프로덕션에 배포를 했습니다. 하지만 다른 ML 프로젝트와 마찬가지로 모델 배포는 그 긴 여정의 끝이 아닌 시작이었습니다.

저는 몇 주 후에 처음부터 다시 시작해서 노트북 파일을 다시 살펴봐야 했습니다. 솔직히 말해서 새로운 노트북 파일을 작성하는게 훨씬 쉬웠습니다. 요구사항이 변경되었고 코드가 너무 지저분해서 수정을 하기 어려웠기 때문입니다.

게다가 프로세싱 알고리즘을 프로덕션 환경으로 올리는 것은 매우 어려웠습니다. 데이터는 노트북 파일, 학습 파이프라인, 추론 파이프라인에서 동일하게 처리되어야 했습니다. 코드를 세 번 작성해야 했고, 이는 노트북 파일을 수정할 때마다 다른 파이프라인을 변경해야 한다는 것을 의미했고 이는 버그가 발생활 확률을 높였습니다.

ML 작업은 절 매우 힘들게 했습니다. **소프트웨어 엔지니어링의 모범 사례(best practices)를 적용하기 전까지 말이죠.** 그 후부터 코드, 동료와의 관계, ML 파이프라인을 제공하는 것 모두 효율성이 크게 높아졌습니다. 여기서 활용한 모범 사례는 바로 **SOLID 원칙**입니다.

다음 데이터는 수치형 컬럼, 범주형 컬럼, 결측값을 포함한 컬럼으로 구성되어 있습니다.

```
   feature_a feature_b  feature_c
0          1         a        0.0
1          2         a        0.0
2          3         b        NaN
3          4         b        1.0
4          5         c        1.0
```

선형 회귀와 같은 ML 모델을 훈련하기 위해서 이 데이터를 전처리해야 한다고 가정해봅시다. Pandas를 사용한 코드는 아래와 같습니다.

```python
import logging  
  
import pandas as pd  
import numpy as np  
from sklearn.preprocessing import LabelEncoder  
  
logging.basicConfig(level=logging.INFO)  
  
def process(path: str, output_path: str) -> pd.DataFrame:  
    """"""
    df = pd.read_parquet(path)  
    logging.info(f"Data: {df}")  
      
    # Normalization  
    std = np.std(df["feature_a"])  
    mean = np.mean(df["feature_a"])  
    standardized_feature = (df["feature_a"] - mean) / std  
      
    # Categorical value  
    encoder = LabelEncoder()  
    encoded_feature = encoder.fit_transform(df["feature_b"])  
      
    # Nan  
    filled_feature = df["feature_c"].fillna(-1)  
      
    processed_df = pd.concat(  
        [standardized_feature, encoded_feature, filled_feature],  
        axis=1  
    )  
    logging.info(f"Processed data: {processed_df}")  
    processed_df.to_parquet(output_path)  
      
      
def main():  
    path = "data/data.parquet"  
    output_path = "data/preprocessed_data.parquet"  
    process(path, output_path)  
      
  
if __name__ == "__main__":  
    main()
```

위 코드로 처리한 결과는 아래와 같습니다.

```
   feature_a feature_b  feature_c
0  -1.414214         0        0.0
1  -0.707107         0        0.0
2   0.000000         1       -1.0
3   0.707107         1        1.0
4   1.414214         2        1.0
```

이런 코드는 데이터 사이언티스트가 일반적으로 Jupyter Notebook에 작성하는 일반적인 코드지만 **다음 세 가지 이유로 잘못 작성됐다**고 볼 수 있습니다.

1. `process()` 함수를 수정하지 않고서는 데이터 처리 방식을 변경할 수 없습니다. 이렇게 되면 프로젝트 후반에 버그가 생길 가능성이 높습니다.
2. 이 함수는 테스트가 어렵습니다. `process()` 함수에 대한 단위 테스트를 작성할 수는 있지만 코드가 변경되면 테스트 함수도 같이 변경되어야 합니다.
3. 이 코드는 재사용할 수 없습니다. 다른 데이터를 처리해야 하는 경우 새 함수를 처음부터 개발해야 합니다.

이제 SOLID 원칙을 이용해 이 문제를 해결해보겠습니다.

## Single Responsibility Principle (단일 책임 원칙, SRP)

Uncle Bob으로도 불리우는 Clean Code의 저자 로버트 마틴(Robert C. Martin)은 단일 책임 원칙에 대해 다음과 같이 표현했습니다.

> 클래스는 수정할 이유가 하나여야만 한다.

우리의 코드를 살펴보면 단일 책임 원칙을 적용해 `process()`를 하나의 책임만을 갖는 여러 개의 함수로 나눌 수 있습니다.

```python
from typing import List  
import logging  
  
import pandas as pd  
import numpy as np  
from sklearn.preprocessing import LabelEncoder  
  
logging.basicConfig(level=logging.INFO)  
  
  
def process(self, path: str, output_path: str) -> None:  
    df = load_data(path)  
    logging.info(f"Raw data: {df}")  
    normalized_df = normalize(df["feature_a"])  
    encoded_df = encode(df["feature_b"])  
    filled_df = fill_na(df["feature_c"], value=-1)  
    processed_df = pd.concat(  
        [normalized_df, encoded_df, filled_df],  
        axis=1  
    )  
    logging.info(f"Processed df: {processed_df}")  
    save_data(df=processed_df, path=output_path)  
  
  
def standardize(df: pd.DataFrame) -> pd.DataFrame:  
    std = np.std(df)  
    mean = np.mean(df)  
    return (features - mean) / std  
  
  
def encode(df: pd.DataFrame) -> pd.DataFrame:  
    encoder = LabelEncoder()  
    encoder.fit_transform(features)  
    array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
    processed_df = pd.DataFrame({name: data for name, data in zip(df.columns, array)})  
    return processed_df  
  
  
def fill_na(df: pd.DataFrame, value: int = -1) -> pd.DataFrame:  
    return df.fillna(value=self.value)  
  
  
def load_data(self, path: str) -> pd.DataFrame:  
    return pd.read_parquet(path)  
  
  
def save_data(self, df: pd.DataFrame, path: str) -> None:  
    df.to_parquet(path)
```

코드가 조금 더 나아졌습니다! 데이터 처리의 각 단계는 하나의 책임을 갖는 하나의 함수로 표현됩니다. 전체 프로세스에서 발생하는 모든 수정은 프로세스의 작은 부분에서 이루어지게 됩니다. 또한 각 함수에 대한 단위 테스트가 더 쉬워짐에 따라 프로젝트가 변경에 대해 더 강건해집니다.

그런데 만약 Parquet 대신 CSV 파일을 처리하도록 하려면 어떻게 해야 할까요? 두 가지 파일 종류를 모두 처리할 수 있게 `load_data()` 함수를 수정해야 할겁니다.

```python
import os  

def load_data(self, path: Path) -> pd.DataFrame:  
    splitted_path = os.path.splitext(path)  
    if splitted_path[-1] == ".csv":  
        return pd.read_csv(path)  
    if splitted_path[-1] == ".parquet"  
        return pd.read_parquet(path)  
    else:  
        raise ValueError(f"File type {splitted_path[-1]} not handled.")
```

하지만 기존 함수를 뜯어 고쳐야 하기 때문에 버그를 발생시킬 확률이 높아지는 좋지 않은 방법입니다. 여기에서 두 번째 원칙이 등장합니다.

## Open / Closed Principle (개방-폐쇄 원칙, OCP)

이 원칙은 베르트랑 메이어(Bertrand Meyer)가 아래의 내용으로 도입한 원칙입니다.

> 소프트웨어 엔티티(클래스, 모듈, 함수 등)는 확장을 위해서는 개방적이어야 하지만 수정을 위해서는 폐쇄적이어야 한다.

위의 예제를 살펴보면 `load_data()`를 수정하는 대신 `load_csv()`와 `load_parquet()`라는 두 개의 함수를 만들 수 있습니다. 이렇게 하면 기존의 `load_data()` 함수는 건드리지 않고 `load_parquet()`로 변환할 수 있습니다.

```python
def load_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)

def load_parquet(path: str) -> pd.DataFrame:
    return pd.read_parquet(path)
```

이렇게 코드를 짜면 개방-폐쇄 원칙을 지킬 수 있습니다. 하지만 CSV 파일 불러오기와 같은 새로운 기능을 구현한다면 `process()`에 새로운 함수를 구현해야 합니다. 여전히 개방-폐쇄 원칙을 위반하게 됩니다. 이 문제를 해결하기 위해 다음 원칙을 살펴보고 더 나은 코드를 작성해보도록 하겠습니다.

## Liskov Substitution Principle (리스코프 치환 원칙, LSP)

리스코프 치환 원칙은 바바라 리스코프(Barbara Liskov)가 제안한 원칙입니다. 내용은 다음과 같습니다.

> 모듈은 프로그램을 망가뜨리지 않고 모듈의 베이스 모듈로 교체할 수 있어야 한다.

다시 말해서 동일한 동작을 하는 모듈은 공통 베이스에서 상속해야 합니다. 이 베이스 모듈은 코드에서 해당 하위 모듈을 나타낼 수 있어야 합니다. 여기에서 파이썬 클래스가 유용해집니다. `load_parquet()`와 `load_csv()` 함수를 상위 클래스인 `DataLoader`를 상속하는 클래스로 다시 작성해보겠습니다.

```python
from abc import ABC, abstractmethod  
  
class DataLoader(ABC):  
    @abstractmethod  
    def load_data(self, path: str) -> pd.DataFrame:  
        pass  
  
class ParquetDataLoader(DataLoader):  
    def load_data(self, df: pd.DataFrame, path: str) -> None:  
        return pd.read_parquet(path)  
  
class CSVDataLoader(DataLoader):  
    def load_data(self, df: pd.DataFrame, path: str) -> None:  
        return pd.read_csv(path)
```

위 코드는 Python의 객체 지향 프로그래밍 기능을 사용하면서 첫 번째와 두 번째 SOLID 원칙을 준수합니다. Python에서 베이스 클래스를 선언할 때는 표시 목적으로 `ABC`를 상속해야 합니다. 이는 코드에 직접적인 영향을 미치진 않지만 개발자가 알고리즘의 계층 구조를 잘 전달할 수 있도록 돕습니다. 비슷한 방식으로 `@abstractmethod` 래퍼는 서브 클래스의 메서드 작성을 위한 가이드 역할을 하고 오버라이딩하도록 되어 있습니다.

이제 JSON과 같은 새로운 데이터를 불러오는 방법을 추가하고 싶다면 `DataLoader`를 상속하는 다른 클래스를 추가하고 같은 방식으로 개방 폐쇄 원칙을 준수하도록 할 수 있습니다.

```python
class JSONDataLoader(DataLoader):
    def load_data(path: str) -> pd.DataFrame:
        return pd.read_json(path)
```

추가로 `standardize()`, `encoder()`, `na_fill()`과 같은 다른 데이터 변환 함수에 대해서도 동일한 작업을 수행할 수 있습니다.

```python
class FeatureProcessor(ABC):  
    def __init__(self, feature_names: List[str]) -> None:  
        # Features to process are directly implemented into the base module  
        self.feature_names = feature_names  
      
    @abstractmethod  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        pass  
  
class Standardizer(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        std = np.std(features)  
        mean = np.mean(features)  
        return (features - mean) / std  
  
class Encoder(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        encoder = LabelEncoder()  
        array = encoder.fit_transform(features)  
        array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
        processed_df = pd.DataFrame({name: data for name, data in zip(features.columns, array)})  
        return processed_df  
  
class NaFiller(FeatureProcessor):  
    def __init__(self, feature_names: List[str], value: int = -1) -> None:  
        self.value = value  
        super().__init__(feature_names)  
  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        return features.fillna(value=self.value)
```

예를 들어 수치형 변수를 처리하는 새로운 메서드를 추가하려면 `FeatureProcessor` 모듈을 상속받는 새로운 클래스를 만들어서 개방 폐쇄 원칙을 준수하면 됩니다.

```python
class Normalizer(FeatureProcessor):
    def process(self, df: pd.DataFrame) -> pd.DataFrame:
        features = df[self.feature_names]
        minimum = features.min()
        maximum = features.max()
        return (features - minimum) / (maximum - minimum)
```

이제 코드가 모듈화되었으므로 `process()` 함수에 리스코프 치환 원리를 적용합니다. 모듈 스타일에 맞춰 코드를 다시 작성해보겠습니다.

```python
class DataProcessor:  
    # __init__ respect the Liskov Substitution Principle  
    def __init__(  
        self,  
        feature_processors: List[FeatureProcessor],  
        data_loader: DataLoader,  
        data_saver: DataSaver  
    ) -> None:  
        self.feature_processors = feature_processors  
        self.data_loader = data_loader  
        self.data_saver = data_saver  
      
    def process(self, path: str, output_path: str) -> None:  
        df = self.data_loader.load_data(path)  
        logging.info(f"Raw data: {df}")  
        processed_df = pd.concat(  
            [feature_processor.process(df) for feature_processor in self.feature_processors],  
            axis=1  
        )  
        self.data_saver.save_data(df=processed_df, path=output_path)  
        logging.info(f"Processed df: {processed_df}")
```

위 클래스에서 알 수 있다시피 `DataProcessor`는 어떤 함수가 사용되는지에 대한 종속성을 제거하여 `FeatureProcessor`, `DataLoader`, `DataSaver`와 같은 모듈 베이스를 입력값으로 받습니다. 

이렇게 하면 코드를 수정해야할 때 `DataProcessor`를 초기화하는 동안 모듈을 변경하기만 하면 됩니다.

```python
processor = DataProcessor(  
  feature_processors=[  
      Normalizer(feature_names=["feature_a"]),  
      # Standardizer(...),  
      Encoder(feature_names=["feature_b"]),  
      NaFiller(feature_names=["feature_c"], value=-1)  
  ],  
  data_loader=CSVDataLoader(),  
  data_saver=ParquetDataSaver()  
)  
processor.process(  
    path="data/data.csv",  
    output_path="data/preprocessed_data.parquet"  
)
```

여기까지 진행한다면 코드를 모듈화하여 확장에는 개방적이지만 변경에는 폐쇄적이도록 만들었습니다. 하지만 코드를 개선하기 위해 변경할 수 있는 몇 가지 요소가 더 있습니다.

## Interface Segregation Principle (인터페이스 분리 원칙, ISP)

로버트 마틴은 SOLID 원칙 중 다음 내용을 골자로 한 인터페이스 분리 원칙을 제안했습니다.

> 클라이언트가 사용하지 않는 메서드에 의존하도록 강요해서는 안된다. 인터페이스는 계층이 아닌 클라이언트에 속해야 한다.

다시 말해서 클래스는 사용되지 않을 메서드나 속성을 상속해서는 안 됩니다. 대신 해당 메서드는 적절한 클래스와 연관 관계에 있어야 합니다. 지금까지의 예제에서는 `DataProcessor`에 구현된 모든 모듈이 알고리즘에 필요한 메서드와 속성만 전달하도록 했습니다. 하지만 프로젝트의 다른 부분에서 사용하는 다른 데이터 처리 모듈에 평균 정규화(Mean normalization)와 같은 다른 정규화가 필요하다고 가정해보겠습니다. 이 또한 하나의 정규화 메서드이므로 다음과 같이 `MeanNormalizer`라는 `Normalizer`의 서브 클래스를 생성할 수 있습니다.

```python
class MeanNormalizer(Normalizer):  
    def normalize(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        minimum = features.min()  
        maximum = features.max()  
        mean = features.mean()  
        return (features - mean) / (maximum - minimum)
```

이 경우 `normalize()` 메서드를 호출합니다. 하지만 이 클래스가 인스턴스화되면 `MeanNormalizer` 클래스는 `normalize()` 메서드 뿐만 아니라 다른 프로그램에서 사용되지 않을 `process()`  같은 상위 클래스의 모든 메서드도 전달합니다. 이런 경우에 인터페이스 분리 원칙을 위반하게 됩니다. 이런 문제를 피하기 위해서는 `Normalizer` 클래스 대신 `FeatureProcessor`에서 직접 상속하는 새 모듈을 생성하여 코드 베이스의 계층 수준을 낮출 수 있습니다.

```python
class MeanNormalizer(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        minimum = features.min()  
        maximum = features.max()  
        mean = features.mean()  
        return (features - mean) / (maximum - minimum)
```

## Dependency Inversion Principle (의존 역전 원칙, DIP)

의존 역전 원칙은 다음과 같습니다.

> 추상화된 것은 구체적인 것에 의존해선 안된다. 구체적인 것이 추상화된 것에 의존해야 한다.

Sklearn 라이브러리에서 `LabelEncoder` 대신 `OrdinalEncoder`와 같은 다른 범주형 변수 인코더를 추가하고 싶다고 가정해 보겠습니다. 다른 SOLID 원칙을 준수하기 위해서 `LabelEncoderProcessor`와 `OrdinalEncoderProcessor` 같은 새로운 모듈을 아래와 같이 생성할 수 있습니다.

```python
class LabelEncoderProcessor(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        encoder = LabelEncoder() # <<<<  
        array = encoder.fit_transform(features)  
        array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
        processed_df = pd.DataFrame({name: data for name, data in zip(features.columns, array)})  
        return processed_df  
  
class OrdinalEncoderProcessor(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        encoder = OrdinalEncoder() # <<<<  
        array = encoder.fit_transform(features)  
        array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
        processed_df = pd.DataFrame({name: data for name, data in zip(features.columns, array)})  
        return processed_df
```

문제 없이 작동하는 코드지만 깔끔하지는 않습니다. 일단 DRY(Don't Repeat Yourself) 같은 다른 프로그래밍 원칙을 존중하지도 않습니다. 가장 좋은 해결책은 메서드에 포함시키는 대신 `Encoder` 클래스의 파라미터로 구현하여 Sklearn 인코더에 대한 종속성을 제거하는 것입니다. 

이 방법이 바로 의존 역전 원칙입니다. 우리는 리스코프 치환 원칙에 따라 모든 Sklearn 인코더의 추상적인 표현으로 `TransformerMixin` 베이스 객체를 사용합니다.

```python
from sklearn.base import TransformerMixin  
  
class Encoder(FeatureProcessor):  
    def __init__(self, encoder: TransformerMixin,  
                 feature_names: List[str]) -> None:  
        self.encoder = encoder  
        super().__init__(feature_names)  
  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        array = self.encoder.fit_transform(features)  
        array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
        processed_df = pd.DataFrame({name: data for name, data in zip(features.columns, array)})  
        return processed_df
```

이렇게 하면 더 이상 어떤 인코더를 사용하는지에 따라 `Encoder`가 달라지지 않으며, `fit_transform` 메서드가 포함된 `TransformerMixin` 객체를 사용하기만 하면 됩니다.

```python
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder  

processor = DataProcessor(  
    feature_processors=[  
        Normalizer(feature_names=["feature_a"]),  
        Encoder(encoder=LabelEncoder(), feature_names=["feature_b"]),  
        # Or Encoder(encoder=OrdinalEncoder(), ...)  
        ...
```

## 최종 코드

```python
from abc import ABC, abstractmethod  
from typing import List  
import logging  
  
import pandas as pd  
import numpy as np  
from sklearn.base import TransformerMixin  
from sklearn.preprocessing import LabelEncoder  
  
logging.basicConfig(level=logging.INFO)  
  
  
class FeatureProcessor(ABC):  
    def __init__(self, feature_names: List[str]) -> None:  
        self.feature_names = feature_names  
      
    @abstractmethod  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        pass  
  
  
class Standardizer(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        std = np.std(features)  
        mean = np.mean(features)  
        return (features - mean) / std  
  
  
class Normalizer(FeatureProcessor):  
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        minimum = features.min()  
        maximum = features.max()  
        return (features - minimum) / (maximum - minimum)  
  
  
class Encoder(FeatureProcessor):  
    def __init__(self, encoder: TransformerMixin,  
                 feature_names: List[str]) -> None:  
        self.encoder = encoder  
        super().__init__(feature_names)  
      
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        array = self.encoder.fit_transform(features)  
        array = np.atleast_2d(array) # Transform array into 2D from 1D or 2D arrays  
        processed_df = pd.DataFrame({name: data for name, data in zip(features.columns, array)})  
        return processed_df  
  
  
class NaFiller(FeatureProcessor):  
    def __init__(self, feature_names: List[str],  
                 value: int = -1) -> None:  
        self.value = value  
        super().__init__(feature_names)  
      
    def process(self, df: pd.DataFrame) -> pd.DataFrame:  
        features = df[self.feature_names]  
        return features.fillna(value=self.value)  
  
  
class DataLoader(ABC):  
    @abstractmethod  
    def load_data(self, path: str) -> pd.DataFrame:  
        pass  
  
  
class ParquetDataLoader(DataLoader):  
    def load_data(self, path: str) -> pd.DataFrame:  
        return pd.read_parquet(path)  
  
  
class DataSaver(ABC):  
    @abstractmethod  
    def save_data(self, df: pd.DataFrame, path: str) -> None:  
        pass  
  
  
class ParquetDataSaver(DataSaver):  
    def save_data(self, df: pd.DataFrame, path: str) -> None:  
        df.to_parquet(path)  
  
  
class DataProcessor:  
    def __init__(  
        self,  
        feature_processors: List[FeatureProcessor],  
        data_loader: DataLoader,  
        data_saver: DataSaver  
    ) -> None:  
    self.feature_processors = feature_processors  
    self.data_loader = data_loader  
    self.data_saver = data_saver  
      
    def process(self, path: str, output_path: str) -> None:  
        df = self.data_loader.load_data(path)  
        logging.info(f"Raw data: {df}")  
        processed_df = pd.concat(  
            [feature_processor.process(df) for feature_processor in self.feature_processors],  
            axis=1  
        )  
        self.data_saver.save_data(df=processed_df, path=output_path)  
        logging.info(f"Processed df: {processed_df}")
```

이제 우리의 코드는 고도로 모듈화되어 확장에 개방적이며, 개발자가 프로젝트 중에 구현할 수 있는 대부분의 잠재적인 버그를 방지할 수 있습니다.

## 나가며

이 아티클에서는 다섯 개의 SOLID 원칙을 다루고 실제 코드에 어떻게 반영하는지를 다루었습니다. IT 프로젝트는 새로운 요구사항이 계속 추가되면서 자연스럽게 진화합니다. 프로젝트가 개발되는 동안 코드가 빠르게 옛날 것으로 바뀌기도 하죠. 따라서 확장을 위해 설계된 코드를 만드는 방법을 배우는 것은 기본이며, 인프라가 구축된 후에는 작업 속도를 높일 수 있습니다. 하지만 모든 프로젝트에서 SOLID 원칙을 준수하기 전에 알아두어야 하는 몇 가지 중요한 사항이 있습니다.

첫 번째로 이러한 원칙에 따라 코드를 작성하면 유연성과 확장성은 뛰어나지만 아키텍처를 설계하는데 많은 시간이 필요합니다. 프로젝트에 이런 원칙을 적용하고자 할 때 해당 원칙을 적용하는 것이 적절한지 판단을 해야 합니다. SOLID 원칙은 규모와 효율성을 위해 설계되었으며, 같은 프로젝트의 다른 개발자에게 가이드라인 역할을 합니다.

하지만 데이터 과학자의 작업은 대부분 탐색적이며 Jupyter 노트북과 같은 단일 환경에서 이루어집니다. 따라서 프로덕션 환경에 영향을 미치지 않는다면 코드를 과도하게 엔지니어링 할 필요가 없는 경우가 많습니다.

두 번째로 SOLID 원칙을 적용하는 사람은 Python과 같은 상속 및 객체 지향 프로그래밍을 사용하여 깊은 계층 구조를 만들 때 쉽게 길을 잃을 수 있습니다. 실용주의 프로그래머 책에서는 베이스 클래스와 서브클래스를 넘어서 확장하지 말라고 조언하며 이런 접근 방식을 권장하지 않습니다. 네 번째 SOLID 원칙인 인터페이스 분리 원칙은 이러한 관행을 암묵적으로 권장하지 않습니다.