"""
Beginner Level Part 1b: Logistic Regression and K-Nearest Neighbors (KNN)
"""
from level_novice import make_q

def get_beginner_part1_b_topics():
    topics = []

    # 3. LOGISTIC REGRESSION
    topics.append({
        "id": "logistic-regression",
        "title": "Logistic Regression & Classification",
        "description": "Odds and log-odds (logit), sigmoid activation function, binary cross-entropy loss (log loss), maximum likelihood estimation, and multiclass Softmax.",
        "duration": "30 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Logistic Regression for Classification",
                    "subtitle": "Probabilistic Binary and Multiclass Classification via the Sigmoid and Softmax Transforms"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "The Sigmoid (Logistic) Function",
                    "content": "Unlike linear regression which outputs unbounded continuous values ($-\\infty$ to $+\\infty$), logistic regression passes a linear combination through the **logistic sigmoid function** $\\sigma(z)$ to produce a calibrated probability between 0 and 1:\n\n$$z = \\mathbf{w}^T \\mathbf{x} + b$$\n$$\\hat{p} = P(y = 1 | \\mathbf{x}) = \\sigma(z) = \\frac{1}{1 + e^{-z}} = \\frac{1}{1 + e^{-(\\mathbf{w}^T \\mathbf{x} + b)}}$$\n\n- When $z \\rightarrow +\\infty$, $\\sigma(z) \\rightarrow 1$.\n- When $z \\rightarrow -\\infty$, $\\sigma(z) \\rightarrow 0$.\n- When $z = 0$, $\\sigma(z) = 0.5$ (the default decision boundary threshold)."
                },
                {
                    "type": "text",
                    "title": "Log-Odds and the Logit Transformation",
                    "content": "The **odds** of an event with probability $p$ is defined as the ratio of success to failure:\n$$\\text{Odds} = \\frac{p}{1 - p}$$\n\nTaking the natural logarithm of the odds yields the **logit** function:\n$$\\text{logit}(p) = \\ln\\left(\\frac{p}{1 - p}\\right) = \\mathbf{w}^T \\mathbf{x} + b$$\n\nThus, Logistic Regression is fundamentally a linear model for the **log-odds** of the positive class!"
                },
                {
                    "type": "text",
                    "title": "The Cost Function: Binary Cross-Entropy (Log Loss)",
                    "content": "We cannot use Mean Squared Error (MSE) for logistic regression because the non-linear sigmoid causes MSE to be non-convex with numerous local minima traps. Instead, we use **Binary Cross-Entropy Loss** derived from Maximum Likelihood Estimation (MLE):\n\n$$J(\\mathbf{w}) = -\\frac{1}{n} \\sum_{i=1}^n \\left[ y^{(i)} \\ln(\\hat{p}^{(i)}) + (1 - y^{(i)}) \\ln(1 - \\hat{p}^{(i)}) \\right]$$\n\n- If ground truth $y = 1$ and model predicts $\\hat{p} \\rightarrow 1$, penalty $\\rightarrow 0$.\n- If ground truth $y = 1$ and model predicts $\\hat{p} \\rightarrow 0$, penalty $-\\ln(\\hat{p}) \\rightarrow +\\infty$!\n- Binary Cross-Entropy is strictly **convex** with respect to weights $\\mathbf{w}$."
                },
                {
                    "type": "callout",
                    "style": "comparison",
                    "title": "Multiclass Extensions: OvR vs. Softmax",
                    "content": "| Strategy | Architecture | Formulation | Best For |\n|---|---|---|---|\n| **One-vs-Rest (OvR)** | Trains $K$ separate binary logistic classifiers | $P(y=k \\text{ vs not } k)$ | Multilabel classification or large $K$ |\n| **Multinomial (Softmax)** | Single unified model producing normalized probability vector | $P(y=k) = \\frac{e^{\\mathbf{w}_k^T \\mathbf{x}}}{\\sum_j e^{\\mathbf{w}_j^T \\mathbf{x}}}$ | Mutually exclusive multiclass problems (e.g. MNIST 0-9) |"
                },
                {
                    "type": "callout",
                    "style": "key-takeaway",
                    "title": "Decision Threshold Calibration",
                    "content": "The default classification threshold is 0.5. However, in asymmetric risk domains (e.g. cancer detection or fraud), the engineer can lower the threshold to 0.15 to maximize **Recall** at the expense of Precision."
                }
            ]
        },
        "interactive": {
            "type": "classification-game",
            "title": "Sigmoid Probability Explorer",
            "description": "Vary input values $z = w \\cdot x + b$ to see how the sigmoid curve maps logits to output probabilities.",
            "items": [
                {"text": "z = +5.0 maps to probability near 0.993", "category": "High Probability"},
                {"text": "z = 0.0 maps to probability exactly 0.500", "category": "Decision Boundary"},
                {"text": "z = -5.0 maps to probability near 0.007", "category": "Low Probability"},
                {"text": "z = +2.2 maps to probability near 0.900", "category": "High Probability"}
            ],
            "categories": ["High Probability", "Decision Boundary", "Low Probability"]
        },
        "code": {
            "description": "Train a Logistic Regression classifier, inspect learned coefficients, extract probabilities with predict_proba, and plot the decision boundary.",
            "starter": "import numpy as np\nfrom sklearn.datasets import make_classification\nfrom sklearn.linear_model import LogisticRegression\n\n# Generate a synthetic binary classification dataset\nX, y = make_classification(n_samples=100, n_features=2, n_redundant=0, n_informative=2,\n                           n_clusters_per_class=1, random_state=42)\n\n# Fit Logistic Regression\nclf = LogisticRegression(random_state=42)\nclf.fit(X, y)\n\n# Evaluate predicted probabilities for the first 3 samples\nprobs = clf.predict_proba(X[:3])\npreds = clf.predict(X[:3])\n\nprint('Learned Coefficients (weights):', clf.coef_[0])\nprint('Learned Intercept (bias):      ', clf.intercept_[0])\nprint('\\nFirst 3 Samples:')\nfor i in range(3):\n    print(f'Sample {i}: P(Class 0) = {probs[i][0]:.3f}, P(Class 1) = {probs[i][1]:.3f} -> Predicted: {preds[i]}')\n"
        },
        "quiz": [
            make_q("What is the mathematical range of the logistic sigmoid function $\\sigma(z) = \\frac{1}{1 + e^{-z}}$?", ["$[-1, +1]$", "$(0, 1)$ strictly between 0 and 1", "$(-\\infty, +\\infty)$", "$[0, +\\infty)$"], 1, "The sigmoid function squashes any real-valued number from $-\\infty$ to $+\\infty$ smoothly into the open interval $(0, 1)$."),
            make_q("What is the value of the sigmoid function $\\sigma(0)$ when the input logit $z = 0$?", ["0.0", "0.5", "1.0", "-1.0"], 1, "$\\sigma(0) = \\frac{1}{1 + e^{-0}} = \\frac{1}{1 + 1} = \\frac{1}{2} = 0.5$."),
            make_q("Why is Mean Squared Error (MSE) NOT used as the loss function for Logistic Regression?", ["Because MSE cannot be implemented in Python", "The non-linear sigmoid transform makes the MSE cost function non-convex with numerous local minima traps", "Because MSE produces negative probabilities", "Because MSE only works with text data"], 1, "Passing a linear combination through the non-linear sigmoid renders MSE non-convex, meaning gradient descent could easily get trapped in poor local minima."),
            make_q("What is the cost function used to optimize Logistic Regression?", ["Mean Absolute Percentage Error", "Binary Cross-Entropy Loss (Log Loss)", "Hinge Loss", "Kullback-Leibler Divergence"], 1, "Binary Cross-Entropy derived from Maximum Likelihood Estimation is the standard convex loss for binary logistic regression."),
            make_q("If the ground truth is $y = 1$ and a logistic model predicts probability $\\hat{p} = 0.0001$, what happens to the Log Loss penalty?", ["The penalty is zero", "The penalty approaches infinity ($-\\ln(0.0001) \\approx 9.21$), severely penalizing confident incorrect predictions", "The penalty becomes negative", "The penalty is capped at 1.0"], 1, "Log Loss heavily penalizes confident wrong predictions; as $\\hat{p} \\rightarrow 0$ when $y = 1$, $-\\ln(\\hat{p}) \\rightarrow +\\infty$."),
            make_q("What is the logit function defined as?", ["The square root of probability", "The natural logarithm of the odds: $\\ln\\left(\\frac{p}{1-p}\\right)$", "The inverse of matrix determinant", "The exponential of the target"], 1, "The logit is the log-odds: mapping probability $p \\in (0, 1)$ to $(-\\infty, +\\infty)$."),
            make_q("If the odds of an outcome are 3 to 1, what is the corresponding probability $p$?", ["0.33", "0.75", "0.25", "3.0"], 1, "$p = \\frac{\\text{Odds}}{1 + \\text{Odds}} = \\frac{3}{1 + 3} = \\frac{3}{4} = 0.75$."),
            make_q("What geometric shape is the decision boundary of standard Logistic Regression?", ["A circle", "A linear hyperplane (a straight line in 2D, plane in 3D)", "A parabola", "A non-linear decision tree"], 1, "The decision boundary occurs where $\\mathbf{w}^T \\mathbf{x} + b = 0$, which is mathematically a linear hyperplane."),
            make_q("How can Logistic Regression be adapted to capture non-linear decision boundaries?", ["By increasing the learning rate to 10", "By introducing polynomial feature interactions ($x_1^2, x_1 x_2$) into the feature matrix prior to fitting", "By using OLS Normal Equation", "By deleting the intercept"], 1, "Expanding the feature space with polynomial terms allows linear classifiers to form non-linear boundaries in the original feature space."),
            make_q("What is the Softmax function used for in machine learning?", ["Calculating Euclidean distance between vectors", "Generalizing the binary sigmoid function to multi-class classification by outputting a normalized probability distribution over $K$ classes", "Minimizing hardware power usage", "Sorting decision tree branches"], 1, "The Softmax function $\\frac{e^{z_i}}{\\sum e^{z_j}}$ normalizes real-valued logits into probabilities that sum to 1.0 across $K$ classes."),
            make_q("In binary classification, if the cost of a False Negative (missing fraud) is 20x worse than a False Positive (alerting on legitimate user), how should the decision threshold be adjusted?", ["Raised from 0.5 to 0.9", "Lowered from 0.5 to approximately 0.05 - 0.15 to maximize recall", "Kept at exactly 0.500", "Thresholds cannot be changed in logistic regression"], 1, "Lowering the decision threshold flags more potential cases as positive, dramatically reducing costly False Negatives."),
            make_q("What does a positive coefficient $w_1 = +1.5$ in logistic regression indicate about feature $x_1$?", ["Increasing $x_1$ decreases the probability of the target", "For every 1-unit increase in $x_1$, the log-odds of the positive class increase by 1.5 (odds multiply by $e^{1.5} \\approx 4.48$)", "Feature $x_1$ has 1.5% accuracy", "Feature $x_1$ is an outlier"], 1, "Coefficients in logistic regression represent changes in log-odds; exponentiating gives the multiplicative change in odds (odds ratio)."),
            make_q("What happens when training data is perfectly linearly separable in unregularized Logistic Regression?", ["Training finishes in 1 iteration", "The weights $\\mathbf{w}$ can diverge toward infinity as the model tries to push predicted probabilities to exactly 0.0 and 1.0", "The loss becomes negative", "The intercept becomes zero"], 1, "Without regularization, weights explode to $\\pm \\infty$ on separable data to make sigmoid outputs exactly 0 or 1, requiring $L_2$ regularization."),
            make_q("How does $L_2$ regularization (Ridge penalty) prevent weight explosion in Logistic Regression?", ["By deleting features with small weights", "By adding a penalty $\\frac{1}{2} \\lambda \\|\\mathbf{w}\\|_2^2$ to the log loss function, penalizing large weight magnitudes", "By converting logits into integers", "By forcing all weights to be positive"], 1, "$L_2$ regularization bounds weight magnitudes, ensuring numerical stability even on linearly separable datasets."),
            make_q("In Scikit-learn's `LogisticRegression(C=1.0)`, what does the hyperparameter `C` represent?", ["The learning rate", "The inverse of regularization strength ($C = 1 / \\lambda$); smaller values specify stronger regularization", "The count of training epochs", "The batch size"], 1, "In scikit-learn, $C$ is inverse regularization strength; smaller $C$ imposes stronger penalties against large weights."),
            make_q("What is the derivative of the sigmoid function $\\sigma(z)$ with respect to $z$?", ["$\\sigma(z)^2$", "$\\sigma(z)(1 - \\sigma(z))$", "$e^{-z}$", "$\\frac{1}{z}$"], 1, "The derivative of the sigmoid is convenient and elegant: $\\sigma'(z) = \\sigma(z)(1 - \\sigma(z))$."),
            make_q("What is the gradient of the binary cross-entropy loss with respect to weight $w_j$ in Logistic Regression?", ["$\\frac{1}{n} \\sum (\\hat{p}_i - y_i) x_{ij}$", "$\\sum (y_i - \\hat{p}_i)^2$", "$\\frac{1}{n} \\sum y_i x_{ij}$", "Zero"], 0, "Remarkably, the gradient $\\nabla_{\\mathbf{w}} J = \\frac{1}{n} X^T (\\hat{\\mathbf{p}} - \\mathbf{y})$ has identical functional form to linear regression!"),
            make_q("What is the One-vs-Rest (OvR) multiclass strategy?", ["Training 1 model that outputs 10 classes simultaneously", "Training $K$ separate binary classifiers, each distinguishing one class from all other $K-1$ classes combined", "Pairing every class against every other class", "Selecting the class with the smallest weight"], 1, "OvR trains $K$ individual binary classifiers: class 1 vs rest, class 2 vs rest, etc., choosing the highest probability."),
            make_q("If you have 4 classes in a multiclass problem, how many binary classifiers does One-vs-Rest (OvR) train?", ["2", "4", "6", "16"], 1, "OvR trains exactly $K$ binary models. For 4 classes, it trains 4 binary models."),
            make_q("If you have 4 classes, how many binary classifiers does One-vs-One (OvO) train?", ["4", "6 ($\\frac{4 \\times 3}{2} = 6$)", "12", "16"], 1, "OvO trains a classifier for every pairwise combination: $\\frac{K(K-1)}{2} = \\frac{4 \\times 3}{2} = 6$."),
            make_q("What is probability calibration in classification models?", ["Making sure probabilities sum to 100", "Ensuring that when a model outputs a confidence of 0.80, the empirical ground-truth frequency of the event is indeed 80%", "Dividing probabilities by 2", "Setting all probabilities to 0.5"], 1, "A calibrated classifier outputs true posterior probabilities matching empirical base rates (e.g. Platt scaling / isotonic regression)."),
            make_q("Which method is commonly used to recalibrate uncalibrated probability predictions?", ["Platt Scaling (logistic regression on model outputs) or Isotonic Regression", "Multiplying logits by 10", "Adding random Gaussian noise", "Deleting outliers"], 0, "Platt scaling fits a univariate logistic regression to model score outputs to calibrate them into true probabilities."),
            make_q("What does a classification Brier score measure?", ["The execution time of the model", "The mean squared difference between predicted probabilities and the actual binary outcomes: $\\frac{1}{n} \\sum (\\hat{p}_i - y_i)^2$", "The number of parameters in the model", "The accuracy on the majority class"], 1, "The Brier score measures the accuracy of probabilistic predictions; lower scores indicate better calibration and discrimination."),
            make_q("Why is feature scaling essential before fitting Logistic Regression when regularization is enabled?", ["Logistic regression cannot compute without scaling", "Because regularization penalizes all weights equally; without scaling, features with large scales have artificially small weights and escape penalization", "Scaling makes non-linear data linear", "Scaling removes missing values"], 1, "Regularization applies uniform penalties; if feature scales differ by orders of magnitude, unscaled features are unfairly penalized."),
            make_q("What is the difference between `predict()` and `predict_proba()` in scikit-learn?", ["`predict()` returns discrete class labels (0 or 1); `predict_proba()` returns the continuous probability array $[P(y=0), P(y=1)]$", "`predict()` runs on CPU; `predict_proba()` runs on GPU", "`predict()` is for training; `predict_proba()` is for testing", "They are identical functions with identical outputs"], 0, "`predict()` thresholds probabilities at 0.5 to return discrete labels; `predict_proba()` returns raw continuous probabilities."),
            make_q("What is the log-loss for a prediction of $\\hat{p} = 0.5$ when the true label is $y = 1$?", ["$0$", "$-\\ln(0.5) \\approx 0.693$", "$1.0$", "$\\infty$"], 1, "When $y = 1$, loss is $-\\ln(\\hat{p}) = -\\ln(0.5) = \\ln(2) \\approx 0.693$."),
            make_q("What is the Receiver Operating Characteristic (ROC) curve?", ["A plot of loss over training epochs", "A plot of True Positive Rate (Sensitivity) vs False Positive Rate ($1 - \\text{Specificity}$) across all classification thresholds", "A plot of feature correlations", "A 3D visualization of weights"], 1, "The ROC curve illustrates classifier diagnostic ability across every possible decision threshold from 0 to 1."),
            make_q("What is the Area Under the ROC Curve (ROC-AUC) of a completely random guesser?", ["0.0", "0.5", "1.0", "-1.0"], 1, "A random classifier has a diagonal ROC curve with an area under the curve of exactly 0.50."),
            make_q("What does an ROC-AUC score of 1.0 indicate?", ["The model is guessing randomly", "The model achieves perfect class separability with zero overlap across thresholds", "The model has 100% false positives", "The model overfitted in 1 epoch"], 1, "ROC-AUC = 1.0 indicates perfect separation: all positive instances are ranked higher than all negative instances."),
            make_q("Why is Precision-Recall AUC (PR-AUC) preferred over ROC-AUC on highly imbalanced datasets (e.g. 0.1% fraud)?", ["PR-AUC computes faster", "ROC-AUC can be deceptively optimistic because the massive volume of true negatives keeps False Positive Rate artificially small", "PR-AUC only works on neural networks", "ROC-AUC requires balanced classes to execute"], 1, "In extreme imbalance, large True Negatives suppress FPR in ROC; PR curves focus strictly on the minority positive class."),
            make_q("What is an Odds Ratio (OR)?", ["The ratio of training time to test time", "The ratio of the odds of an event occurring in one group compared to the odds in another group", "The score of a model on validation data", "The difference between mean and median"], 1, "Odds ratios quantify the association strength between an exposure feature and an outcome event."),
            make_q("If a patient's log-odds of recovery are $+2.0$, what is their estimated probability of recovery?", ["$50\\%$", "$\\frac{1}{1 + e^{-2}} \\approx \\frac{1}{1 + 0.135} \\approx 88.1\\%$", "$20\\%$", "$99.9\\%$"], 1, "$P = \\frac{1}{1 + e^{-z}} = \\frac{1}{1 + e^{-2}} \\approx 0.8808$ (88.1%)."),
            make_q("What is the primary assumption regarding the relationship between independent features and the target in Logistic Regression?", ["A linear relationship between features and the target probability directly", "A linear relationship between features and the log-odds (logit) of the target", "A quadratic relationship between features", "Zero correlation between features"], 1, "Logistic regression assumes linearity in the logit space: $\\ln(p / (1-p)) = \\mathbf{w}^T \\mathbf{x} + b$."),
            make_q("What algorithm is typically used to optimize logistic regression when second-order curvature information is utilized?", ["Newton-Raphson / Iteratively Reweighted Least Squares (IRLS)", "Apriori algorithm", "K-Means", "Random Forest"], 0, "Newton-Raphson (IRLS) uses second-order Hessian information to converge in few iterations on moderate datasets."),
            make_q("Why is Logistic Regression widely favored as a production baseline in regulated industries (finance, insurance)?", ["Because it is completely unexplainable", "Because it is highly interpretable, produces calibrated probabilities, and individual coefficients can be legally audited as risk weights", "Because it uses more GPU memory than transformers", "Because it can never have errors"], 1, "Regulators require explainability; logistic regression's explicit odds ratios allow clear justification for loan decisions.")
        ]
    })

    # 4. K-NEAREST NEIGHBORS (KNN)
    topics.append({
        "id": "knn",
        "title": "K-Nearest Neighbors (KNN)",
        "description": "Instance-based non-parametric learning, distance metrics (Euclidean, Manhattan, Minkowski, Cosine), choice of K, Voronoi tessellations, KD-trees, and curse of dimensionality.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "K-Nearest Neighbors (KNN)",
                    "subtitle": "Non-Parametric, Memory-Based (Lazy) Learning for Classification and Regression"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "Core Algorithm Mechanism",
                    "content": "KNN is a **non-parametric, instance-based (lazy)** learning algorithm. It makes zero explicit assumptions about the underlying distribution and performs **no training phase**.\n\nTo predict a new query point $\\mathbf{x}_q$:\n1. Compute the distance between $\\mathbf{x}_q$ and all $N$ points in the training dataset.\n2. Identify the $K$ closest training points (nearest neighbors).\n3. **Classification:** Return the **majority vote** (mode) among the $K$ labels.\n4. **Regression:** Return the **mean average** of the $K$ target values."
                },
                {
                    "type": "text",
                    "title": "Standard Distance Metrics",
                    "content": "- **Euclidean Distance ($L_2$):** Straight-line geometric distance:\n$$d(\\mathbf{u}, \\mathbf{v}) = \\sqrt{\\sum_{i=1}^d (u_i - v_i)^2}$$\n\n- **Manhattan Distance ($L_1$):** Taxicab grid distance (sum of absolute coordinate differences):\n$$d(\\mathbf{u}, \\mathbf{v}) = \\sum_{i=1}^d |u_i - v_i|$$\n\n- **Minkowski Distance ($L_p$):** Generalized distance ($p=1$ is Manhattan, $p=2$ is Euclidean):\n$$d(\\mathbf{u}, \\mathbf{v}) = \\left( \\sum_{i=1}^d |u_i - v_i|^p \\right)^{1/p}$$\n\n- **Cosine Distance:** $1 - \\text{CosineSimilarity}(\\mathbf{u}, \\mathbf{v})$, measuring directional difference independently of vector magnitude."
                },
                {
                    "type": "callout",
                    "style": "comparison",
                    "title": "The Impact of Hyperparameter K: Bias-Variance Tradeoff",
                    "content": "| Value of K | Model Complexity | Decision Boundary | Risk |\n|---|---|---|---|\n| **$K = 1$** | Maximum complexity | Extremely jagged, wraps around individual training noise points | **Severe Overfitting** (High Variance) |\n| **Optimal $K$ (e.g. 5-15)** | Balanced | Smooth, robust boundary capturing true class regions | **Optimal Generalization** |\n| **Large $K$ ($K \\rightarrow N$)** | Minimum complexity | Trivial; predicts only the majority class of the entire dataset | **Severe Underfitting** (High Bias) |"
                },
                {
                    "type": "text",
                    "title": "Computational Bottleneck & Spatial Indexing",
                    "content": "Because KNN computes distances to every training sample during inference:\n- **Brute Force:** $O(N \\cdot d)$ per test query. Slow for large datasets!\n- **KD-Tree:** Hierarchical space-partitioning binary tree, achieving $O(\\log N)$ search time in low dimensions ($d < 20$).\n- **Ball Tree:** Partitions points into nested hyperspheres, outperforming KD-trees in higher-dimensional spaces."
                },
                {
                    "type": "callout",
                    "style": "warning",
                    "title": "Mandatory Requirement: Feature Scaling",
                    "content": "KNN is **distance-based**. If feature $x_1$ (Income: $20,000 - $200,000) has a much larger numeric range than feature $x_2$ (Age: 18 - 80), distance calculations will be completely dominated by Income, rendering Age statistically invisible! **Always standardize features (StandardScaler) before KNN!**"
                },
                {
                    "type": "callout",
                    "style": "key-takeaway",
                    "title": "Key Takeaway",
                    "content": "KNN is intuitive and highly non-linear, but scales poorly to large inference workloads ($O(N)$ query time) and collapses in high dimensions ($d > 50$) due to the curse of dimensionality."
                }
            ]
        },
        "interactive": {
            "type": "classification-game",
            "title": "Voronoi Neighborhood Explorer",
            "description": "Observe how changing K from 1 to 15 transforms the decision boundary from noisy to smooth.",
            "items": [
                {"text": "K = 1 creates islands around single noise points", "category": "Overfitting (K=1)"},
                {"text": "K = 7 creates smooth class partitions", "category": "Balanced (K=7)"},
                {"text": "K = 100 predicts only the dominant majority class", "category": "Underfitting (Large K)"}
            ],
            "categories": ["Overfitting (K=1)", "Balanced (K=7)", "Underfitting (Large K)"]
        },
        "code": {
            "description": "Train KNN with Scikit-learn, evaluate performance across K values, and demonstrate the catastrophic impact of omitting feature scaling.",
            "starter": "import numpy as np\nfrom sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.preprocessing import StandardScaler\n\n# Load iris dataset\niris = load_iris()\nX, y = iris.data, iris.target\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)\n\n# Standardize features\nscaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)\n\nprint('=== Evaluating Accuracy Across Different K Values ===')\nfor k in [1, 3, 5, 11, 25]:\n    knn = KNeighborsClassifier(n_neighbors=k)\n    knn.fit(X_train_scaled, y_train)\n    acc = knn.score(X_test_scaled, y_test)\n    print(f'K = {k:2d}: Test Accuracy = {acc * 100:.2f}%')\n"
        },
        "quiz": [
            make_q("Why is K-Nearest Neighbors (KNN) described as a 'lazy learning' algorithm?", ["It uses very little CPU during inference", "It performs no explicit training phase; it simply stores the training dataset and defers all computation to inference time", "It was written in an outdated programming language", "It only trains on a subset of features"], 1, "Lazy learners construct no explicit parameterized model during training; all computation occurs during prediction."),
            make_q("What is the decision rule for KNN in a classification task?", ["Calculate the mean of all training points", "Assign the query point to the majority class among its K closest neighbors", "Draw a linear hyperplane", "Run gradient descent on weights"], 1, "Classification takes a majority vote among the labels of the K closest training points."),
            make_q("What is the decision rule for KNN in a regression task?", ["Assign the mode of the neighbors", "Calculate the average (mean or median) of the continuous target values of the K nearest neighbors", "Calculate the matrix inverse", "Predict zero"], 1, "KNN regression averages the continuous target values of the K nearest neighbors to predict $\\hat{y}$."),
            make_q("What happens when $K = 1$ in K-Nearest Neighbors?", ["The model has high bias and underfits", "The model achieves 100% accuracy on training data and has extreme variance, overfitting to every individual noise point", "The decision boundary becomes a straight line", "The model predicts the global mean"], 1, "With $K = 1$, each training point forms its own neighborhood; training error is 0%, but the model overfits training noise."),
            make_q("What happens when $K$ is set equal to the total number of training samples ($K = N$)?", ["The model overfits completely", "The model achieves maximum complexity", "The model underfits completely, predicting only the global majority class for all inputs regardless of feature values", "The computer runs out of memory"], 2, "When $K = N$, every prediction considers the entire dataset, trivially outputting the overall dataset mode (high bias)."),
            make_q("Why is feature scaling (e.g. StandardScaler) strictly mandatory before applying KNN?", ["Because scikit-learn will throw a syntax error without scaling", "Features with larger numerical ranges will dominate distance metrics, rendering features with smaller scales completely irrelevant", "Because scaling reduces the number of dimensions", "Because unscaled features cause negative distances"], 1, "Distance formulas treat all coordinates equally; unscaled features with large values dominate distances completely."),
            make_q("What is the Euclidean distance between points $\\mathbf{a} = (1, 2)$ and $\\mathbf{b} = (4, 6)$?", ["3", "4", "5", "7"], 2, "$d = \\sqrt{(4-1)^2 + (6-2)^2} = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$."),
            make_q("What is the Manhattan distance ($L_1$) between points $\\mathbf{a} = (1, 2)$ and $\\mathbf{b} = (4, 6)$?", ["5", "7", "1", "12"], 1, "$d = |4 - 1| + |6 - 2| = 3 + 4 = 7$."),
            make_q("Under what scenario is Manhattan distance ($L_1$) generally preferred over Euclidean distance ($L_2$)?", ["When features are plotted in 3D", "When data points represent grid-like movements (e.g. city streets) or in moderately higher-dimensional spaces where $L_1$ is less sensitive to extreme outliers", "When all numbers are negative", "When $K = 1$"], 1, "Manhattan distance measures grid path distances and suffers less severe inflation from single coordinate outliers."),
            make_q("What is the Minkowski distance formula?", ["$\\sum |u_i - v_i|$", "$\\left( \\sum |u_i - v_i|^p \\right)^{1/p}$", "$\\sqrt{\\sum u_i v_i}$", "$\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\| \\|\\mathbf{v}\\|}$"], 1, "Minkowski is the generalized $L_p$ metric: $p=1$ yields Manhattan, $p=2$ yields Euclidean."),
            make_q("Why is choosing an odd value for $K$ (e.g., $K = 3, 5, 7$) recommended in binary classification?", ["Odd numbers execute faster on multi-core processors", "It avoids ties in majority voting when there are two classes", "Even numbers cause memory overflow in Python", "Odd numbers guarantee zero validation error"], 1, "An odd $K$ prevents 50-50 voting deadlocks in binary classification."),
            make_q("What is the time complexity of predicting a single query point using brute-force KNN on $N$ samples with $D$ features?", ["$O(1)$", "$O(N \\cdot D)$", "$O(\\log N)$", "$O(D^2)$"], 1, "Brute-force requires computing distance to all $N$ samples across $D$ coordinates: $O(N \\cdot D)$."),
            make_q("How does a KD-Tree accelerate nearest neighbor search?", ["By compressing the dataset into a ZIP file", "By partitioning data space with a binary tree along alternating axis-aligned hyperplanes, reducing average search time to $O(\\log N)$", "By deleting half the training samples", "By running on GPU tensor cores"], 1, "KD-trees hierarchically partition space to rapidly eliminate distant subtrees during nearest neighbor queries."),
            make_q("Why does KD-Tree performance degrade to brute-force $O(N)$ when dimensionality $D$ is high (e.g., $D > 30$)?", ["KD-trees only work in 2D", "The curse of dimensionality forces the search algorithm to inspect almost all leaf nodes as points become equidistant", "Python recursion depth limits binary trees", "Memory allocation limits"], 1, "In high dimensions, hyperspheres overlap with almost all bounding boxes, rendering spatial pruning ineffective."),
            make_q("What spatial indexing structure generally outperforms KD-Trees in higher dimensions?", ["Ball Tree", "Bubble Sort", "Linear Array", "Linked List"], 0, "Ball trees partition space into nested hyperspheres, performing more effective bounding pruning in higher dimensions."),
            make_q("What is distance-weighted KNN (e.g. `weights='distance'` in scikit-learn)?", ["Multiplying the weights by a constant", "Giving closer neighbors greater voting weight proportional to the inverse of their distance ($w_i = 1 / d_i$)", "Deleting distant neighbors completely", "Weighting samples by their index in the CSV"], 1, "Distance weighting ensures immediate close neighbors exert more influence on the prediction than distant marginal neighbors."),
            make_q("What is the curse of dimensionality's effect on distance metrics in KNN?", ["Distances become negative", "As dimensions increase, the ratio of the distance to the nearest neighbor vs the farthest neighbor approaches 1 (points become equidistant)", "The Euclidean distance collapses to zero", "Distances become integers"], 1, "In high dimensions, all pairwise distances concentrate around the same value, destroying the meaningfulness of proximity."),
            make_q("What is a Voronoi diagram (Voronoi tessellation)?", ["A plot of loss versus epochs", "A partitioning of a plane into convex polygons such that each polygon contains all points closest to a specific seed training point", "A confusion matrix visualization", "A decision tree diagram"], 1, "Voronoi cells map the exact decision regions corresponding to a 1-NN classifier across continuous space."),
            make_q("How does increasing $K$ affect the smoothness of the decision boundary in KNN?", ["The boundary becomes more jagged and fragmented", "The boundary becomes smoother and more generalized", "The boundary disappears entirely", "The boundary becomes non-linear"], 1, "Larger $K$ aggregates over wider neighborhoods, smoothing out high-variance local irregularities."),
            make_q("Is KNN sensitive to noisy labels or mislabeled training points?", ["No, KNN is immune to noise", "Yes, especially with small $K$ (like $K=1$), where a single mislabeled outlier creates an incorrect decision island", "Only when using Manhattan distance", "Only when scaling is applied"], 1, "Small $K$ memorizes individual mislabeled samples; increasing $K$ provides voting redundancy against noise."),
            make_q("What is the space (memory) complexity of storing a trained KNN model?", ["$O(1)$ constant memory", "$O(N \\cdot D)$ because it must retain the entire training dataset in memory", "$O(K)$ memory", "$O(\\log N)$ memory"], 1, "Because KNN is non-parametric, the entire training dataset of $N$ points with $D$ features must reside in memory."),
            make_q("Can KNN handle categorical features directly without preprocessing?", ["Yes, KNN naturally handles strings", "No, distance metrics require numeric coordinates; categorical variables must be encoded (e.g. One-Hot or Gower distance)", "Only if categories are sorted alphabetically", "Only if $K > 10$"], 1, "Standard Euclidean distance cannot subtract strings; categories must be encoded or evaluated via custom distance metrics."),
            make_q("What is Gower's distance used for?", ["Measuring distances in outer space", "Calculating similarity across datasets containing mixed data types (continuous, nominal, ordinal, and binary)", "Measuring network latency", "Evaluating clustering algorithms"], 1, "Gower's distance combines appropriate distance measures for continuous, nominal, and binary features into a unified scale $[0, 1]$."),
            make_q("Why is KNN computationally expensive during real-time production inference compared to Logistic Regression?", ["Because Logistic Regression has no code", "KNN must evaluate distances against thousands/millions of training points per query, whereas Logistic Regression performs a single dot product", "Because KNN only runs on CPUs", "Because KNN produces random numbers"], 1, "Logistic regression inference is a single fast dot product ($O(D)$); KNN requires querying massive datasets ($O(N \\cdot D)$)."),
            make_q("How does Approximate Nearest Neighbors (ANN) solve the inference bottleneck for massive datasets?", ["By deleting 99% of data points", "By trading a tiny percentage of search accuracy for orders-of-magnitude faster query speeds using graphs (HNSW) or locality-sensitive hashing (LSH)", "By training neural networks on text", "By converting data to integers"], 1, "ANN algorithms (e.g. HNSW, FAISS) retrieve near-optimal neighbors in logarithmic time, enabling vector search at billion-scale."),
            make_q("What is Locality-Sensitive Hashing (LSH)?", ["An encryption algorithm for passwords", "A technique that hashes similar input items into the same hash buckets with high probability, accelerating neighbor search", "A method for sorting arrays", "A technique to prevent SQL injection"], 1, "LSH constructs hash collisions intentionally so similar high-dimensional vectors land in identical buckets for fast lookup."),
            make_q("What is the effect of irrelevant (noise) features on KNN performance?", ["Noise features are ignored automatically", "Noise features distort distance calculations, pulling true neighbors apart and degrading accuracy severely", "Noise features improve accuracy", "Noise features decrease memory usage"], 1, "Distance metrics sum across all dimensions; irrelevant features add random noise to distances, masking true similarity."),
            make_q("What technique is recommended to mitigate the impact of irrelevant features on KNN?", ["Feature selection (e.g. removing low-variance features) or dimensionality reduction (PCA)", "Increasing $K$ to 1,000", "Deleting random rows", "Using unscaled data"], 0, "Pruning uninformative features eliminates noisy distance dimensions, restoring metric fidelity."),
            make_q("In KNN regression, what happens if an input query point lies far outside the range of training data (extrapolation)?", ["It predicts infinite values", "It simply predicts the average of the nearest boundary points, failing to extrapolate upward or downward trends", "It crashes with an out-of-bounds error", "It fits a polynomial curve"], 1, "KNN cannot extrapolate outside the convex hull of training samples; it predicts boundary averages regardless of external trends."),
            make_q("What is Radius Neighbors Classifier (an alternative to KNN)?", ["A model that only works on circles", "A classifier that votes among all training points within a fixed radial distance $r$, rather than a fixed count $K$", "A model that rotates features", "A model used exclusively for satellite data"], 1, "Radius Neighbors uses fixed geometric distance $r$, adapting neighbor count dynamically based on local data density."),
            make_q("What is the primary hyperparameter in KNN that should be tuned using cross-validation?", ["The learning rate", "$K$ (number of nearest neighbors)", "The batch size", "The number of epochs"], 1, "Cross-validation scans $K$ values to identify the optimal tradeoff between overfitting ($K=1$) and underfitting ($K \\gg 1$)."),
            make_q("Can KNN produce class probability estimates?", ["No, KNN can only output hard labels", "Yes, by computing the proportion of neighbors belonging to each class among the $K$ nearest points: $P(y=c) = \\frac{K_c}{K}$", "Only when $K = 1$", "Only if all features are positive"], 1, "The fraction of neighbors belonging to class $c$ serves as an empirical estimate of posterior probability $P(y=c|\\mathbf{x})$."),
            make_q("What happens to KNN probability estimates when $K = 5$?", ["Probabilities are continuous", "Probabilities are discretized into steps of 0.20 (0.0, 0.2, 0.4, 0.6, 0.8, 1.0)", "Probabilities are always zero", "Probabilities exceed 1.0"], 1, "With $K=5$, votes can only be $0/5, 1/5, 2/5, 3/5, 4/5, 5/5$, producing coarse discrete probabilities."),
            make_q("How does Cosine Distance relate to Cosine Similarity?", ["$\\text{Cosine Distance} = \\text{Cosine Similarity} + 1$", "$\\text{Cosine Distance} = 1 - \\text{Cosine Similarity}$", "$\\text{Cosine Distance} = (\\text{Cosine Similarity})^2$", "They are unrelated"], 1, "Cosine distance is defined as $1 - \\cos(\\theta)$, converting directional alignment into a distance measure."),
            make_q("When is Cosine Distance preferred over Euclidean Distance in KNN?", ["When predicting housing prices", "In high-dimensional text classification or vector embeddings where document length (magnitude) should not bias semantic similarity", "When features have zero correlation", "When $K=1$"], 1, "Cosine distance measures angle rather than magnitude, ensuring long and short articles with identical word frequencies match closely.")
        ]
    })

    return topics

