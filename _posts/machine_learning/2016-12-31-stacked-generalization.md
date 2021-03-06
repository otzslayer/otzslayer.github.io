---
title: "Stacked Generalization with Titanic Dataset"
author: "Jaeyoon Han"
date: "2016-12-31"
output: html_document
layout: post
image: /assets/article_images/2016-12-31-stacked-generalization/title.jpg
categories: machine-learning
---





## Stacked Generalization with Titanic Dataset

지난번 Stacked Generalization 기법과 관련된 포스트를 번역을 하던 중, 잘 정리되지 않은 데이터에 대해서 직접 실습을 해보고 싶었다. Kaggle competition을 시작하기에는 공부가 덜 되어  그나마 간단한 데이터에 시도하고자 했다. 마침 타이타닉 데이터 원본을 가지고 있었기에 한 번 테스트 해보기로 했다.

### Data Loading

원본 데이터에 약간의 전처리를 가했다. 결측값을 제거하기 위해 Interpolation을 수행하고, 약간의 Feature engineering을 한 후 필요한 칼럼만 남겨두었다.


{% highlight r linenos %}
library(readr)

train <- read_csv(file = "data/titanic/train.csv")
test <- read_csv(file = "data/titanic/test.csv")
train$Survived <- as.factor(train$Survived)
test$Survived <- as.factor(test$Survived)
{% endhighlight %}

헤당 데이터의 Sparse matrix를 만들기 위해서 `model.matrix()` 함수를 사용한다.


{% highlight r linenos %}
train_mat <- model.matrix(data = train, Survived ~ .)[, -1]
test_mat <- model.matrix(data = test, Survived ~ .)[, -1]
{% endhighlight %}

### Feature Selection (Boruta analysis)

Feature selection을 위해서 `Boruta` 패키지를 사용한다. Boruta algorithm은 Random forest의 wrapper로 포함되어 있는 Feature importance 기능과 굉장히 유사한데, 최근 Kaggle의 House price 예측 컴피티션에서 한 참가자가 사용한 것을 보고 알게 되었다. 제법 괜찮은 알고리즘으로 알고 있어서 사용했다.


{% highlight r linenos %}
library(Boruta)

set.seed(7)
bor.result <- Boruta(train_mat, train$Survived, doTrace = 1)
getSelectedAttributes(bor.result)
{% endhighlight %}



{% highlight text %}
 [1] "Pclass"                "Sexmale"              
 [3] "Age"                   "SibSp"                
 [5] "Parch"                 "Fare"                 
 [7] "CabinB"                "CabinD"               
 [9] "CabinE"                "CabinU"               
[11] "EmbarkedS"             "TitleMiss"            
[13] "TitleMr"               "TitleMrs"             
[15] "TitleOfficer"          "FamilySize"           
[17] "FamilyTypeSingletone"  "FamilyTypeSmallFamily"
[19] "Child"                 "Mother"               
{% endhighlight %}


{% highlight r linenos %}
plot(bor.result)
{% endhighlight %}

<img src="/assets/article_images/2016-12-31-stacked-generalization/unnamed-chunk-6-1.png" title="plot of chunk unnamed-chunk-6" alt="plot of chunk unnamed-chunk-6" width="576" style="display: block; margin: auto;" />


{% highlight r linenos %}
bor.result$finalDecision
{% endhighlight %}



{% highlight text %}
               Pclass               Sexmale                   Age 
            Confirmed             Confirmed             Confirmed 
                SibSp                 Parch                  Fare 
            Confirmed             Confirmed             Confirmed 
               CabinB                CabinC                CabinD 
            Confirmed              Rejected             Confirmed 
               CabinE                CabinF                CabinG 
            Confirmed              Rejected              Rejected 
               CabinU             EmbarkedQ             EmbarkedS 
            Confirmed              Rejected             Confirmed 
            TitleMiss               TitleMr              TitleMrs 
            Confirmed             Confirmed             Confirmed 
         TitleOfficer          TitleRoyalty            FamilySize 
            Confirmed              Rejected             Confirmed 
 FamilyTypeSingletone FamilyTypeSmallFamily                 Child 
            Confirmed             Confirmed             Confirmed 
               Mother 
            Confirmed 
Levels: Tentative Confirmed Rejected
{% endhighlight %}


{% highlight r linenos %}
train_mat <- train_mat[, getSelectedAttributes(bor.result)]
test_mat <- test_mat[, getSelectedAttributes(bor.result)]
{% endhighlight %}

### Construct Base Model

생성한 데이터를 이용해서 Level 0의 기본 모델들을 생성한다. 사용할 모델은 총 8개로 다음과 같다.

1. k Nearest Neighbor
2. Support Vector Machine with Linear Kernel
3. Support Vector Machine with Polynomial Kernel
4. Support Vector Machine with Radial Kernel
5. Random Forest
6. Logistic Regression with L1 Regularization
7. Logistic Regression with L2 Regularization
8. Xgboost

각각의 모델들은 모두 10-fold Cross Validation을 이용해서 Parameter tuning을 한다. 

##### Base Model 1: kNN


{% highlight r linenos %}
library(e1071)
library(class)

set.seed(7)
knn.cv <- tune.knn(x = train_mat, y = factor(train$Survived), k = seq(1, 40, by = 2),
                   tunecontrol = tune.control(sampling = "cross"), cross = 10)
knn <- knn(train_mat, test_mat, factor(train$Survived), k = knn.cv$best.parameters[, 1])
{% endhighlight %}

##### Base Model 2: SVM with Linear Kernel


{% highlight r linenos %}
doMC::registerDoMC(4)
set.seed(7)
linear.svm.cv <- tune.svm(x = train_mat, y = factor(train$Survived), kernel = "linear", cost = c(0.001, 0.01, 0.1, 1, 5, 10),
                       tunecontrol = tune.control(sampling = "cross"))
linear.svm <- predict(linear.svm.cv$best.model, test_mat)
{% endhighlight %}

##### Base Model 3: SVM with Polynomial Kernel


{% highlight r linenos %}
set.seed(7)
poly.svm.cv <- tune.svm(x = train_mat, y = factor(train$Survived), kernel = "polynomial",
                     degree = c(2, 3, 4), coef0 = c(0.1, 0.5, 1, 2),
                     cost = c(0.001, 0.01, 0.1, 1, 3, 5),
                     tunecontrol = tune.control(sampling = "cross"))
poly.svm <- predict(poly.svm.cv$best.model, test_mat)
{% endhighlight %}

##### Base Model 4: SVM with Radial Kernel


{% highlight r linenos %}
set.seed(7)
radial.svm.cv <- tune.svm(x = train_mat, y = factor(train$Survived), kernel = "radial",
                     gamma = c(0.1, 0.5, 1, 2, 3), coef0 = c(0.1, 0.5, 1, 2),
                     cost = c(0.001, 0.01, 0.1, 1, 3, 5),
                     tunecontrol = tune.control(sampling = "cross"))
radial.svm <- predict(radial.svm.cv$best.model, test_mat)
{% endhighlight %}

##### Base Model 5: Random Forest


{% highlight r linenos %}
library(ranger)

set.seed(7)
rf <- ranger(Survived ~ .,
             data = data.frame(train_mat, Survived = factor(as.numeric(train$Survived) - 1)),
             num.trees = 2000)
randomForest <- predict(rf$forest, test_mat)
randomForest <- randomForest$predictions
{% endhighlight %}

##### Base Model 6: Logistic Regression with L1 Regularization


{% highlight r linenos %}
library(glmnet)

set.seed(7)
logit_L1.cv <- cv.glmnet(x = train_mat, y = train$Survived, family = 'binomial',
                   alpha = 1)
logit.L1 <- predict(logit_L1.cv, test_mat, s = logit_L1.cv$lambda.min, type = 'response')
logit.L1 <- as.vector(ifelse(logit.L1 > 0.5, 1, 0))
{% endhighlight %}

##### Base Model 7: Logistic Regression with L2 Regularization


{% highlight r linenos %}
set.seed(7)
logit_L2.cv <- cv.glmnet(x = train_mat, y = train$Survived, family = 'binomial',
                   alpha = 0)
logit.L2 <- predict(logit_L2.cv, test_mat, s = logit_L2.cv$lambda.min, type = 'response')
logit.L2 <- as.vector(ifelse(logit.L2 > 0.5, 1, 0))
{% endhighlight %}

##### Base Model 8: Xgboost


{% highlight r linenos %}
library(xgboost)

trCtrl <- trainControl(method = "repeatedcv", number = 10, allowParallel = TRUE)

xgb.grid <- expand.grid(nrounds = c(180, 200, 220),
                        eta = c(0.01, 0.03, 0.05),
                        max_depth = c(3, 5, 7),
                        gamma = 0,
                        colsample_bytree = c(0.6, 0.8, 1),
                        min_child_weight = c(0.8, 0.9, 1),
                        subsample = 1
)
{% endhighlight %}


{% highlight r linenos %}
set.seed(7)
doMC::registerDoMC(4)
xgbTrain <- train(x = train_mat,
                  y = train$Survived,
                  objective = "binary:logistic",
                  trControl = trCtrl,
                  tuneGrid = xgb.grid,
                  method = "xgbTree"
)

xgb.titanic <- xgboost(params = xgbTrain$bestTune,
                       nrounds = xgbTrain$bestTune[1, 1],
                       data = train_mat,
                       label = as.numeric(train$Survived) - 1,
                       objective = "binary:logistic",
                       verbose = FALSE)
xgb <- predict(xgb.titanic, test_mat)
xgb <- ifelse(xgb > 0.5, 1, 0)
{% endhighlight %}

##### Accuracy of Base Models


{% highlight r linenos %}
cat("Accuracy(kNN):", round(confusionMatrix(knn, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(SVM, Linear):", round(confusionMatrix(linear.svm, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(SVM, Polynomial):", round(confusionMatrix(poly.svm, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(SVM, Radial):", round(confusionMatrix(radial.svm, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(Random Forest):", round(confusionMatrix(randomForest, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(Logistic L1):", round(confusionMatrix(logit.L1, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(Logistic L2):", round(confusionMatrix(logit.L2, test$Survived, positive = '1')$overall[1], 4),
"\nAccuracy(Xgboost):", round(confusionMatrix(xgb, test$Survived, positive = '1')$overall[1], 4))
{% endhighlight %}



{% highlight text %}
Accuracy(kNN): 0.6796 
Accuracy(SVM, Linear): 0.8026 
Accuracy(SVM, Polynomial): 0.7994 
Accuracy(SVM, Radial): 0.7799 
Accuracy(Random Forest): 0.7767 
Accuracy(Logistic L1): 0.8026 
Accuracy(Logistic L2): 0.7994 
Accuracy(Xgboost): 0.7864
{% endhighlight %}

### Make Meta Features

이제 기본 모델들을 stacking하는 작업을 하기 전에 메타 피처들을 추가시키자. 위에서 구한 예측값들은 `test_mat`에 추가되는 메타 피처(meta features)가 된다. `train_mat`에도 메타 피처를 추가해야 하는데, 기존의 데이터를 5개의 폴드로 나누어서 추가시킨다. 하나의 폴드를 테스트 폴드로 만들고, 나머지를 트레이닝 폴드로 만든 다음, 위 기본 모델들에서 얻은 파라미터를 그대로 사용하여 예측값을 뽑아낸다. 이를 모두 합쳐서 다시 `train_mat`에 넣는 작업을 수행한다.



{% highlight r linenos %}
folded_train <- train %>%
    mutate(foldID = rep(1:5, each = nrow(train)/5)) %>%
    select(foldID, everything())

folded_mat <- model.matrix(data = folded_train, Survived ~ .)[, -1]

### Initiating ###
k_NN <- NULL
svm.linear <- NULL
svm.poly <- NULL
svm.radial <- NULL
rf <- NULL
logitL1 <- NULL
logitL2 <- NULL
XGB <- NULL

for(targetFold in 1:5){
    trainFold <- filter(folded_train, foldID != targetFold) %>%
        select(-foldID)
    trainSurvived <- trainFold$Survived
    testFold <- filter(folded_train, foldID == targetFold) %>%
        select(-foldID)
    testSurvived <- testFold$Survived

    fold_train_mat <- folded_mat[folded_mat[, 1] != targetFold, -1]
    fold_test_mat <- folded_mat[folded_mat[, 1] == targetFold, -1]
        
    ### kNN ###
    temp <- knn(fold_train_mat, fold_test_mat, trainSurvived,
                k = knn.cv$best.parameters[, 1])
    k_NN <- c(k_NN, temp)
    
    ### SVM with Linear Kernel ###
    linear <- svm(x = fold_train_mat, y = trainSurvived, kernel = 'linear',
                  cost = linear.svm.cv$best.parameters[1, 1])
    temp <- predict(linear, fold_test_mat)
    svm.linear <- c(temp, svm.linear)
    
    ### SVM with Polynomial Kernel ###
    poly <- svm(x = fold_train_mat, y = trainSurvived, kernel = 'polynomial',
                cost = poly.svm.cv$best.parameters[1, "cost"],
                degree = poly.svm.cv$best.parameters[1, "degree"],
                coef0 = poly.svm.cv$best.parameters[1, "coef0"])
    temp <- predict(poly, fold_test_mat)
    svm.poly <- c(temp, svm.poly)
    
    ### SVM with Radial Basis Kernel ###
    radial <- svm(x = fold_train_mat, y = trainSurvived, kernel = 'radial',
                  cost = radial.svm.cv$best.parameters[1, "cost"],
                  gamma = radial.svm.cv$best.parameters[1, "gamma"],
                  coef0 = radial.svm.cv$best.parameters[1, "coef0"])
    temp <- predict(radial, fold_test_mat)
    svm.radial <- c(temp, svm.radial)
    
    ### Random Forest ###
    set.seed(7)
    RF <- ranger(Survived ~ ., data = trainFold, num.trees = 2000)
    temp <- predict(RF$forest, testFold)
    temp <- temp$predictions
    rf <- c(temp, rf)
    
    ### Logistic Regression with L1 Regularization ###
    logit_L1 <- glmnet(x = fold_train_mat, y = trainSurvived, family = 'binomial',
                   alpha = 1, lambda = logit_L1.cv$lambda.min)
    temp <- predict(logit_L1, fold_test_mat, type = 'response')
    temp <- as.vector(ifelse(temp > 0.5, 1, 0))
    logitL1 <- c(temp, logitL1)
    
    ### Logistic Regression with L2 Regularization ###
    logit_L2 <- glmnet(x = fold_train_mat, y = trainSurvived, family = 'binomial',
                   alpha = 0, lambda = logit_L2.cv$lambda.min)
    temp <- predict(logit_L2, fold_test_mat, type = 'response')
    temp <- as.vector(ifelse(temp > 0.5, 1, 0))
    logitL2 <- c(temp, logitL2)
    
    ### XGBoost ###
    xgb.titanic <- xgboost(params = xgbTrain$bestTune,
                           nrounds = xgbTrain$bestTune[1, 1],
                           data = fold_train_mat,
                           label = as.numeric(trainSurvived) - 1,
                           objective = "binary:logistic",
                           verbose = FALSE)
    temp <- predict(xgb.titanic, fold_test_mat)
    temp <- ifelse(temp > 0.5, 1, 0)
    XGB <- c(temp, XGB)
    
}
{% endhighlight %}


{% highlight r linenos %}
meta_train <- cbind(train_mat,
                    kNN = k_NN - 1,
                    LinearSVM = svm.linear - 1,
                    PolySVM = svm.poly - 1,
                    RadialSVM = svm.radial - 1,
                    RF = rf - 1,
                    LogitL1 = logitL1,
                    LogitL2 = logitL2,
                    XGB = XGB)
{% endhighlight %}


{% highlight r linenos %}
meta_test <- cbind(test_mat,
                   kNN = as.numeric(knn) - 1,
                   LinearSVM = as.numeric(linear.svm) - 1,
                   PolySVM = as.numeric(poly.svm) - 1,
                   RadialSVM = as.numeric(radial.svm) - 1,
                   RF = as.numeric(randomForest) - 1,
                   LogitL1 = logit.L1,
                   LogitL2 = logit.L2,
                   XGB = xgb)
{% endhighlight %}

### Model Stacking

마지막으로 모델을 스택하는 작업만 남았다. 스택 모델은 위에서 가장 좋은 성능을 보인 **Logistic Regression with L1 Regularization**으로 만든다. 10-fold Cross Validation으로 적절한 `lambda`값을 찾도록 하자.


{% highlight r linenos %}
lambda <- exp(-seq(5, 6, length.out = 400))

set.seed(7)
meta.logit_L1.cv <- cv.glmnet(x = meta_train, y = train$Survived, family = 'binomial',
                   alpha = 1, lambda = lambda)

meta.pred <- predict(meta.logit_L1.cv, meta_test, s = meta.logit_L1.cv$lambda.min, type = 'response')
meta.pred <- as.vector(ifelse(meta.pred > 0.5, 1, 0))
{% endhighlight %}


{% highlight r linenos %}
cat("Accuracy(Stacked Model):", round(confusionMatrix(meta.pred, test$Survived, positive = '1')$overall[1], 4))
{% endhighlight %}



{% highlight text %}
Accuracy(Stacked Model): 0.8091
{% endhighlight %}

![](/assets/images/ensemble.png)

### Conclusion

사실 Stacked Generalization과 같은 스택 기법은 일반적으론 성능 향상을 가져올 수는 있지만, 항상 좋은 결과를 보장하지 않는 것으로 알려져 있다. 다행히 이번 시도에서는 가장 좋은 성능을 보여주었다. 처음 해보는 작업이라 굉장히 서툴었고, 이론적인 부분이 부족하여 더 나은 성능의 모델을 만들지 못했을 수도 있다. 다음 작업은 클래스를 뽑아내는 것이 아닌 확률값을 뽑아내어 스택 모델을 만드는 것이다. 다음 작업을 위해 Kaggle 우승자의 인터뷰를 쭈욱 읽어봐야겠다.
