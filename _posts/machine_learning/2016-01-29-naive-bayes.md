---
layout: post
title: "Naive Bayes Classifier"
categories: Machine-Learning
author: "Jaeyoon Han"
date: 2016-01-29
image: /assets/article_images/2016-01-29-naive-bayes/bayes.jpg
---

## Naive Bayes Classifier

---

##### Naive Bayes Classifier(나이브 베이즈 분류기)란?

나이브 베이즈 분류기는 각 사건 특성들이 독립이라는 가정 하에 **베이즈 정리(Bayes' theorem)**을 적용한 간단한 확률 기반 분류기다. 1950년대 이후로 광범위하게 연구되었고, 1960년대 초 문서 분류 분야에 활발히 도입되었다. 나이브 베이즈 분류기는 일반적으로 결과의 확률을 추정하기 위해 많은 속성을 고려해야 하는 문제에 가장 적합하다. 가령 베이즈 분류기는 다음과 같은 목적에서 사용된다.

- 정크 이메일 필터링과 같은 문서 분류, 저자 식별이나 주제 분류
- 침입자 검출이나 컴퓨터 네트워크에서 이상 행동 검출
- 관찰된 증상을 고려한 질병 진찰

---

##### 베이즈 정리(Bayes' Theorem)

> *Bayes' theorem is to the theory of brobability what the Pythagorean theorem is to geometry.  
- Sir Harold Jeffreys*

베이즈 분류기를 알기 위해서는 기본이 되는 베이즈 정리에 대해 알아야 한다. 베이즈 정리는 토마스 베이즈(Thomas Bayes, 1701~1761)의 원고에 최초 등장하였고, 사후에 리처드 프라이스(Richard Price)에 의해 출판되었다. 수식으로 나타내면 다음과 같다.

$$
P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}
$$

| 확률 | 설명 |
| :------------:| ------------------------------------------------|
| $P(A)$        | 사건 $A$의 사전 확률. 사건 $B$에 대한 정보가 아무것도 없는 상태.  |
| $P(B)$        | 사건 $B$의 사전 확률. |
| $P(A \mid B)$ | 사건 $B$가 일어났다는 가정 하에 원인이 사건 $A$일 확률(사후 확률). |
| $P(B \mid A)$ | 사건 $A$가 일어났다는 가정 하에 사건 $B$가 일어날 조건부 확률. (Likelihood)  |

다시 말해서, 두 확률 변수의 사전 확률과 사후 확률 사이의 관계를 나타낸다. 어떤 사건에 대한 정보가 증가할 수록 확률값이 수정되고 정제되는 과정을 거친다.
예를 들어 어떤 이메일이 스팸일 확률을 구한다고 가정하자. 아무런 정보가 없을 때에는 지금까지 메일 중에 스팸인 이메일의 비율로 추측할 수 밖에 없다. 이 값이 20%라고 가정하자. 이 확률을 **사전 확률(prior probability)**이라고 한다.
이 때 추가 증거를 얻었다고 가정하자. 받은 메시지에 비아그라라는 용어가 들어 있다. 비아그라 단어가 이전 스팸 메시지에서 사용됐을 확률을 **가능도, 우도(likelihood)**라고 하며, 모든 메시지에 비아그라가 나타날 확률을 **주변 우도(marginal likelihood)**라고 한다. 위의 정보를 가지고 비아그라가 들어간 스팸 메시지의 확률을 측정할 수 있는데, 이 확률을 **사후 확률(posterior probability)**이라고 한다. 이 예제를 베이즈 정리를 이용해 나타내면 다음과 같다.

$$
P(spam \mid Viagra) = \frac{P(Viagra \mid spam) \cdot P(spam)}{P(Viagra)}
$$

이러한 가정들을 빈도표로 나타내면 이렇게 될 것이다.

| 우도  | 비아그라 <br> YES   | 비아그라 <br>  NO   |  총합 |
|:------------:|:------------:|:------------:|:------------:|
| 스팸  | 4/20  | 16/20 |  20   |
| 햄    | 1/80  | 79/80 | 80    |
|총합   | 5/100 | 95/100| 100

베이즈 정리를 이용해서 비아그라란 단어가 포함되었을 때, 그 메일이 스팸일 확률은 80%다.

$$
P(spam \mid Viagra) = \frac{P(Viagra \mid spam) \cdot P(spam)}{P(Viagra)} = \frac{0.2 \cdot 0.2}{0.05} = 0.8
$$

---

#### 나이브 베이즈 분류

![](/assets/article_images/2016-01-23-naive-bayes/naivebayesexample1.png)

어떤 메시지가 비아그라와 주소 삭제 용어를 포함하지만 돈과 식료품은 포함하지 않는다고 가정하자. 베이즈 이론을 이용하면 다음과 같다. 모든 계산과정은 직접 해보도록 한다.

$$
P(spam \mid W_1 \cap W_2^c \cap W_3^c \cap W_4) = \frac{P(W_1 \mid spam) \cdot P(W_2^c \mid spam) \cdot P(W_3^c \mid spam) \cdot P(W_4 \mid spam) \cdot P(spam)}{P(W_1 \cap W_2^c \cap W_3^c \cap W_4)} = 0.857
$$
$$
P(ham \mid W_1 \cap W_2^c \cap W_3^c \cap W_4) = \frac{P(W_1 \mid ham) \cdot P(W_2^c \mid ham) \cdot P(W_3^c \mid ham) \cdot P(W_4 \mid ham) \cdot P(ham)}{P(W_1 \cap W_2^c \cap W_3^c \cap W_4)} = 0.143
$$

이 경우를 $n$개의 속성으로 일반화하면 다음과 같다.

$$
P(C \mid F_1, \cdots, F_n) = \frac{1}{Z} \cdot P(C) \cdot \prod^n_{i=1} P(F_i \mid C)
$$

$C$는 범주, $F_1, \cdots, F_n$은 속성, $Z$는 각 속성에 의존하는 스케일링 인자다.

---

#### 라플라스 추정기

이번엔 비아그라, 식료품, 주소 삭제 용어가 메시지에 포함되어 있다고 하자. 위의 식과 비슷한 과정을 거치면 $P(W_3 \mid spam) = 0$ 이므로 스팸의 우도는 0이고 햄의 우도는 $P(W_3 \mid ham) = 0.00005$다. 즉, 스팸일 확률은 0%이고 햄일 확률은 100%다. 올바른 예측이 아닌 것처럼 보인다. 
범주 레벨이 전혀 발생하지 않은 경우 이런 경우가 발생한다. 하나의 증거로 인해 다른 증거까지 모두 무효가 된다.
이런 문제를 해결하기 위해 프랑스 수학자 피에르-시몽 라플라스(Pierre Simon Laplace)의 이름을 딴 **라플라스 추정기(Laplace Estimator)**를 사용한다.

$$
P(C \mid F_1, \cdots, F_n) = \frac{1}{Z} \cdot P(C) \cdot \prod^n_{i=1} \left( P(F_i \mid C) + \frac{1}{P(C)} \right)
$$

라플라스 추정기를 이용하면 결과는 스팸의 우도가 0.0004, 햄의 우도는 0.0001이 나온다. 따라서, 스팸일 확률은 80%, 햄일 확률은 20%가 된다. 나이브 베이즈 분류만을 사용했을 때보다 더 나은 결과를 얻을 수 있다.

---

#### 나이브 베이즈와 수치 속성 사용

나이브 베이즈 분류기는 훈련 데이터에 대해 빈도표를 사용하기 때문에 범주형 데이터가 필요하다. 수치형 데이터는 범주값이 없기 때문에 일련의 과정을 거쳐야 한다.
가장 효과적인 해결책은 수치형 속성을 이산화(discretize)하는 방법이다. 다시 말해서 구간화시킨다.
예를 들어 메시지를 받은 시간 속성을 데이터로 활용한다고 가정하자. 총 24시간으로 구성되어 있는데, 이를 몇 개의 구간으로 나누어 주도록 하자. 여기서는 24시간을 여섯 시간 기준으로 네 개의 구간으로 나눈다. 0~6시, 6~12시, 12~18시, 18~24시의 네 구간이다. 이 기준이 아니더라도 어떤 형태로 구간을 나누면 문제를 해결할 수 있다.

---

#### 실습 1 : 나이브 베이즈로 휴대폰 스팸 제거

##### 1. 데이터 수집

본 실습에 사용할 데이터는 http://www.dt.fee.unicamp.br/~tiago/smsspamcollection/ 에서 배포하는 SMS 스팸 모음이다. 데이터를 조금 살펴보도록 하자.


{% highlight r %}
sms_raw <- read.csv("https://raw.githubusercontent.com/otzslayer/KHURStudy/master/Machine%20Learning/data/sms_spam.csv", stringsAsFactors = FALSE)
head(sms_raw)
{% endhighlight %}



{% highlight text %}
##   type
## 1  ham
## 2  ham
## 3  ham
## 4 spam
## 5 spam
## 6  ham
##                                                                                                                                                                text
## 1                                                                                                                 Hope you are having a good week. Just checking in
## 2                                                                                                                                           K..give back my thanks.
## 3                                                                                                                       Am also doing in cbe only. But have to pay.
## 4             complimentary 4 STAR Ibiza Holiday or £10,000 cash needs your URGENT collection. 09066364349 NOW from Landline not to lose out! Box434SK38WP150PPM18+
## 5 okmail: Dear Dave this is your final notice to collect your 4* Tenerife Holiday or #5000 CASH award! Call 09061743806 from landline. TCs SAE Box326 CW25WX 150ppm
## 6                                                                                                                Aiya we discuss later lar... Pick u up at 4 is it?
{% endhighlight %}

나이브 베이즈 분류기는 메시지가 스팸인지 햄인지 구분하기 위해 단어 빈도 패턴을 이용한다. 메시지에 모든 단어를 증거로 고려하여 스팸과 햄의 확률을 계산한다.

##### 2. 데이터 준비와 탐구

데이터의 구조를 확인하자.


{% highlight r %}
str(sms_raw)
{% endhighlight %}



{% highlight text %}
## 'data.frame':	5559 obs. of  2 variables:
##  $ type: chr  "ham" "ham" "ham" "spam" ...
##  $ text: chr  "Hope you are having a good week. Just checking in" "K..give back my thanks." "Am also doing in cbe only. But have to pay." "complimentary 4 STAR Ibiza Holiday or £10,000 cash needs your URGENT collection. 09066364349 NOW from Landline not to lose out!"| __truncated__ ...
{% endhighlight %}

데이터는 5559개의 메시지와 두 속성 햄과 스팸으로 구성되어 있다. 하지만, `type` 변수가 문자 벡터로 저장되어 있는데, 이를 팩터 변수로 변경해야 한다.


{% highlight r %}
sms_raw$type <- factor(sms_raw$type)
table(sms_raw$type)
{% endhighlight %}



{% highlight text %}
## 
##  ham spam 
## 4812  747
{% endhighlight %}

팩터 변수로 변경하고 `table()` 함수를 이용해 확인하면 약 13%의 메시지가 스팸 메시지다.

보는 것처럼 메시지는 문자열로 구성이 되어있다. 여러 접속사 등이 포함되어 처리를 해야되고, 문장을 개별 단어로도 분리해야 하는 과정을 거쳐야 한다. `tm` 패키지를 불러와 작업에 유용한 함수들을 사용하도록 하자.


{% highlight r %}
library(tm)
{% endhighlight %}

텍스트 처리의 첫 단계는 **말뭉치(Corpus)**를 만드는 일이다. 말뭉치란 텍스트 문서의 모음을 말한다. `VCorpus()` 함수를 이용해서 말뭉치를 만든다. 이 함수는 말뭉치를 메모리 상에 저장한다. `PCorpus()` 함수를 이용하면 말뭉치를 직접 디스크에 저장한다.


{% highlight r %}
sms_corpus <- VCorpus(VectorSource(sms_raw$text))

# 말뭉치가 5559개의 메시지에 대한 문서를 포함하고 있다.
print(sms_corpus)
{% endhighlight %}



{% highlight text %}
## <<VCorpus>>
## Metadata:  corpus specific: 0, document level (indexed): 0
## Content:  documents: 5559
{% endhighlight %}

`tm` 패키지의 말뭉치 함수를 이용해서 말뭉치를 만들면 다소 복잡한 형태의 목록이 저장된다. 메시지에 대한 요약을 보기 위해서는 `inspect()` 함수를 사용한다. 


{% highlight r %}
inspect(sms_corpus[1:2])
{% endhighlight %}



{% highlight text %}
## <<VCorpus>>
## Metadata:  corpus specific: 0, document level (indexed): 0
## Content:  documents: 2
## 
## [[1]]
## <<PlainTextDocument>>
## Metadata:  7
## Content:  chars: 49
## 
## [[2]]
## <<PlainTextDocument>>
## Metadata:  7
## Content:  chars: 23
{% endhighlight %}

내부의 메시지 내용을 직접 보기 위해서는 `as.character()` 함수를 이용해 형변환을 해주면 된다.


{% highlight r %}
as.character(sms_corpus[[1]])
{% endhighlight %}



{% highlight text %}
## [1] "Hope you are having a good week. Just checking in"
{% endhighlight %}

`tm_map()` 함수를 이용해 말뭉치를 맵핑(mapping)하는 방법을 제공한다. `tm_map()`함수 내의 여러 가지 변환 방법으로 그 결과물을 `corpus_clean`에 저장하도록 한다.
첫 번째는 모든 문자를 소문자로 변환하는 것이다. 소문자로 변환하는 함수는 R에 기본적으로 `tolower()` 함수로 존재한다.


{% highlight r %}
tolower("Hello, World!")
{% endhighlight %}



{% highlight text %}
## [1] "hello, world!"
{% endhighlight %}

말뭉치에 `tolower()` 함수를 적용시키기 위해서는 `tm` 패키지의 함수인 `content_transformer()`를 사용한다.


{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus, content_transformer(tolower))
as.character(sms_corpus_clean[[1]])
{% endhighlight %}



{% highlight text %}
## [1] "hope you are having a good week. just checking in"
{% endhighlight %}

추가적으로 숫자를 제거하도록 한다. `removeNumbers()` 함수를 사용하는데, `tm` 패키지 내에 있는 함수이기 때문에 `content_transformer()`를 사용하지 않는다.


{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus_clean, removeNumbers)
{% endhighlight %}

다음 과정은 to, and, but, or 같은 단어를 제거하는 작업이다. 이같은 단어들을 **불용어(stop word)**라고 한다. 불용어를 제거하는 이유는 매우 자주 등장하지만 의미있는 정보를 제공하지 않기 때문이다. 이를 제거하기 위해 `stopwords()`다. 확인해보면 굉장히 많은 불용어를 포함하고 있다.


{% highlight r %}
head(stopwords(), 20)
{% endhighlight %}



{% highlight text %}
##  [1] "i"          "me"         "my"         "myself"     "we"        
##  [6] "our"        "ours"       "ourselves"  "you"        "your"      
## [11] "yours"      "yourself"   "yourselves" "he"         "him"       
## [16] "his"        "himself"    "she"        "her"        "hers"
{% endhighlight %}



{% highlight r %}
length(stopwords()) # 174개가 존재한다.
{% endhighlight %}



{% highlight text %}
## [1] 174
{% endhighlight %}



{% highlight r %}
class(stopwords())
{% endhighlight %}



{% highlight text %}
## [1] "character"
{% endhighlight %}

마지막에 확인했듯이 `stopwords()`는 함수가 아니다. 바로 적용할 수 없다는 의미다. 이를 위해 `removeWords()`를 사용한다.


{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus_clean, removeWords, stopwords())
{% endhighlight %}

이번에는 마침표를 제거한다. `removePunctuation()`를 활용한다.


{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus_clean, removePunctuation)
{% endhighlight %}

다음 과정은 **어간 추출(stemming)**[^1] 과정이다. 
어간 추출은 어형이 변형된 단어로부터 접사 등을 제거하고 그 단어의 어간을 분리해 내는 것을 의미한다. 예를 들어 "learning", "learns", "learned"라는 단어가 있을 때, 모든 단어를 어간 추출하면 결과물은 "learn"이다. 
`SnowballC` 패키지의 `wordStem()` 함수가 이 기능을 제공한다.


{% highlight r %}
library(SnowballC)
wordStem(c("learn", "learned", "learning", "learns"))
{% endhighlight %}



{% highlight text %}
## [1] "learn" "learn" "learn" "learn"
{% endhighlight %}



{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus_clean, stemDocument)
{% endhighlight %}

마지막으로 의미없는 한 줄 띄기를 제거해준다. `stripWhitespace()` 함수를 사용한다.


{% highlight r %}
sms_corpus_clean <- tm_map(sms_corpus_clean, stripWhitespace)
{% endhighlight %}

이제 메시지를 개별 요소로 나누어야 한다. 이 개별 요소를 토큰이라고 하는데, 이 과정을 **토큰화(tokenization)**이라고 한다.
`tm` 패키지의 `DocumentTermMatrix()` 함수를 이용해 말뭉치를 입력받는다. 이 함수의 결과물은 **희소 행렬(sparse matrix)**라는 데이터 구조다.
이 행렬의 행은 문서(메시지), 열은 용어(단어)를 나타낸다. 


{% highlight r %}
sms_dtm <- DocumentTermMatrix(sms_corpus_clean)

# 희소 행렬의 크기 확인
dim(sms_dtm)
{% endhighlight %}



{% highlight text %}
## [1] 5559 6518
{% endhighlight %}
내용을 확인하고 싶다면 `View(as.matrix(sms_dtm))` 을 입력하면 된다. 만약에 앞의 텍스트 전처리 과정을 거치지 않았다면 다음의 코드를 실행하면 된다.


{% highlight r %}
sms_dtm2 <- DocumentTermMatrix(sms_corpus, control = list(
        tolower = TRUE,
        removeNumbers = TRUE,
        stopwords = TRUE,
        removePunctuation = TRUE,
        stemming = TRUE
))

sms_dtm
{% endhighlight %}



{% highlight text %}
## <<DocumentTermMatrix (documents: 5559, terms: 6518)>>
## Non-/sparse entries: 42113/36191449
## Sparsity           : 100%
## Maximal term length: 40
## Weighting          : term frequency (tf)
{% endhighlight %}



{% highlight r %}
sms_dtm2
{% endhighlight %}



{% highlight text %}
## <<DocumentTermMatrix (documents: 5559, terms: 6909)>>
## Non-/sparse entries: 43192/38363939
## Sparsity           : 100%
## Maximal term length: 40
## Weighting          : term frequency (tf)
{% endhighlight %}
위 코드 결과물의 차이는 전처리 과정에서 `stopwords` 때문이다. `DocumentTermMatrix()` 함수는 텍스트를 처리할 때 모든 문장을 단어로 나눈 다음에야 함수를 적용시키기 때문이다. 이 차이를 없애주기 위해서는 다음과 같이 실행하면 된다.


{% highlight r %}
sms_dtm2 <- DocumentTermMatrix(sms_corpus, control = list(
        tolower = TRUE,
        removeNumbers = TRUE,
        stopwords = function(x) { 
                removeWords(x, stopwords()) 
        },
        removePunctuation = TRUE,
        stemming = TRUE
))

sms_dtm2
{% endhighlight %}



{% highlight text %}
## <<DocumentTermMatrix (documents: 5559, terms: 6518)>>
## Non-/sparse entries: 42113/36191449
## Sparsity           : 100%
## Maximal term length: 40
## Weighting          : term frequency (tf)
{% endhighlight %}

이제 데이터를 훈련 데이터와 테스트 데이터로 나눈다. 비율은 3:1로 하려고 한다.


{% highlight r %}
sms_dtm_train <- sms_dtm[1:4169, ]
sms_dtm_test <- sms_dtm[4170:5559, ]
{% endhighlight %}

나중의 편의를 위해서 각 메시지가 스팸인지 햄인지 나타내는 문자열 벡터를 저장한다.
저장한 문자열 벡터에서 스팸의 비율이 적당한지 `prop.table()` 함수를 이용해 확인한다.


{% highlight r %}
sms_train_labels <- sms_raw[1:4169, ]$type
sms_test_labels  <- sms_raw[4170:5559, ]$type

prop.table(table(sms_train_labels))
{% endhighlight %}



{% highlight text %}
## sms_train_labels
##       ham      spam 
## 0.8647158 0.1352842
{% endhighlight %}



{% highlight r %}
prop.table(table(sms_test_labels))
{% endhighlight %}



{% highlight text %}
## sms_test_labels
##       ham      spam 
## 0.8683453 0.1316547
{% endhighlight %}

훈련 데이터와 테스트 데이터 모두 13%의 스팸 비율이므로 균등하게 나눠져 있다고 볼 수 있다.

**워드 클라우드(word cloud)**는 텍스트 데이터에서 단어의 빈도를 시각적으로 묘사하는 방법이다.
`wordcloud` 패키지는 워크 클라우드를 만들기 위한 간단한 함수를 제공한다.
워드클라우드는 `wordcloud()` 함수를 이용해 말뭉치에서 바로 만들 수 있다.


{% highlight r %}
library(wordcloud)
wordcloud(sms_corpus_clean, min.freq = 50, random.order = FALSE)
{% endhighlight %}

![plot of chunk unnamed-chunk-21](/assets/article_images/2016-01-29-naive-bayes/unnamed-chunk-21-1.png)

`random.order = FALSE`를 추가함으로써 자주 나오는 단어일 수록 가운데에 위치하게 된다. `min.freq`는 워드 클라우드에 등장하기 위핸 최소 빈도수를 나타내는데, 말뭉치 문서 수의 약 10%로 설정한다.
이번엔 스팸 메시지와 햄 메시지에 대한 워드 클라우드 비교다. `subset()` 함수를 이용해서 `sms_raw` 데이터에서 스팸 메시지와 햄 메시지를 나눠준다.


{% highlight r %}
spam <- subset(sms_raw, type == "spam")
ham <- subset(sms_raw, type == "ham")
{% endhighlight %}

나눠준 데이터에 대해 각각 워드 클라우드를 만든다.


{% highlight r %}
wordcloud(spam$text, min.freq = 30, scale = c(3, 0.5), random.order = FALSE)
{% endhighlight %}

![plot of chunk unnamed-chunk-23](/assets/article_images/2016-01-29-naive-bayes/unnamed-chunk-23-1.png)

{% highlight r %}
wordcloud(ham$text, min.freq = 30, scale = c(3, 0.5), random.order = FALSE)
{% endhighlight %}

![plot of chunk unnamed-chunk-23](/assets/article_images/2016-01-29-naive-bayes/unnamed-chunk-23-2.png)

스팸 SMS 메시지는 urgent, free, mobile, call, stop과 같은 단어를 포함하고, 이런 단어들은 햄 클라우드에 등장하지 않는다.
반대로 햄 메시지에서는 can, sorry, need, time과 같은 단어를 사용한다.
이러한 차이는 나이브 베이즈 모델이 카테고리를 구별할 수 있는 키워드가 된다.

남은 마지막 작업은 희소 매트릭스에서 나이브 베이즈 분류기를 훈련하는 데 사용하는 데이터 구조로 변환하는 작업이다. 현재 `sms_dtm` 행렬에는 약 6,500개의 속성을 가지고 있는데, 속성의 수를 줄이기 위해 다섯 개 미만의 메시지에서만 등장하는 단어나 훈련 데이터의 0.1% 보다 적은 단어를 제거한다.
단어의 빈도수를 찾기 위해 `tm` 패키지의 `findFreqTerms()` 함수를 사용한다.


{% highlight r %}
?findFreqTerms()

# findFreqTerms(x, lowfreq = 0, highfreq = Inf)
{% endhighlight %}

`sms_dtm_train` 행렬에서 적어도 다섯 번 이상 나타난 단어들의 문자 벡터를 `sms_freq_words`에 저장한다.


{% highlight r %}
sms_freq_words <- findFreqTerms(sms_dtm_train, 5)
str(sms_freq_words)
{% endhighlight %}



{% highlight text %}
##  chr [1:1136] "abiola" "abl" "abt" "accept" "access" ...
{% endhighlight %}

`sms_freq_words`에는 1,136개의 단어가 포함되어 있음을 알 수 있다.
이제 훈련 데이터와 테스트 데이터에서 `sms_freq_words`에 있는 칼럼만 추출해서 저장한다.


{% highlight r %}
sms_dtm_freq_train<- sms_dtm_train[ , sms_freq_words]
sms_dtm_freq_test <- sms_dtm_test[ , sms_freq_words]
{% endhighlight %}

위 코드를 실행하면 훈련 데이터와 테스트 데이터는 이제 1,136개의 속성을 가지게 된다.

나이브 베이즈 분류기는 일반적으로 분류적 특성을 가진 데이터를 훈련한다.
지금 희소 행렬은 단어의 빈도가 수치형으로 나타나 있기 때문에 올바른 훈련을 할 수 없다.
따라서, 단어의 빈도가 0 이면 `No`를, 1 이상이면 `Yes`를 출력하는 사용자 함수를 정의하도록 하자.


{% highlight r %}
convert_counts <- function(x){
        x <- ifelse(x > 0, "Yes", "No")
}
{% endhighlight %}

위 함수를 훈련 데이터와 테스트 데이터에 일괄적으로 적용하기 위해서 `apply()` 함수를 사용한다.
`convert_counts()` 함수를 데이터의 각 열에 대해서 적용하려고 하는데, 이 때 매개변수 `MARGIN`을 사용한다.
대상이 행이면 `MARGIN = 1`, 열이면 `MARGIN = 2`이다.


{% highlight r %}
sms_train <- apply(sms_dtm_freq_train, MARGIN = 2, convert_counts)
sms_test <- apply(sms_dtm_freq_test, MARGIN = 2, convert_counts)
{% endhighlight %}

##### 3. 데이터를 적용해 모델 훈련

모델의 훈련은 `e1071` 패키지 `naiveBayes()` 함수를 사용한다.


{% highlight r %}
library(e1071)
?naiveBayes

# naiveBayes(train, class, laplace = 0)
{% endhighlight %}

각각의 매개변수는 다음과 같다. `train`은 훈련 데이터를 포함하고 있는 데이터 프레임이나 행렬, `class`는 훈련 데이터의 클래스(팩터) 벡터, `laplace`는 라플라스 추정기의 사용 여부다.
이제 `sms_train` 훈련 데이터를 이용해 모델을 훈련시킨다.


{% highlight r %}
sms_classifier <- naiveBayes(sms_train, sms_train_labels)
head(sms_classifier$tables)
{% endhighlight %}



{% highlight text %}
## $abiola
##                 abiola
## sms_train_labels          No         Yes
##             ham  0.998058252 0.001941748
##             spam 1.000000000 0.000000000
## 
## $abl
##                 abl
## sms_train_labels          No         Yes
##             ham  0.994729542 0.005270458
##             spam 1.000000000 0.000000000
## 
## $abt
##                 abt
## sms_train_labels          No         Yes
##             ham  0.995839112 0.004160888
##             spam 1.000000000 0.000000000
## 
## $accept
##                 accept
## sms_train_labels          No         Yes
##             ham  0.998613037 0.001386963
##             spam 1.000000000 0.000000000
## 
## $access
##                 access
## sms_train_labels           No          Yes
##             ham  0.9997226075 0.0002773925
##             spam 0.9929078014 0.0070921986
## 
## $account
##                 account
## sms_train_labels          No         Yes
##             ham  0.996948682 0.003051318
##             spam 0.971631206 0.028368794
{% endhighlight %}

##### 4. 모델 성능 평가

`predict()` 함수를 이용해 테스트 데이터에 대한 예측 결과를 `sms_test_pred`에 저장한다.


{% highlight r %}
sms_test_pred <- predict(sms_classifier, sms_test)
{% endhighlight %}

예측과 실제 결과를 비교하기 위해 `gmodels` 패키지의 `CrossTable()` 함수를 사용한다.


{% highlight r %}
library(gmodels)
CrossTable(sms_test_pred, sms_test_labels, prop.chisq = FALSE,
           dnn = c('predicted', 'actual'))
{% endhighlight %}



{% highlight text %}
## 
##  
##    Cell Contents
## |-------------------------|
## |                       N |
## |           N / Row Total |
## |           N / Col Total |
## |         N / Table Total |
## |-------------------------|
## 
##  
## Total Observations in Table:  1390 
## 
##  
##              | actual 
##    predicted |       ham |      spam | Row Total | 
## -------------|-----------|-----------|-----------|
##          ham |      1201 |        30 |      1231 | 
##              |     0.976 |     0.024 |     0.886 | 
##              |     0.995 |     0.164 |           | 
##              |     0.864 |     0.022 |           | 
## -------------|-----------|-----------|-----------|
##         spam |         6 |       153 |       159 | 
##              |     0.038 |     0.962 |     0.114 | 
##              |     0.005 |     0.836 |           | 
##              |     0.004 |     0.110 |           | 
## -------------|-----------|-----------|-----------|
## Column Total |      1207 |       183 |      1390 | 
##              |     0.868 |     0.132 |           | 
## -------------|-----------|-----------|-----------|
## 
## 
{% endhighlight %}

`CrossTable()` 함수에서 `dnn` 매개변수는 각 행과 열의 이름을 정해준다. 본 모델의 정밀도는 97.6%, 재현율은 99.5%, 정확도는 97.4%다.

##### 5. 모델 성능 향상

이전의 나이브 베이즈 분류기에 라플라스 추정기를 적용하도록 하자.


{% highlight r %}
sms_classifier2 <- naiveBayes(sms_train, sms_train_labels,
                              laplace = 1)
sms_test_pred2 <- predict(sms_classifier2, sms_test)
CrossTable(sms_test_pred2, sms_test_labels, 
           prop.chisq = FALSE, dnn = c('predicted', 'actual'))
{% endhighlight %}



{% highlight text %}
## 
##  
##    Cell Contents
## |-------------------------|
## |                       N |
## |           N / Row Total |
## |           N / Col Total |
## |         N / Table Total |
## |-------------------------|
## 
##  
## Total Observations in Table:  1390 
## 
##  
##              | actual 
##    predicted |       ham |      spam | Row Total | 
## -------------|-----------|-----------|-----------|
##          ham |      1202 |        28 |      1230 | 
##              |     0.977 |     0.023 |     0.885 | 
##              |     0.996 |     0.153 |           | 
##              |     0.865 |     0.020 |           | 
## -------------|-----------|-----------|-----------|
##         spam |         5 |       155 |       160 | 
##              |     0.031 |     0.969 |     0.115 | 
##              |     0.004 |     0.847 |           | 
##              |     0.004 |     0.112 |           | 
## -------------|-----------|-----------|-----------|
## Column Total |      1207 |       183 |      1390 | 
##              |     0.868 |     0.132 |           | 
## -------------|-----------|-----------|-----------|
## 
## 
{% endhighlight %}

이전의 나이브 베이즈 분류기보다 정확도가 97.6%로 상승한 것을 알 수 있다.

[^1]: https://ko.wikipedia.org/wiki/%EC%96%B4%EA%B0%84_%EC%B6%94%EC%B6%9C
