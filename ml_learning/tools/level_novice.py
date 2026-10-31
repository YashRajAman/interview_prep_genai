"""
Novice Level Topics & Question Bank (7 Topics, 35 Questions Each)
Crafted specifically for absolute beginners: intuitive analogies, plain English, and zero academic jargon.
"""

def make_q(q, opts, ans, exp):
    return {
        "question": q,
        "options": opts,
        "correct": ans,
        "explanation": exp
    }

def get_novice_topics():
    topics = []

    # 1. WHAT IS MACHINE LEARNING?
    topics.append({
        "id": "what-is-ml",
        "title": "What is Machine Learning?",
        "description": "Understand what machine learning is in plain English, how it differs from traditional coding, and how computers learn from examples.",
        "duration": "20 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Welcome to Machine Learning!",
                    "subtitle": "Teaching Computers to Learn from Examples Instead of Hand-Written Rules"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "What is Machine Learning in Simple Terms?",
                    "content": "Imagine teaching a child to recognize what a **dog** looks like. You don't hand them a 500-page rulebook listing ear angles, fur textures, and nose measurements. Instead, you point to dogs in the park and say: *'Look, that is a dog!'*\n\nAfter seeing hundreds of dogs, the child's brain naturally discovers the common patterns.\n\n**Machine Learning works the same way:** Instead of writing thousands of strict `if/else` rules, we feed the computer lots of examples (data) and let it discover the underlying patterns on its own."
                },
                {
                    "type": "text",
                    "title": "Traditional Programming vs. Machine Learning",
                    "content": "To understand why machine learning is so revolutionary, compare it directly to traditional software:\n\n**1. Traditional Programming (Rules-First):**\nA human programmer writes explicit rules and logic by hand.\n\n$$\\text{Data} + \\text{Rules} \\longrightarrow \\text{Answers}$$\n\n*Example:* A calculator adding numbers, or payroll software calculating sales tax based on a fixed statutory law.\n\n**2. Machine Learning (Data-First):**\nThe computer is fed examples along with known answers, and discovers the underlying patterns on its own!\n\n$$\\text{Data} + \\text{Answers} \\longrightarrow \\text{Learned Rules (Model)}$$\n\n*Example:* Showing an algorithm 100,000 spam and non-spam emails so it learns to spot spam independently."
                },
                {
                    "type": "table",
                    "title": "Traditional Software vs. Machine Learning at a Glance",
                    "headers": ["Feature", "Traditional Programming", "Machine Learning"],
                    "rows": [
                        ["How it works", "Programmer writes every single rule manually.", "Algorithm learns patterns automatically from data."],
                        ["When rules change", "A programmer must rewrite the code by hand.", "Retrain the model on fresh, updated examples."],
                        ["Best suited for", "Exact math, payroll taxes, website logins, calculators.", "Face recognition, speech to text, recommendations, spam filtering."],
                        ["Can it make mistakes?", "No (unless there is a human coding bug).", "Yes! It makes educated guesses based on probabilities."]
                    ]
                },
                {
                    "type": "callout",
                    "style": "tip",
                    "title": "Core Vocabulary Every Beginner Should Know",
                    "content": "- **Dataset:** A collection of historical examples (like a spreadsheet of past house sales).\n- **Features (Inputs):** The clues or measurements (e.g. house size, number of bedrooms, location).\n- **Target / Label (Output):** The answer we want to predict (e.g. the selling price of the house).\n- **Training:** The learning process where the computer looks at past examples to find patterns.\n- **Model:** The resulting 'trained brain' that can make predictions on brand new examples.\n- **Prediction (Inference):** The model's educated guess on a new example it has never seen before."
                },
                {
                    "type": "text",
                    "title": "When Should You NOT Use Machine Learning?",
                    "content": "Machine learning is powerful, but it is not magic, and it is not always the best tool:\n1. **When a simple formula exists:** Calculating the area of a circle ($A = \\pi r^2$) or converting Celsius to Fahrenheit requires exact math, not a statistical guess!\n2. **When 100% perfection is strictly required:** Medical dosage calculators or flight-control actuators cannot rely on statistical approximations.\n3. **When you have no data:** A machine learning model cannot learn without good, reliable examples to study from."
                }
            ]
        },
        "interactive": {
            "type": "sorting-exercise",
            "title": "Rule-Based vs. Machine Learning Sorter",
            "description": "Sort the scenarios into whether they are best solved by Traditional Hand-Written Rules or Machine Learning.",
            "items": [
                {"text": "Calculating sales tax on a shopping receipt", "category": "Traditional"},
                {"text": "Recognizing faces in photo albums", "category": "Machine Learning"},
                {"text": "Sorting an array of numbers from smallest to largest", "category": "Traditional"},
                {"text": "Recommending videos on YouTube", "category": "Machine Learning"},
                {"text": "Converting inches to centimeters (cm = in * 2.54)", "category": "Traditional"},
                {"text": "Filtering spam emails from normal emails", "category": "Machine Learning"},
                {"text": "Translating spoken language in real-time", "category": "Machine Learning"},
                {"text": "Verifying if a password is at least 8 characters long", "category": "Traditional"}
            ],
            "categories": ["Traditional", "Machine Learning"]
        },
        "code": {
            "description": "Compare a simple hand-written rule with a machine learning model that learns from examples in Python.",
            "starter": "# 1. Traditional Hand-Written Rule\ndef rule_spam_filter(email_text):\n    # The programmer must guess every bad word by hand!\n    keywords = ['lottery', 'free cash', 'claim prize']\n    return any(word in email_text.lower() for word in keywords)\n\n# 2. Machine Learning Approach (Learns from examples!)\nfrom sklearn.feature_extraction.text import CountVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\n\n# Training examples with labels (1 = Spam, 0 = Normal)\ntraining_emails = [\n    'Congratulations you won a lottery prize',\n    'Can we reschedule our project meeting to 3pm?',\n    'Claim your free cash prize today',\n    'Please find attached the quarterly earnings report'\n]\nlabels = [1, 0, 1, 0]\n\n# Teach the model\nvectorizer = CountVectorizer()\nX_train = vectorizer.fit_transform(training_emails)\nmodel = MultinomialNB()\nmodel.fit(X_train, labels)\n\n# Test on a brand new email\nnew_email = ['Urgent: claim your unexpected lottery winnings']\nX_new = vectorizer.transform(new_email)\nml_prediction = model.predict(X_new)[0]\n\nprint(f'Test Email: \"{new_email[0]}\"')\nprint('Rule-based check:   ', 'SPAM' if rule_spam_filter(new_email[0]) else 'NORMAL')\nprint('ML Model prediction:', 'SPAM' if ml_prediction == 1 else 'NORMAL')"
        },
        "quiz": [
            make_q("What is the simplest way to describe Machine Learning?", ["Writing 10,000 if/else statements by hand", "Teaching computers to recognize patterns from examples instead of writing every rule manually", "Building physical robot hardware", "Installing a new operating system on a laptop"], 1, "Machine Learning enables computers to learn patterns directly from example data without needing every single rule hand-coded."),
            make_q("How does Machine Learning differ fundamentally from traditional programming?", ["Traditional programming runs on computers; machine learning runs on smartphones", "Traditional programming uses human-written rules; machine learning learns rules from data", "Machine learning does not require any data", "Traditional programming is only used for video games"], 1, "In traditional coding, developers write rules manually. In ML, algorithms look at data and answers to discover the rules automatically."),
            make_q("Which of the following is a classic example of Machine Learning in everyday life?", ["A pocket calculator multiplying 45 by 12", "Your email app automatically filtering out spam emails", "A digital clock showing the current time", "A light switch turning on a bulb"], 1, "Email spam filters learn from millions of past emails to spot spam patterns automatically."),
            make_q("What do we call the collection of past examples used to teach a machine learning model?", ["The training data", "The trash bin", "The compiler code", "The Wi-Fi network"], 0, "Training data is the set of historical examples fed into the algorithm so it can learn patterns."),
            make_q("When a trained model makes an educated guess on a new example it has never seen before, what is that called?", ["A prediction (or inference)", "A compiler error", "A data backup", "A software crash"], 0, "A prediction (or inference) is the output or guess a trained model produces when given new input data."),
            make_q("If you want a computer to recognize photos of cats using Machine Learning, what should you do?", ["Write down 50,000 manual rules describing whiskers and ears", "Show the computer thousands of labeled photos of cats and non-cats", "Draw a cat on a piece of paper and hold it up to the webcam", "Restart the computer three times"], 1, "Machine learning learns visual patterns by analyzing thousands of labeled image examples."),
            make_q("Why is it nearly impossible to write a traditional 'if/else' program to recognize cats in photos?", ["Because computers cannot open photos", "Because cats come in endless colors, angles, poses, lighting, and backgrounds that are impossible to list as simple rules", "Because programming languages do not support cats", "Because cats move too quickly"], 1, "Visual concepts have far too many real-world variations for human programmers to codify into manual if/else checks."),
            make_q("For which of the following tasks is Machine Learning UNNECESSARY?", ["Calculating the sales tax on a $50 purchase using a fixed 8% tax rate", "Recommending songs on Spotify based on your listening history", "Detecting fraudulent credit card transactions", "Translating spoken English into Spanish in real-time"], 0, "Calculating sales tax is a simple, exact mathematical formula (50 * 0.08 = 4). An exact rule is faster, 100% accurate, and needs no ML!"),
            make_q("What does the famous saying 'Garbage In, Garbage Out' mean in Machine Learning?", ["Computers must be thrown away after training a model", "If your training data is flawed, biased, or full of errors, your model will make bad predictions", "You should store your training data in the recycle bin", "Old models can be recycled into new models"], 1, "A machine learning model is only as good as the examples it learns from; poor data produces unreliable predictions."),
            make_q("In Machine Learning, what is a 'feature'?", ["A bug in the software", "A specific measurable clue or property of the data (such as house size, car mileage, or customer age)", "The price of the computer", "The name of the programmer"], 1, "Features are the individual measurable attributes or clues used by the model to make its predictions."),
            make_q("In Machine Learning, what is a 'label' (or target)?", ["The actual answer or outcome we want the model to learn to predict (e.g. 'Spam' vs 'Not Spam', or House Price)", "A sticky note attached to the computer screen", "The brand name of the laptop", "The version of Python being used"], 0, "The label (target) is the ground-truth answer you want the computer to learn how to predict."),
            make_q("Suppose you want to predict the price of a house. Which of the following is a 'feature'?", ["The final selling price of the house", "The square footage and number of bedrooms", "The date the buyer moves in", "The name of the mortgage bank"], 1, "Square footage and bedroom count are input clues (features) used to estimate the price."),
            make_q("In the same house price prediction example, what is the 'target' (label)?", ["The number of bathrooms", "The neighborhood name", "The final selling price of the house", "The color of the front door"], 2, "The final selling price is the outcome (target) we are trying to predict."),
            make_q("Can a machine learning model make mistakes?", ["No, computers are always 100% infallible", "Yes, machine learning models make educated statistical guesses, not absolute guarantees", "Only if the computer runs out of battery", "No, machine learning is magic"], 1, "Machine learning is based on probabilities and patterns; it can and will make mistakes, especially on unusual examples."),
            make_q("What is a 'model' in Machine Learning?", ["A fashion model posing for photographs", "The trained software program that has learned patterns from data and can now make predictions", "A plastic toy car", "A 3D printer blueprint"], 1, "A model is the resulting artifact or program after training that takes in new features and outputs a prediction."),
            make_q("What does 'training' a machine learning model mean?", ["Running the computer through physical exercises", "The process where an algorithm analyzes data examples to discover patterns and adjust itself", "Typing code into an editor", "Downloading files from the internet"], 1, "Training is the phase where the algorithm studies data examples and tunes itself to make accurate predictions."),
            make_q("Why do we set aside some data as a 'test set' that the model never sees during training?", ["To save disk space on the computer", "To fairly test whether the model can make accurate predictions on brand new, unseen examples", "Because computers can only read half a file at a time", "To hide the answers from the software engineer"], 1, "A test set acts like a final exam: it checks if the model actually learned general patterns or just memorized past examples."),
            make_q("If a student memorizes the practice questions word-for-word but fails the real exam with new questions, what is this called in ML?", ["Underfitting", "Overfitting", "Data cleaning", "Model serving"], 1, "Overfitting happens when a model memorizes the training data too closely (including noise) and fails to perform on new data."),
            make_q("What is 'generalization' in Machine Learning?", ["Speaking about machine learning in general terms", "The ability of a model to make accurate predictions on new data it has never encountered before", "Translating code into general English", "Converting images to black and white"], 1, "Generalization is the core goal of ML: performing accurately on new, unseen examples in the real world."),
            make_q("Which of the following is an example of a 'Classification' task?", ["Predicting the exact price of gasoline next week in dollars", "Deciding whether a bank transaction is 'Fraud' or 'Legitimate'", "Predicting the temperature in degrees Celsius tomorrow", "Estimating a person's height in inches"], 1, "Classification is sorting things into distinct categories or buckets (like Fraud vs Legitimate)."),
            make_q("Which of the following is an example of a 'Regression' task?", ["Predicting whether an email is spam or normal", "Predicting whether a patient has diabetes (Yes or No)", "Predicting the exact sale price of a used car in dollars", "Classifying a photo as either a cat, dog, or bird"], 2, "Regression is predicting a continuous numeric value (like dollars, height, temperature)."),
            make_q("How does Netflix recommend movies you might enjoy?", ["Employees manually watch every movie and guess what you like", "By analyzing patterns in the movies you and other users with similar tastes have watched", "By picking random titles from its database", "By always showing the newest movie regardless of your taste"], 1, "Recommendation systems use machine learning to discover patterns in viewing history across millions of users."),
            make_q("Why do spammers often write 'w!nner' or 'fr33' instead of 'winner' or 'free'?", ["Because spammers have broken keyboards", "To try to bypass simple rule-based filters that search for exact dictionary words", "Because symbols make emails load faster", "Because it is required by law"], 1, "Simple rule-based filters break when spammers substitute symbols for letters; machine learning catches these subtle variations."),
            make_q("What happens if you train an ML model to recognize animals, but only show it photos of dogs taken indoors on white carpets?", ["The model will become a super-intelligent expert on all animals", "The model may mistakenly learn that an animal must be on a white carpet to be a dog, failing on dogs outside", "The computer will crash immediately", "The model will automatically know what a horse looks like"], 1, "Models learn from whatever patterns are present in the data, including background quirks if the data is not diverse."),
            make_q("What is a 'dataset'?", ["A computer monitor setting", "A collection of related data, often organized in rows and columns like a spreadsheet", "A set of computer cables", "A programming language"], 1, "A dataset is the organized collection of data points (rows and columns) used to train and evaluate models."),
            make_q("In a data table used for machine learning, what does each individual 'row' typically represent?", ["A single observation or example (such as one customer, one house, or one transaction)", "A mathematical equation", "A software setting", "The date the computer was manufactured"], 0, "Each row corresponds to one single item or instance in the real world."),
            make_q("In a data table used for machine learning, what does each 'column' typically represent?", ["A different user account", "A specific property or feature (such as age, price, square footage, or color)", "A line of Python code", "A computer processor core"], 1, "Each column represents an attribute or measurement recorded for every example."),
            make_q("If you have an exact formula to solve a problem (like calculating the area of a rectangle: Length x Width), should you use Machine Learning?", ["Yes, machine learning is always better than math", "No, use the exact formula because it is 100% accurate, faster, and requires no training", "Yes, but only if you use a deep neural network", "Yes, to make the code look modern"], 1, "Never use ML when an exact, simple, 100% accurate mathematical formula is already available."),
            make_q("What is an 'algorithm' in simple terms?", ["A fancy type of computer screen", "A step-by-step set of instructions or rules for solving a problem or learning patterns", "A secret password for software", "A brand of computer chips"], 1, "An algorithm is simply a clear recipe or procedure for doing a specific computation."),
            make_q("What is an 'anomaly detection' system in machine learning?", ["A system that detects when the computer screen is turned off", "An ML model trained to spot unusual or abnormal events that stand out from normal patterns, like credit card fraud", "A tool for fixing typos in emails", "A video game character"], 1, "Anomaly detectors learn what 'normal' looks like so they can alert humans when something weird or suspicious occurs."),
            make_q("When your spam filter mistakenly sends an important email from your boss to the spam folder, what is that called?", ["A false positive", "A false negative", "A true positive", "A syntax error"], 0, "A false positive is a 'false alarm': the filter predicted positive (Spam) when the email was actually legitimate."),
            make_q("When a sneaky spam email slips past your filter and lands in your main inbox, what is that called?", ["A false positive", "A false negative", "A true negative", "A system upgrade"], 1, "A false negative is a 'miss': the model failed to detect the spam, falsely predicting negative (Normal)."),
            make_q("If an image classifier tests 100 photos and correctly identifies 92 of them, what is its accuracy?", ["8%", "92%", "100%", "50%"], 1, "Accuracy is the percentage of correct predictions: 92 correct out of 100 = 92%."),
            make_q("Why is Machine Learning called 'learning'?", ["Because the computer attends university courses", "Because the computer's performance improves as it sees more examples, without being explicitly reprogrammed", "Because the computer develops human consciousness", "Because it uses artificial paper and pens"], 1, "It is called learning because the model improves its ability to perform a task as it is exposed to more data over time."),
            make_q("What is the very first thing you should do before starting any machine learning project?", ["Buy the most expensive graphics card available", "Clearly define what problem you want to solve and what outcome you want to predict", "Write 1,000 lines of random Python code", "Post about it on social media"], 1, "Every successful ML project starts by understanding the goal, what you want to predict, and whether you have the data to do it.")
        ]
    })

    # 2. TYPES OF MACHINE LEARNING
    topics.append({
        "id": "types-of-ml",
        "title": "Types of Machine Learning",
        "description": "Learn the three main types of ML: Supervised, Unsupervised, and Reinforcement Learning with friendly everyday analogies.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "The Three Main Families of Machine Learning",
                    "subtitle": "Supervised Learning, Unsupervised Learning, and Reinforcement Learning"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "The Simple Analogy",
                    "content": "Think of the three types of machine learning like three ways a person can learn:\n\n1. **Supervised Learning (Learning with a Teacher):** A student does homework with an answer key. The teacher shows flashcards: *'This is a cat. This is a dog.'* The student learns by checking against the right answers.\n2. **Unsupervised Learning (Learning on Your Own):** You are given a box of mixed puzzle pieces with no picture on the box. You naturally sort them by color or shape without anyone telling you the categories.\n3. **Reinforcement Learning (Learning by Trial and Error):** You train a puppy with treats. When it sits, it gets a treat (+1 reward). When it chews the carpet, you say *'No!'* (-1 penalty). Over time, it learns good behavior."
                },
                {
                    "type": "table",
                    "title": "The 3 Main Types Compared",
                    "headers": ["Type", "Does it have answers (labels)?", "What is the goal?", "Real-World Everyday Example"],
                    "rows": [
                        ["Supervised Learning", "YES: Data has inputs X and correct answers y.", "Predict the correct answer for new examples.", "Predicting house prices, spam detection, medical diagnosis."],
                        ["Unsupervised Learning", "NO: Data only has inputs X with no answers.", "Find hidden patterns, groupings, or clusters.", "Grouping grocery store shoppers by shopping habits, detecting fraud."],
                        ["Reinforcement Learning", "NO: Learns through rewards & penalties from actions.", "Take actions in an environment to maximize total reward.", "Teaching AI to play Chess, self-driving car steering, robotics."]
                    ]
                },
                {
                    "type": "text",
                    "title": "Supervised Learning: Classification vs. Regression",
                    "content": "In Supervised Learning, the type of question determines the category:\n- **Classification (Picking a Category):** When the answer is a category or bucket. *Examples:* Is this email Spam or Normal? Is this tumor Benign or Malignant? Is this photo a Cat, Dog, or Bird?\n- **Regression (Predicting a Number):** When the answer is a continuous measurement or number. *Examples:* What will this house sell for in dollars? How tall will this child be? What will tomorrow's temperature be in degrees?"
                }
            ]
        },
        "interactive": {
            "type": "classification-game",
            "title": "Paradigm Sorter",
            "description": "Categorize each machine learning use-case into its correct fundamental paradigm.",
            "items": [
                {"text": "Predicting whether an email is spam based on 10,000 labeled past emails", "category": "Supervised"},
                {"text": "Grouping 50,000 grocery store shoppers into 4 shopper types without labels", "category": "Unsupervised"},
                {"text": "Teaching a robot dog to walk and jump via trial, error, and score rewards", "category": "Reinforcement"},
                {"text": "Predicting the dollar sale price of a home based on its size and location", "category": "Supervised"},
                {"text": "An AI teaching itself to beat humans at Chess by playing millions of practice rounds", "category": "Reinforcement"},
                {"text": "Sorting unlabelled customer photos into albums by facial similarity", "category": "Unsupervised"}
            ],
            "categories": ["Supervised", "Unsupervised", "Reinforcement"]
        },
        "code": {
            "description": "Compare Classification (predicting category) vs Regression (predicting number) in Python.",
            "starter": "# 1. Classification: Predict Category ('Cold' vs 'Hot')\nfrom sklearn.tree import DecisionTreeClassifier\nX_temps = [[10], [15], [28], [35]] # Celsius\ny_category = ['Cold', 'Cold', 'Hot', 'Hot']\n\nclassifier = DecisionTreeClassifier()\nclassifier.fit(X_temps, y_category)\nprint('Classification for 32°C:', classifier.predict([[32]])[0]) # Output: Hot\n\n# 2. Regression: Predict Exact Continuous Number (Ice Cream Sales in $)\nfrom sklearn.linear_model import LinearRegression\nX_temps = [[15], [20], [25], [30]]\ny_sales = [150, 220, 310, 420] # Sales in dollars\n\nregressor = LinearRegression()\nregressor.fit(X_temps, y_sales)\npredicted_sales = regressor.predict([[28]])[0]\nprint(f'Predicted sales at 28°C: ${predicted_sales:.2f}')"
        },
        "quiz": [
            make_q("What are the three main types of Machine Learning?", ["CPU, GPU, and RAM", "Supervised, Unsupervised, and Reinforcement Learning", "Python, Java, and C++", "Input, Output, and Storage"], 1, "The three primary branches of ML are Supervised, Unsupervised, and Reinforcement Learning."),
            make_q("What makes Supervised Learning 'supervised'?", ["A human manager must watch the computer train 24 hours a day", "The training data includes both inputs and the correct answers (labels), like a teacher grading an exam", "The computer requires a supervisor password to run", "The model only runs on supervised cloud servers"], 1, "Supervised learning is guided by known ground-truth labels that serve as an 'answer key' for the algorithm to learn from."),
            make_q("What is the primary goal of Supervised Learning?", ["To group unlabeled data without answers", "To learn the relationship between input features and target labels so it can predict answers for new data", "To win video games using rewards", "To format computer hard drives"], 1, "Supervised learning learns how to map inputs to correct outputs based on historical labeled examples."),
            make_q("What is the difference between Classification and Regression in supervised learning?", ["Classification predicts a category or label; Regression predicts a continuous number", "Classification is for numbers; Regression is for words", "Classification only works on images; Regression only works on audio", "There is no difference; they are exact synonyms"], 0, "Classification outputs discrete categories (e.g. Yes/No, Cat/Dog); regression outputs continuous numeric values (e.g. $350,000, 72.5 degrees)."),
            make_q("Which of the following is a Classification problem?", ["Predicting the price of a used laptop in dollars", "Deciding whether an email is 'Spam' or 'Not Spam'", "Predicting tomorrow's rainfall in millimeters", "Estimating someone's exact age in years"], 1, "Spam vs Not Spam is a choice between two discrete categories, which makes it a classification task."),
            make_q("Which of the following is a Regression problem?", ["Predicting tomorrow's temperature in degrees Fahrenheit", "Predicting whether a bank customer will cancel their account (Yes/No)", "Classifying an animal photo as a lion, tiger, or bear", "Sorting incoming support tickets into Billing vs Technical"], 0, "Temperature is a continuous numerical measurement, which defines a regression problem."),
            make_q("If a smartphone app identifies whether a photo shows an 'Apple', 'Banana', or 'Orange', what kind of problem is this?", ["Multiclass Classification", "Regression", "Reinforcement Learning", "Dimensionality Reduction"], 0, "Choosing one category from three or more options is called Multiclass Classification."),
            make_q("If a real estate app predicts that a house will sell for $425,000, what kind of problem is this?", ["Binary Classification", "Regression", "Clustering", "Reinforcement Learning"], 1, "Predicting a dollar amount is continuous numerical regression."),
            make_q("What makes Unsupervised Learning 'unsupervised'?", ["The algorithm runs without any electricity", "The training data has NO labels or correct answers; the algorithm must find patterns on its own", "The algorithm cannot run on Linux", "A human programmer must approve every single calculation"], 1, "Unsupervised learning operates on raw data without any answer keys or target labels."),
            make_q("What is 'Clustering' in unsupervised learning?", ["Grouping similar data points together based on their shared characteristics", "Deleting duplicate photos from a phone", "Connecting computers with network cables", "Adding numbers together in a spreadsheet"], 0, "Clustering automatically groups similar examples together (e.g. grouping customers with similar shopping habits)."),
            make_q("A department store wants to group its 50,000 customers into 4 shopper types based on spending habits, without any predefined categories. Which type of ML should it use?", ["Supervised Regression", "Unsupervised Clustering", "Reinforcement Learning", "Linear Classification"], 1, "Since there are no predefined labels or answers, unsupervised clustering is the right tool to discover natural customer segments."),
            make_q("How does Reinforcement Learning work in simple terms?", ["A model reads a textbook and memorizes definitions", "An agent takes actions in an environment and learns through rewards for good moves and penalties for bad moves", "A human writes 500 rules in Python", "A database sorts rows in alphabetical order"], 1, "Reinforcement learning is based on trial and error: taking actions, getting feedback (rewards/penalties), and learning the best strategy over time."),
            make_q("Which everyday analogy best describes Reinforcement Learning?", ["Studying with flashcards that have the answers on the back", "Training a puppy by giving it treats when it sits and saying 'No' when it jumps on guests", "Sorting your sock drawer by color", "Reading an encyclopedia from cover to cover"], 1, "Rewarding desired actions and discouraging bad ones is exactly how reinforcement learning algorithms learn."),
            make_q("An AI learning to master Chess or video games by playing millions of practice rounds against itself is an example of:", ["Unsupervised Clustering", "Reinforcement Learning", "Supervised Regression", "Traditional if/else scripting"], 1, "Game-playing AI uses reinforcement learning to discover winning strategies through trial, error, and score rewards."),
            make_q("In Reinforcement Learning, what do we call the decision-maker that takes actions?", ["The Agent", "The Environment", "The Reward", "The Feature"], 0, "The Agent is the AI entity that observes the state of the world and decides which action to take."),
            make_q("In Reinforcement Learning, what do we call the world or simulation the agent lives and acts in?", ["The Environment", "The Spreadsheet", "The Feature Store", "The Dataset"], 0, "The Environment is the external world (e.g. a chessboard, a video game screen, or a virtual driving track) that the agent interacts with."),
            make_q("In Reinforcement Learning, what do we call the numerical feedback signal the agent receives after making a move?", ["The Reward", "The Hyperparameter", "The Feature", "The Column"], 0, "The Reward is the score signal (positive for good actions, negative for mistakes) that guides the agent."),
            make_q("What is 'Semi-Supervised Learning'?", ["Learning that only works on half-sized computers", "Using a small amount of labeled data combined with a large amount of cheap unlabeled data", "A model that is only trained on weekends", "A model that is half-accurate"], 1, "Semi-supervised learning combines a few expensive hand-labeled examples with vast amounts of free unlabeled data."),
            make_q("Why is Semi-Supervised Learning helpful in real-world industries?", ["Because computers cannot read more than 100 files", "Because getting human experts (like doctors) to label data is slow and expensive, but raw unlabelled data is abundant", "Because it uses zero electricity", "Because it eliminates the need for math"], 1, "Medical scans or legal contracts are expensive to label manually, so models leverage abundant unlabelled records to boost accuracy."),
            make_q("What is 'Self-Supervised Learning' (the method used to train modern AI like ChatGPT)?", ["An AI that writes its own code from scratch", "The model creates its own training puzzles from raw text, like hiding the next word in a sentence and trying to guess it", "An AI that watches YouTube videos for fun", "A model trained without any data at all"], 1, "Self-supervised models create their own learning tasks (like predicting masked or future words) from raw uncurated text."),
            make_q("When large language models like GPT are pretrained on billions of internet articles, what simple task do they practice over and over?", ["Sorting numbers from smallest to largest", "Predicting the very next word in a sentence", "Translating words into Morse code", "Calculating tax returns"], 1, "By predicting the next word across trillions of sentences, language models learn grammar, reasoning, facts, and context."),
            make_q("If you want to predict whether a customer will cancel their subscription (Yes or No), what kind of problem is this?", ["Binary Classification", "Continuous Regression", "Unsupervised Clustering", "Reinforcement Learning"], 0, "When there are only two possible outcomes (Yes or No, 1 or 0), it is a Binary Classification problem."),
            make_q("If a bank wants to detect unusual credit card charges that look completely unlike a customer's normal spending habits, which approach is used?", ["Anomaly Detection (often unsupervised)", "Linear Regression", "Playing chess with RL", "Sorting strings alphabetically"], 0, "Anomaly detection flags rare transactions that deviate significantly from a customer's typical spending patterns."),
            make_q("If an algorithm organizes news articles into 'Sports', 'Politics', and 'Tech' because you gave it 5,000 articles already tagged with those names, what type of learning is this?", ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Zero-shot learning"], 0, "Because you provided the correct category tags (labels) for each article, it is Supervised Learning."),
            make_q("If an algorithm groups news articles into clusters on its own without any category names or human tags, what type of learning is this?", ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Linear Regression"], 1, "Finding natural groupings without pre-existing labels is Unsupervised Learning."),
            make_q("Which type of machine learning would you use to teach a robotic arm how to grasp objects without knocking them over?", ["Supervised Linear Regression", "Reinforcement Learning", "Unsupervised Clustering", "Binary Classification"], 1, "Robotics locomotion and manipulation tasks rely on reinforcement learning to master motor control via trial and error."),
            make_q("What does the word 'binary' mean in Binary Classification?", ["The computer uses 1s and 0s internally", "There are exactly two possible choices or categories (like Yes/No, True/False, Pass/Fail)", "The model takes two days to train", "The model requires two GPUs"], 1, "Binary classification specifically refers to problems with exactly two outcome classes."),
            make_q("What does 'Multiclass' mean in Multiclass Classification?", ["A class taught to multiple students", "There are three or more distinct categories, and each example belongs to exactly one of them", "The model is trained on multiple laptops", "The dataset has multiple spreadsheets"], 1, "Multiclass problems involve picking one label from three or more possible categories (e.g. Dog, Cat, Bird, Horse)."),
            make_q("In a used car spreadsheet with columns [Year, Mileage, Color, Price], if we want to predict 'Price', what is 'Price' called?", ["The Target (or Label)", "The Feature", "The Hyperparameter", "The Index"], 0, "The column you want to predict is always the target (label)."),
            make_q("In the same used car spreadsheet, what are [Year, Mileage, Color] called?", ["The Input Features", "The Labels", "The Predictions", "The Targets"], 0, "The descriptive clues used to make the prediction are called input features."),
            make_q("What happens if you try to use Supervised Learning on a dataset that has no labels or answers at all?", ["It will work normally", "It will fail, because supervised learning strictly requires correct answers to learn from", "It will automatically convert into reinforcement learning", "The computer will catch on fire"], 1, "Supervised algorithms cannot function without target labels; they require pairs of inputs and answers to learn the mapping."),
            make_q("What is 'Dimensionality Reduction' in simple, plain English?", ["Shrinking the physical size of a computer monitor", "Simplifying data by reducing the number of features while keeping the most important information", "Deleting all numbers from a spreadsheet", "Compressing a JPEG photo"], 1, "Dimensionality reduction simplifies complex data with hundreds of columns down to a few key summary features."),
            make_q("Why do modern self-driving cars use a combination of different ML types?", ["Because one type cannot do everything: supervised vision spots pedestrians, while reinforcement learning helps plan smooth steering actions", "Because car batteries require multiple algorithms", "Because it is required by traffic laws", "To make the car drive faster than the speed limit"], 0, "Complex real-world systems combine multiple specialized models: vision classifiers, path-planning RL agents, and sensor anomaly detectors."),
            make_q("Can an organization use multiple different types of Machine Learning at the same time?", ["No, a company is legally restricted to one ML type", "Yes, a company might use supervised learning for sales forecasts, unsupervised learning for customer groups, and reinforcement learning for warehouse robots", "Only if they use supercomputers", "No, algorithms will conflict with each other"], 1, "Companies routinely deploy different types of machine learning suited to different specific business problems."),
            make_q("What is the single most important question to ask when deciding between Supervised and Unsupervised learning?", ["'What color is the computer?'", "'Do I already have historical data with the correct answers (labels) attached?'", "'How fast is my internet connection?'", "'What programming language is the most popular?'"], 1, "If you have reliable historical labels, you use Supervised Learning. If you have only raw unlabeled data and want to discover patterns, you use Unsupervised Learning.")
        ]
    })

    # 3. END-TO-END ML LIFECYCLE
    topics.append({
        "id": "ml-lifecycle",
        "title": "The Machine Learning Lifecycle",
        "description": "Learn the 6 steps of a real-world ML project: from framing the problem and cleaning data to training, testing, and monitoring.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "The Step-by-Step Machine Learning Journey",
                    "subtitle": "How Real ML Projects Go from an Idea to a Working Production App"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "A Common Myth About Machine Learning",
                    "content": "Many beginners think machine learning is just writing one line of code: `model.fit()`. In reality, building a real machine learning application follows a complete **lifecycle**—and actual model training is only a small part of it!"
                },
                {
                    "type": "table",
                    "title": "The 6 Stages of the ML Lifecycle",
                    "headers": ["Step", "Stage Name", "What Happens Here?", "Practical Real-World Example"],
                    "rows": [
                        ["1", "Problem Framing", "Decide what problem you are solving and what to predict.", "'Can we predict which customers might cancel their gym membership next month?'"],
                        ["2", "Data Collection", "Gather past examples from databases, logs, or surveys.", "Pull 2 years of gym check-in records, payment histories, and customer ages."],
                        ["3", "Data Cleaning & Prep", "Fix missing values, remove duplicates, and create features.", "Handle missing phone numbers, fix typos, calculate 'average visits per week'."],
                        ["4", "Model Training", "Feed training data to algorithms to learn patterns.", "Train a Decision Tree or Logistic Regression model on 80% of the gym records."],
                        ["5", "Testing & Evaluation", "Check accuracy on held-out test data the model hasn't seen.", "Test on the remaining 20% of records. Does it achieve 90% accuracy?"],
                        ["6", "Deployment & Monitoring", "Launch the model in an app and track performance over time.", "Connect the model to the gym's dashboard; retrain if member habits change."]
                    ]
                },
                {
                    "type": "callout",
                    "style": "warning",
                    "title": "Why Real-World Models Degrade: 'Data Drift'",
                    "content": "A model trained in 2019 might fail completely in 2020 if customer habits abruptly shift (for example, during a pandemic or economic change). When the real world changes, past patterns become outdated. Engineers must **monitor** models continuously and retrain them with fresh data!"
                }
            ]
        },
        "interactive": {
            "type": "sorting-exercise",
            "title": "Lifecycle Stage Matcher",
            "description": "Sort tasks into their respective stages of the ML project lifecycle.",
            "items": [
                {"text": "Filling in missing values with the average age", "category": "Data Cleaning"},
                {"text": "Defining what business outcome we want to predict", "category": "Problem Framing"},
                {"text": "Connecting the model to a website API endpoint", "category": "Deployment"},
                {"text": "Measuring model accuracy on unseen test data", "category": "Evaluation"},
                {"text": "Downloading customer transaction logs from a database", "category": "Data Collection"},
                {"text": "Training a decision tree algorithm on the training dataset", "category": "Model Training"},
                {"text": "Setting up alerts to detect when model accuracy drops over time", "category": "Deployment"},
                {"text": "Calculating customer age from their birthdate", "category": "Data Cleaning"}
            ],
            "categories": ["Problem Framing", "Data Collection", "Data Cleaning", "Model Training", "Evaluation", "Deployment"]
        },
        "code": {
            "description": "Run the complete mini ML lifecycle in 15 lines of Python code.",
            "starter": "from sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score\n\n# 1 & 2. Problem & Data (Classify Iris flowers based on 4 measurements)\ndata = load_iris()\nX, y = data.data, data.target\n\n# 3. Split into Training (80%) and Testing (20%) sets\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n\n# 4. Train the model\nmodel = RandomForestClassifier(n_estimators=10, random_state=42)\nmodel.fit(X_train, y_train)\n\n# 5. Evaluate accuracy on the test set\npredictions = model.predict(X_test)\naccuracy = accuracy_score(y_test, predictions)\nprint(f'Model Test Accuracy: {accuracy * 100:.1f}%')\n\n# 6. Deploy / Predict on a brand new flower!\nnew_flower = [[5.1, 3.5, 1.4, 0.2]]\npredicted_species = model.predict(new_flower)[0]\nprint(f'New flower predicted as: {data.target_names[predicted_species]}')"
        },
        "quiz": [
            make_q("What is the Machine Learning Lifecycle?", ["The battery lifespan of a computer running machine learning", "The end-to-end process of planning, collecting data, building, testing, deploying, and maintaining an ML system", "The life expectancy of an AI researcher", "The time it takes to download a Python package"], 1, "The ML lifecycle encompasses the complete journey from business problem definition to ongoing production maintenance."),
            make_q("What is the very first step in any machine learning project?", ["Buying the most powerful computer possible", "Clearly defining the problem you want to solve and what outcome you want to predict", "Training a complex neural network", "Writing a 100-page user manual"], 1, "Every project must begin with understanding the business objective, defining success metrics, and verifying feasibility."),
            make_q("Why is defining a clear goal more important than choosing an algorithm first?", ["Because picking the wrong algorithm is illegal", "Because building a technically impressive model that solves the wrong problem provides zero real-world value", "Because algorithms choose themselves automatically", "Because Python only allows one algorithm per computer"], 1, "A model that achieves 99% accuracy on the wrong objective is completely useless to an organization."),
            make_q("What happens during the 'Data Collection' stage of an ML project?", ["Deleting old files to save hard drive space", "Gathering relevant historical examples from databases, sensors, files, or customer logs", "Writing computer code to play games", "Selling data to third parties"], 1, "Data collection gathers the raw historical records and signals required to teach the model."),
            make_q("Why do data scientists spend up to 80% of their time on data preparation and cleaning?", ["Because real-world data is messy, incomplete, and full of errors, and models cannot learn properly from bad data", "Because data scientists do not like writing machine learning code", "Because computer screens take a long time to load spreadsheets", "Because cleaning data makes computer fans quieter"], 0, "Real-world data is notoriously messy; algorithms strictly depend on clean, well-formatted input data."),
            make_q("Which of the following is an example of 'Data Cleaning'?", ["Removing duplicate customer rows, fixing misspelled city names, and handling blank cells in a spreadsheet", "Wiping dust off the physical computer monitor", "Deleting the Python programming language", "Turning off the Wi-Fi router"], 0, "Data cleaning corrects human errors, typos, duplicates, and missing values in the raw dataset."),
            make_q("What is 'Feature Engineering' in simple terms?", ["Designing physical computer chips", "Creating new, helpful clues or measurements from existing raw data to help the model learn better", "Upgrading the RAM inside a laptop", "Writing comments inside code"], 1, "Feature engineering transforms raw measurements into more informative signals (e.g. converting a birthdate into 'age in years')."),
            make_q("Suppose your dataset has a 'Date of Birth' column. What new feature could you engineer from it that is much more useful for predicting insurance risk?", ["The person's current age in years", "The day of the week they were born", "The color of their birth certificate", "The name of the hospital"], 0, "Calculating current age from birthdate provides a clear, direct numeric signal that correlates with insurance risk."),
            make_q("Why do we split data into a 'Training set' and a 'Test set'?", ["Because computers crash if they read an entire file at once", "To teach the model on training data, and then fairly evaluate its true performance on test data it has never seen", "To duplicate the data so it doesn't get lost", "Because half the data is always corrupted"], 1, "The split ensures we can objectively test whether the model learned general patterns or merely memorized the training examples."),
            make_q("What is 'Data Leakage' in machine learning?", ["A hacker stealing your files from the cloud", "When information from the future or from the test set accidentally contaminates the training data, producing unrealistically high test scores", "A physical leak of cooling liquid inside a server", "When data files take up too much disk space"], 1, "Data leakage happens when a model is accidentally trained on clues that would not be available in real life at prediction time."),
            make_q("If an ML model scores 99.8% accuracy during testing in the lab, but drops to 45% when real customers use it, what likely happened?", ["The computer got too warm", "The model overfit to the training data or suffered from hidden data leakage", "The internet speed slowed down", "The customers used the wrong keyboard"], 1, "A massive gap between laboratory evaluation and production reality is the classic symptom of overfitting or data leakage."),
            make_q("What does 'Training a model' actually involve?", ["Teaching a robot how to walk in a gym", "Running an algorithm that reads through training examples to discover patterns and adjust internal settings", "Writing text documentation in Microsoft Word", "Restarting the operating system"], 1, "Training is the mathematical process of tuning a model's internal weights to minimize prediction mistakes on training data."),
            make_q("What is a 'Baseline Model' in a machine learning project?", ["A simple, basic benchmark (such as always guessing the average or the most common class) used to check if an ML model actually adds value", "The most expensive neural network available", "A model that runs with zero CPU usage", "A model developed in the year 1990"], 0, "A baseline sets the minimum acceptable bar; if a fancy ML model cannot beat a simple average guess, it isn't worth building!"),
            make_q("If a complex deep neural network achieves 81% accuracy, but a simple 2-line if/else rule achieves 80% accuracy, what should a smart engineer consider?", ["Using the simple rule, because it is cheaper, faster, easier to maintain, and rarely breaks", "Immediately using the neural network because it sounds more impressive", "Deleting both models and quitting", "Buying 10 more GPUs"], 0, "In production engineering, simple, interpretable, low-maintenance solutions are preferred when performance is virtually identical."),
            make_q("What happens during the 'Model Evaluation' phase?", ["Testing how well the model predicts on fresh test data using metrics like accuracy, error rate, or precision", "Formatting the computer hard drive", "Giving the model a star rating on an app store", "Paying a subscription fee to a cloud provider"], 0, "Evaluation rigorously measures how well the model performs on unseen test data before deciding to release it."),
            make_q("What is 'Hyperparameter Tuning'?", ["Tuning a musical instrument with software", "Adjusting the algorithm's high-level settings (like how fast it learns or how deep a decision tree can grow) to find the best performance", "Cleaning dust out of the computer fans", "Changing the screen brightness"], 1, "Hyperparameters are the external control knobs adjusted by the engineer to optimize how the algorithm learns."),
            make_q("What does 'Deploying a model' mean?", ["Putting the trained model into a real production environment so websites, mobile apps, or internal systems can use it to make live predictions", "Shipping a physical computer to a customer in a box", "Deleting the model after training is finished", "Writing a blog post about machine learning"], 0, "Deployment is integrating the trained model into production software so it can serve real users in real time."),
            make_q("What is an 'API' in machine learning deployment?", ["An Artificial Program Intelligence", "A web interface that allows other apps to send inputs to the model and receive predictions back over the internet", "A type of computer battery", "A file format for storing pictures"], 1, "An API (Application Programming Interface) enables websites or mobile apps to query a model server seamlessly."),
            make_q("Does an engineer's job end once a machine learning model is deployed to production?", ["Yes, machine learning models run forever without any human attention", "No, you must continuously monitor the model to ensure it stays accurate as real-world conditions change", "Yes, models never make mistakes after deployment", "Yes, computers maintain themselves automatically"], 1, "Models require ongoing monitoring, maintenance, and periodic retraining to remain accurate over time."),
            make_q("What is 'Model Drift' (or Data Drift)?", ["When a laptop physically slides across a desk", "When real-world conditions and user behaviors change over time, causing an older model's predictions to become inaccurate", "When code files get accidentally deleted", "When the model's file size grows larger on disk"], 1, "Model drift happens when the real-world patterns a model learned in the past no longer match how the world behaves today."),
            make_q("Which of the following is a real-world example of Model Drift?", ["A retail demand model failing during a sudden global pandemic because people abruptly stopped buying office clothes and started buying home fitness gear", "A computer running out of battery", "A smartphone screen cracking", "A printer running out of ink"], 0, "Abrupt shifts in consumer habits make historical pre-pandemic training data outdated, leading to model drift."),
            make_q("How do engineers fix a model that has suffered from Model Drift?", ["Restart the computer five times", "Collect recent real-world data, retrain the model on the fresh data, and redeploy it", "Change the font of the code editor", "Make the model simpler by deleting features"], 1, "Retraining the model on fresh, recent data updates its patterns to reflect current real-world realities."),
            make_q("What is 'Batch Prediction' (Offline Scoring)?", ["Making predictions on a large list of records all at once on a scheduled timer (like generating movie recommendations for all users every night at 2 AM)", "Typing code in batches of 10 words", "Training two models on the same laptop", "Sending emails to 10 friends"], 0, "Batch prediction processes large volumes of data on a schedule where immediate sub-second response is not needed."),
            make_q("What is 'Real-time Prediction' (Online Scoring)?", ["Making an instant prediction for an individual user in a few milliseconds (like checking for fraud while a credit card is being swiped)", "Predicting what the weather was 100 years ago", "Running a model only during daytime hours", "Downloading a movie from the internet"], 0, "Real-time inference responds immediately to live user requests within milliseconds."),
            make_q("When Google Maps predicts live traffic delays while you are actively driving, is it Real-time or Batch prediction?", ["Real-time prediction", "Batch prediction", "Unsupervised clustering", "Hardware testing"], 0, "Live navigation requires immediate real-time predictions based on current GPS and traffic sensor streams."),
            make_q("When a bank runs a script once every Sunday night to calculate credit risk scores for all account holders, is it Real-time or Batch?", ["Real-time prediction", "Batch prediction", "Reinforcement learning", "Video streaming"], 1, "Running predictions in bulk on a scheduled weekly timer is Batch prediction."),
            make_q("What is a 'Confusion Matrix' in plain terms?", ["A confusing error message displayed by Python", "A simple table that compares what the model predicted against what actually happened, showing correct guesses and mistakes", "A matrix of random numbers used for encryption", "A hardware component on a motherboard"], 1, "A confusion matrix lays out True Positives, False Positives, True Negatives, and False Negatives in a clear summary table."),
            make_q("What is an 'Outlier' in a dataset?", ["A person who works outdoors", "A data point that is drastically different from all the other examples, such as someone reporting an age of 250 years", "The first column in a spreadsheet", "A computer disconnected from the internet"], 1, "Outliers are extreme or unusual values that lie far outside the normal range of the rest of the data."),
            make_q("Why should you inspect your data for outliers before training an ML model?", ["Because outliers can distort the model and pull its learned rules in the wrong direction", "Because computers cannot process numbers greater than 100", "To make sure the file fits on a USB drive", "Because outliers cause the computer screen to flicker"], 0, "Severe outliers (like typos or measurement glitches) can skew model training and damage overall accuracy."),
            make_q("What is 'Underfitting'?", ["Wearing clothes that are too small", "When a model is too simple to capture the underlying pattern in the data, performing poorly on both training and test data", "When a model achieves 100% test accuracy", "When a dataset has too many rows"], 1, "Underfitting happens when a model lacks the capacity or clues to learn the pattern, like trying to fit a straight line to a wave."),
            make_q("What is 'Overfitting'?", ["Wearing too many coats in winter", "When a model memorizes the training data too closely (including its random noise), but fails on new unseen data", "When a model runs out of computer memory", "When a dataset has no missing values"], 1, "Overfitting is the 'memorization trap': the model gets an A+ on practice questions but fails the real test."),
            make_q("What is the easiest way to tell if your model is overfitting?", ["The model takes less than 1 second to train", "The model achieves near-perfect accuracy on the training data, but scores poorly on the held-out test data", "The model prints text in green font", "The computer fan turns on"], 1, "A large gap where training score is high but test score is poor is the telltale sign of overfitting."),
            make_q("What is 'A/B Testing' when deploying a new model?", ["Testing if the letter A comes before B", "Directing 50% of real users to Model A (the current version) and 50% to Model B (the new version) to measure which one performs better", "Running tests on two different laptops", "Testing code on Apple and BlackBerry phones"], 1, "A/B testing provides safe, real-world proof of whether a new model improves business metrics before replacing the old one."),
            make_q("Why is version control (like Git) important for machine learning code and datasets?", ["So you can undo mistakes, collaborate with teammates, and know exactly which code and data produced a specific model", "To prevent your computer from turning off", "Because cloud companies require it by law", "To make code run twice as fast"], 0, "Version control ensures reproducibility, tracking changes over time and enabling easy rollbacks if problems occur."),
            make_q("Which of the following shows the correct order of the main stages in the Machine Learning Lifecycle?", ["Deploy Model -> Collect Data -> Frame Problem -> Train Model", "Frame Problem -> Collect & Clean Data -> Train Model -> Evaluate -> Deploy & Monitor", "Train Model -> Frame Problem -> Deploy -> Collect Data", "Evaluate -> Deploy -> Collect Data -> Train Model"], 1, "The lifecycle logically progresses from defining the problem to data prep, training, evaluation, and finally deployment with monitoring.")
        ]
    })

    return topics
