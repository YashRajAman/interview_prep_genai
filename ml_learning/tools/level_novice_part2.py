"""
Novice Level Part 2: Understanding Data, Math Foundations, Probability Basics, EDA Basics
Crafted specifically for absolute beginners: intuitive analogies, plain English, and zero academic jargon.
"""
from level_novice import make_q

def get_novice_part2_topics():
    topics = []

    # 4. UNDERSTANDING DATA
    topics.append({
        "id": "understanding-data",
        "title": "Understanding Data: Rows, Columns & Types",
        "description": "Learn how data is organized into spreadsheets, the difference between numbers and categories, and how to spot missing values and outliers.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Understanding Data for Machine Learning",
                    "subtitle": "How Real-World Information is Represented in Spreadsheets and Numbers"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "Data is the Food that Feeds Machine Learning",
                    "content": "Machine learning models cannot look out the window or read minds—they only learn from the data we give them! Usually, this data looks like a familiar **spreadsheet** (or CSV file):\n\n- **Rows (Examples):** Each row represents one single person, house, patient, or item.\n- **Columns (Features):** Each column represents a specific measurement or clue (like Age, Income, or City)."
                },
                {
                    "type": "table",
                    "title": "The Two Main Types of Data",
                    "headers": ["Data Type", "What is it?", "Everyday Examples", "How Computers Treat It"],
                    "rows": [
                        ["Numerical (Numbers)", "Measurements you can add, subtract, and count.", "House size (sq ft), Age in years, Temperature, Bank balance ($).", "Computers understand numbers directly."],
                        ["Categorical (Categories)", "Labels, names, or groups that describe words or types.", "City (New York, Paris, Tokyo), Color (Red, Blue), Yes/No, Pet (Dog, Cat).", "Must be converted to numbers (like 0, 1, 2) before feeding to math models."]
                    ]
                },
                {
                    "type": "callout",
                    "style": "tip",
                    "title": "Missing Values & Outliers in Real Life",
                    "content": "- **Missing Values:** What happens when someone leaves a question blank on a survey? You get an empty box (`NaN` or null). We must either drop that row or fill in the blank with a sensible value (like the average).\n- **Outliers:** A data point that is bizarrely different from the rest. For example, if a customer's age is entered as `250`, it's almost certainly a typing mistake for `25`!"
                }
            ]
        },
        "interactive": {
            "type": "sorting-exercise",
            "title": "Data Type Sorter",
            "description": "Sort each measurement into whether it is Numerical (a number) or Categorical (a category/word).",
            "items": [
                {"text": "House price in dollars ($350,000)", "category": "Numerical"},
                {"text": "Car color (Red, Blue, Silver)", "category": "Categorical"},
                {"text": "Customer age in years (34)", "category": "Numerical"},
                {"text": "Credit card approved (Yes / No)", "category": "Categorical"},
                {"text": "Distance to work in miles (12.5)", "category": "Numerical"},
                {"text": "Customer review rating (Positive, Neutral, Negative)", "category": "Categorical"}
            ],
            "categories": ["Numerical", "Categorical"]
        },
        "code": {
            "description": "Explore rows, columns, missing values, and summary numbers with Pandas in Python.",
            "starter": "import pandas as pd\nimport numpy as np\n\n# Create a customer dataset with 5 rows and 5 columns\ndata = {\n    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],\n    'Age': [28, 35, np.nan, 42, 29], # Charlie's age is blank!\n    'City': ['Chicago', 'Dallas', 'Chicago', 'Miami', 'Chicago'],\n    'Balance': [1500, 3200, 4800, 95000, 2100], # Diana has high balance\n    'Subscribed': [1, 0, 1, 1, 0]\n}\n\ndf = pd.DataFrame(data)\nprint('=== Full Customer Dataset ===')\nprint(df)\n\nprint('\\n=== Checking for Missing Empty Boxes ===')\nprint(df.isnull().sum())\n\nprint('\\n=== Filling Missing Age with the Group Average ===')\navg_age = df['Age'].mean()\ndf['Age'] = df['Age'].fillna(avg_age)\nprint(df[['Name', 'Age']])"
        },
        "quiz": [
            make_q("In machine learning, how is tabular data most commonly organized?", ["In folders on a flash drive", "In rows (individual examples) and columns (features/attributes)", "In a single long paragraph of text", "In a spiral notebook"], 1, "Tabular data is structured like a spreadsheet: each row is one example, and each column is a feature or attribute."),
            make_q("In a customer spreadsheet, what does each individual 'row' represent?", ["A single customer", "The customer's address", "The total sales of the company", "A column header"], 0, "Each row represents a single entity, instance, or observation (like one customer or one house)."),
            make_q("In the same spreadsheet, what does each 'column' represent?", ["A specific property or measurement, like Age, State, or Annual Income", "A single user's password", "The date the computer was purchased", "The name of the database software"], 0, "Columns represent the attributes, clues, or features recorded across all examples."),
            make_q("Which of the following is a 'Numerical' feature?", ["Eye color (Brown, Blue, Hazel)", "House selling price in dollars ($350,000)", "Country of birth (Canada, Mexico, Brazil)", "Payment method (Cash, Credit Card, PayPal)"], 1, "House price is a numerical measurement that can be measured, added, and compared mathematically."),
            make_q("Which of the following is a 'Categorical' feature?", ["Annual income ($75,000)", "A person's height in inches (68 inches)", "Car paint color (Red, Silver, Black, Blue)", "Number of children in a household (2)"], 2, "Car color is a discrete descriptive word/category, not a continuous numerical measurement."),
            make_q("Why must categorical words (like 'Red', 'Blue', 'Green') be converted into numbers for machine learning models?", ["Because computers can only spell in English", "Because machine learning algorithms are mathematical formulas that perform calculations with numbers", "Because text files take up too much memory", "Because words are illegal in software"], 1, "At their core, ML algorithms perform math (addition, multiplication) on numbers, so categories must be represented numerically."),
            make_q("What is a 'Binary' categorical feature?", ["A feature with numbers from 1 to 100", "A feature that has only two possible options (such as Yes/No, True/False, or Male/Female)", "A feature that uses letters instead of numbers", "A feature that changes every hour"], 1, "Binary features have exactly two states or categories (e.g. Yes/No, 1/0)."),
            make_q("What does a 'Missing Value' in a dataset mean?", ["A file that was completely deleted from the computer", "A specific cell or box in the spreadsheet that is blank or has no recorded information", "A negative number", "A very large number"], 1, "Missing values represent blank entries where data was not collected, lost, or not reported."),
            make_q("If a patient's medical survey has a blank box for 'Height', what is one common way to handle this missing value?", ["Guessing a negative number", "Filling in the blank with the average height of other patients, or dropping the row", "Shutting down the hospital computer", "Deleting all patients from the database"], 1, "Common strategies include imputing (filling) with the average/median value or removing rows with missing data."),
            make_q("What is an 'Outlier' in a dataset?", ["A person who works outdoors in nature", "A data value that is wildly different or extreme compared to the rest of the examples (such as a customer age of 250)", "The first column in a spreadsheet", "A row that contains text"], 1, "Outliers are extreme anomalies that lie far away from the rest of the distribution, often caused by measurement or typing errors."),
            make_q("Suppose you are looking at employee salaries and see: [$50,000, $55,000, $48,000, $52,000, $15,000,000]. What is $15,000,000?", ["The average salary of normal workers", "An extreme outlier (likely the CEO or a data typo)", "A missing value", "A categorical feature"], 1, "$15,000,000 is an extreme outlier that is hundreds of times larger than the other employee salaries."),
            make_q("How can extreme outliers affect a machine learning model if left unaddressed?", ["They make the computer run faster", "They can pull the model's predictions heavily in their direction, skewing predictions for normal cases", "They make the file size zero", "They turn numbers into text"], 1, "Extreme outliers can distort model training, making the model less accurate for typical, normal instances."),
            make_q("What is 'Structured Data'?", ["Data organized neatly in tables with defined rows and columns (like an Excel spreadsheet or SQL database)", "A collection of random spoken voice notes", "A folder of unorganized vacation videos", "A book of handwritten poetry"], 0, "Structured data is tabular data arranged neatly into rows and columns with fixed schemas."),
            make_q("Which of the following is an example of 'Unstructured Data'?", ["A CSV spreadsheet of customer addresses and phone numbers", "A collection of raw photographs, audio clips, and free-form customer text reviews", "A database table of credit card transactions", "An accounting ledger of debits and credits"], 1, "Unstructured data includes images, video, audio, and free-text that does not fit neatly into traditional table columns."),
            make_q("What is a 'Target' variable (also called the Label or y)?", ["The bullseye on an archery board", "The specific outcome or answer that the model is trying to learn to predict", "The column with the largest numbers", "The name of the file on disk"], 1, "The target variable is the ground-truth outcome you want your model to predict."),
            make_q("If you are predicting whether a student passes an exam, what is the Target variable?", ["The number of hours the student studied", "Whether the student Passed or Failed (Yes/No)", "The temperature of the classroom", "The student's attendance record"], 1, "Pass or Fail is the outcome (Target) you are trying to predict; hours studied is an input feature."),
            make_q("What is a 'Feature' (also denoted as X)?", ["A cool new tool in an app", "An input measurement, property, or clue used by the model to make its prediction", "The final score of the model", "The date the project started"], 1, "Features are the input variables fed into the model to help it predict the target outcome."),
            make_q("In predicting car fuel efficiency (Miles Per Gallon), which of the following is an input Feature?", ["The car's weight, engine size, and horsepower", "The future price of gasoline next year", "The name of the driver's dog", "The speed of the wind outside the house"], 0, "Weight, engine size, and horsepower are physical attributes (features) directly related to fuel efficiency."),
            make_q("What is 'Data Cleaning'?", ["Wiping your keyboard with a damp cloth", "The process of fixing errors, filling missing values, removing duplicates, and correcting typos in a dataset", "Deleting your entire hard drive", "Converting all numbers to zero"], 1, "Data cleaning ensures that mistakes, empty cells, and corrupt records are resolved before training."),
            make_q("What does 'Duplicate Data' mean?", ["A backup copy of your file saved on a USB drive", "Having identical rows repeated multiple times in your dataset, which can bias the model", "A dataset with two columns", "A dataset with two rows"], 1, "Duplicate rows represent repeated records that can unfairly over-weight certain examples during learning."),
            make_q("What is 'Data Leakage' in simple terms?", ["Water dripping onto a computer server", "When secret clues or future answers accidentally sneak into the training data, giving the model an unfair cheat sheet", "When your Wi-Fi password is stolen", "When a spreadsheet has too many columns"], 1, "Data leakage occurs when clues about the target that wouldn't exist in real life are accidentally included during training."),
            make_q("Imagine you want to predict if a hospital patient has pneumonia. If the training data includes a column called 'Doctor_Gave_Pneumonia_Medicine', why is this dangerous?", ["Because the computer will run out of memory", "Because it is data leakage: the medicine already reveals the doctor's diagnosis, so the model learns a cheat rather than true symptoms", "Because doctors do not use computers", "Because pneumonia cannot be cured"], 1, "This is data leakage: the prescription already gives away the answer, so the model won't learn how to diagnose from actual symptoms."),
            make_q("Why is having a diverse and representative dataset important?", ["So the computer doesn't get bored looking at the same data", "So the model learns patterns that work fairly and accurately for all types of real-world situations and people", "Because diverse files load faster in Python", "Because diverse data takes up less storage space"], 1, "If a dataset only includes one demographic or scenario, the model will fail on different real-world cases."),
            make_q("What happens if you train an autonomous car model only on sunny daytime highway data?", ["The car will automatically know how to drive in a midnight blizzard", "The car may struggle or fail when encountering nighttime, heavy rain, or busy city intersections", "The car's tires will wear out faster", "The car will refuse to turn on"], 1, "Models only know what they have seen; training only on sunny highways leaves the model blind to rain, snow, and night."),
            make_q("What is a 'Unique Identifier' column (like Customer_ID, Social_Security_Number, or Student_ID)?", ["A column that should definitely be used to predict the target", "A unique tag for each row that carries no real predictive pattern and should generally be removed before modeling", "A column that contains only zeros", "A password used to encrypt the table"], 1, "ID numbers are arbitrary labels unique to each row; using them as features can cause the model to memorize IDs instead of real patterns."),
            make_q("Why should an arbitrary 'Customer_ID' column (e.g. 1001, 1002, 1003) NOT be used as a predictive feature?", ["Because Python does not allow numbers over 1000", "Because the ID number is just an arbitrary tracking label; higher IDs don't mean a customer will spend more money!", "Because ID numbers are written in letters", "Because Customer IDs are always negative"], 1, "Arbitrary tracking numbers have no meaningful relationship with real-world behavior and will mislead the algorithm."),
            make_q("What is the 'Mean' of a numerical column?", ["The most frequently occurring number", "The mathematical average (sum of all values divided by the count of values)", "The middle number when values are sorted", "The difference between the largest and smallest number"], 1, "The mean is the classic average: add all numbers up and divide by how many there are."),
            make_q("What is the 'Median' of a numerical column?", ["The middle value when the numbers are sorted in order from smallest to largest", "The average of all numbers", "The highest number in the column", "The lowest number in the column"], 0, "The median is the exact middle point of sorted data; 50% of values are below it and 50% are above it."),
            make_q("If you have salaries [$40k, $45k, $50k, $55k, $5,000,000], why is the Median ($50k) a better description of typical salary than the Mean ($1,038k)?", ["Because the median is easier to spell", "Because the single multi-millionaire drastically pulls the mean upward, while the median reflects the experience of typical workers", "Because the mean cannot be calculated in Python", "Because the median is always smaller than the mean"], 1, "The median is robust against extreme outliers; the mean is heavily distorted by extreme values."),
            make_q("What is 'Imbalanced Data' in classification?", ["A computer desk that is tilted to one side", "When one category appears far more frequently than another (such as 999 normal emails and only 1 spam email)", "A table that has more columns than rows", "A spreadsheet where numbers are not sorted"], 1, "Imbalanced data occurs when one class heavily outnumbers another, which can trick models into simply guessing the majority class every time."),
            make_q("If 99% of bank transactions are legitimate and only 1% are fraud, what accuracy would a lazy model get if it just guessed 'Legitimate' for every transaction?", ["1%", "50%", "99%", "0%"], 2, "A model that always guesses the majority class achieves 99% accuracy while catching zero fraud! That's why accuracy alone is dangerous on imbalanced data."),
            make_q("What does 'One-Hot Encoding' do to a categorical column like Color [Red, Green, Blue]?", ["It turns all colors into black and white", "It creates separate yes/no (1 or 0) columns for each color: Is_Red, Is_Green, Is_Blue", "It deletes the column from the table", "It changes the text color on the screen to red"], 1, "One-hot encoding converts categorical words into binary indicator columns (1s and 0s) that math models can easily calculate with."),
            make_q("What is a 'Sample Size' in machine learning?", ["The physical dimensions of a laptop monitor", "The total number of examples (rows) in your dataset", "The font size used in the spreadsheet", "The number of gigabytes on a hard drive"], 1, "Sample size refers to how many observations or rows are available to train and test the model."),
            make_q("Why does having more high-quality training examples generally help a machine learning model?", ["Because more examples allow the algorithm to spot true patterns and filter out random noise more reliably", "Because computers only work if a file has over 1 million rows", "Because more rows make the code run faster", "Because algorithms get tired on small datasets"], 0, "More representative data gives the model a clearer picture of real-world patterns, reducing guesswork."),
            make_q("What is the golden rule of data preparation before building an ML model?", ["Always look at, understand, and clean your data before feeding it into any algorithm!", "Never open a spreadsheet with human eyes", "Always delete 50% of your data at random", "Only use data that comes from social media"], 0, "Understanding your data, its types, missing boxes, and outliers is the single most critical foundation for building a successful model.")
        ]
    })

    # 5. MATH FOUNDATIONS & INTUITION
    topics.append({
        "id": "math-foundations",
        "title": "Math Intuition for ML (No Fear!)",
        "description": "Understand the simple mathematical building blocks of machine learning: lines, slopes, averages, vectors, and measuring error.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Math Intuition for Machine Learning",
                    "subtitle": "No Complex Equations Required: Understanding Slopes, Lines, and Error"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "Don't Be Intimidated by the Math!",
                    "content": "You do NOT need a PhD in advanced mathematics to understand how machine learning works. Under the hood, most machine learning algorithms rely on **three simple everyday ideas**:\n\n1. **Finding a Trend (Drawing a Line):** As houses get bigger, their prices go up. Finding that trend line is what models do!\n2. **Measuring the Error (How Far Off Were We?):** If a house sold for $300k and the model predicted $280k, the error is $20k. The goal of learning is to make that error as small as possible.\n3. **Vectors & Matrices (Lists and Tables):** A 'vector' is just a shopping list of numbers (like `[3 bedrooms, 1500 sq ft, 2 bathrooms]`), and a 'matrix' is simply a table of those lists!"
                },
                {
                    "type": "text",
                    "title": "The Famous Line Equation: y = mx + b",
                    "content": "Remember the equation of a line from school?\n\n$$\\text{Prediction} (y) = \\text{Slope} (m) \\times \\text{Input} (x) + \\text{Starting Point} (b)$$\n\n- **x:** The input feature (e.g. Square footage of a house).\n- **m (Slope / Weight):** How much the price increases for every extra square foot (e.g. +$150 per sq ft).\n- **b (Intercept / Bias):** The baseline price even before counting square feet (e.g. the value of the empty land).\n- **y:** The predicted final price!\n\nWhen a model 'learns', it is simply adjusting the slope (m) and starting point (b) until its line passes as closely through all the data points as possible!"
                },
                {
                    "type": "table",
                    "title": "Mathematical Terms Translated into Plain English",
                    "headers": ["Math Term", "Fancy Sounding Name", "What It Actually Means in Plain English"],
                    "rows": [
                        ["Scalar", "A 0D Tensor", "Just a single regular number (e.g. 42)."],
                        ["Vector", "A 1D Tensor", "A list of numbers describing one item (e.g. [3, 1500, 2])."],
                        ["Matrix", "A 2D Tensor", "A spreadsheet grid of rows and columns."],
                        ["Error (Residual)", "Loss / Cost", "The difference between what the model guessed and what actually happened (|Actual - Predicted|)."],
                        ["Optimization", "Gradient Descent", "The process of slowly nudging the model's settings to make prediction errors smaller."]
                    ]
                }
            ]
        },
        "interactive": {
            "type": "statistics-calculator",
            "title": "Line & Error Visualizer",
            "description": "Adjust slope and intercept to see how prediction errors shrink as the line fits the points.",
            "metrics": ["dot_product", "l2_norm", "l1_norm", "cosine_similarity"]
        },
        "code": {
            "description": "Calculate predictions and measurement errors for house prices in Python.",
            "starter": "import numpy as np\nimport matplotlib.pyplot as plt\n\n# Square footage (x) and actual sale prices in thousands (y)\nsq_ft = np.array([1000, 1400, 1800, 2200, 2600])\nactual_prices = np.array([210, 290, 370, 440, 530])\n\n# Simple line model: Price = 0.20 * sq_ft + 10\npredicted_prices = 0.20 * sq_ft + 10\n\n# Calculate errors (how far off each guess was)\nerrors = actual_prices - predicted_prices\nprint('Actual Prices ($k):   ', actual_prices)\nprint('Predicted Prices ($k):', predicted_prices)\nprint('Mistake / Errors ($k):', errors)\n\nplt.figure(figsize=(6, 4))\nplt.scatter(sq_ft, actual_prices, color='blue', s=80, label='Actual Houses')\nplt.plot(sq_ft, predicted_prices, color='red', linewidth=2, label='Model Trend Line')\nplt.title('Fitting a Line to House Prices')\nplt.xlabel('Square Feet'); plt.ylabel('Price ($k)'); plt.legend(); plt.grid(True)\nplt.show()"
        },
        "quiz": [
            make_q("What is a 'Scalar' in mathematics and machine learning?", ["A list of numbers", "A single plain number, such as 5 or 42.5", "A grid with rows and columns", "A 3D cube of images"], 1, "A scalar is simply a single individual number with no direction."),
            make_q("In machine learning, what is a 'Vector' in simple terms?", ["A list of numbers representing an item (such as [3 bedrooms, 1500 sq ft, 2 bathrooms])", "A disease carried by mosquitoes", "A line of Python code", "A computer processor"], 0, "A vector is a one-dimensional ordered list of numbers."),
            make_q("What is a 'Matrix' in machine learning?", ["A movie starring Keanu Reeves", "A 2D table or grid of numbers arranged in rows and columns (like a spreadsheet)", "A computer cable", "A single fraction"], 1, "A matrix is a two-dimensional grid of numbers with rows and columns."),
            make_q("In the simple line equation y = mx + b, what does 'x' represent?", ["The input feature (such as house square footage)", "The color of the house", "The model's error", "The date of the sale"], 0, "x is the independent input variable (the feature we feed into the formula)."),
            make_q("In the equation y = mx + b, what does 'm' (the slope or weight) represent?", ["The brand of computer used", "How much the prediction changes for every 1-unit increase in x (e.g. extra dollars per square foot)", "The number of mistakes the model made", "The total count of rows in the table"], 1, "The slope m indicates the steepness of the line—how strongly the output responds to changes in the input."),
            make_q("In the equation y = mx + b, what does 'b' (the intercept or bias) represent?", ["The baseline starting value of y when x is equal to zero", "The number of bedrooms in a house", "The time it takes to train the model", "The percentage of correct predictions"], 0, "The intercept b is where the line crosses the vertical axis when input x is 0."),
            make_q("What is an 'Error' (or residual) in machine learning?", ["A bug that crashes the operating system", "The numerical difference between what the model predicted and what actually happened (Actual - Predicted)", "A typo in a variable name", "A missing file on disk"], 1, "Error is the gap between the model's guess and the ground-truth reality."),
            make_q("If a house actually sold for $300,000, and your model predicted $280,000, what is the prediction error?", ["$0", "$20,000", "$580,000", "$280,000"], 1, "The error is Actual - Predicted = $300,000 - $280,000 = $20,000."),
            make_q("What is the ultimate goal of training a machine learning model?", ["To make the prediction errors as small as possible across all training examples", "To make the computer use 100% of its memory", "To print 1,000 pages of text", "To make the line as steep as possible"], 0, "Training aims to minimize the overall error so the model's guesses match reality as closely as possible."),
            make_q("What does a 'positive slope' mean when plotting two variables on a graph?", ["As one variable increases, the other variable also tends to increase (like height and shoe size)", "As one variable increases, the other decreases", "The line is completely flat and horizontal", "The line is impossible to calculate"], 0, "A positive slope means the two variables rise together (an upward trend)."),
            make_q("What does a 'negative slope' mean when plotting two variables on a graph?", ["Both variables are positive", "As one variable increases, the other variable tends to decrease (like car mileage and car resale value)", "The numbers are invalid", "The line goes straight up vertically"], 1, "A negative slope means an inverse relationship: as x rises, y drops (a downward trend)."),
            make_q("If a trend line is completely flat and horizontal (slope m = 0), what does that tell you about the relationship between x and y?", ["Changing x has zero effect on y (there is no relationship)", "x and y are perfectly identical", "The model achieves 100% accuracy", "y increases infinitely fast"], 0, "A zero slope means changes in input x do not change the predicted output y at all."),
            make_q("What is an 'Average' (or Mean) in plain words?", ["The highest value in a group", "The sum of all numbers divided by how many numbers there are", "The middle number in a sorted list", "The smallest number in a list"], 1, "The average gives a central representative summary number for a set of values."),
            make_q("What is the average of the numbers [10, 20, 30]?", ["10", "20", "30", "60"], 1, "(10 + 20 + 30) / 3 = 60 / 3 = 20."),
            make_q("What does the word 'Optimization' mean in machine learning?", ["Buying a faster internet connection", "The process of systematically adjusting the model's numbers (weights and slopes) to minimize mistakes", "Compressing files into a zip archive", "Restarting your computer after updates"], 1, "Optimization is how algorithms search for the best settings to achieve the smallest possible error."),
            make_q("What is 'Euclidean Distance' in everyday terms?", ["The distance you drive on winding roads", "The straight-line ruler distance between two points on a map or graph", "The time it takes an airplane to fly between cities", "The length of an email"], 1, "Euclidean distance is the familiar straight-line 'as the crow flies' distance calculated by Pythagoras' theorem."),
            make_q("What does a 'Loss Function' (or Cost Function) calculate?", ["How much money the company lost this year", "A single total score measuring how bad the model's mistakes are across the entire dataset", "The battery percentage of a laptop", "The speed of the computer processor"], 1, "The loss function combines all individual prediction errors into a single score; lower loss means better predictions!"),
            make_q("If your model's Loss is decreasing after each training step, what does that mean?", ["The model is getting worse", "The model is learning and making more accurate predictions!", "The computer is running out of space", "The training has crashed"], 1, "A decreasing loss is great news: it means the model is getting closer to the real answers."),
            make_q("What is a 'scatter plot'?", ["A chart that throws random paint on a canvas", "A graph where data points are shown as individual dots plotted on horizontal and vertical axes", "A pie chart showing percentages", "A text document with bullet points"], 1, "A scatter plot visualizes pairs of numbers as dots, making trends and relationships easy to see."),
            make_q("Why do we square the errors in Mean Squared Error (MSE)?", ["To turn negative errors into positive numbers and penalize large mistakes much more heavily than small ones", "Because computers cannot subtract numbers", "To make the numbers look smaller", "Because squared numbers load faster in memory"], 0, "Squaring ensures that positive and negative errors don't cancel each other out, and heavily penalizes big blunders."),
            make_q("What is a 'Dimension' in machine learning data?", ["A portal to another universe", "A single feature, column, or measurement (e.g. a 3D dataset has 3 features like Height, Weight, and Age)", "The physical thickness of a laptop screen", "A computer font size"], 1, "In data science, each feature or column represents one dimension in the data space."),
            make_q("If you have data about houses with only 1 feature (Square Feet), how many dimensions does your input feature space have?", ["1 Dimension (a simple line)", "2 Dimensions", "10 Dimensions", "0 Dimensions"], 0, "A single feature corresponds to 1 dimension (points along a number line)."),
            make_q("If you have 2 features (Square Feet and Number of Bedrooms), how many dimensions does your feature space have?", ["1 Dimension", "2 Dimensions (a flat 2D plane with an X and Y axis)", "3 Dimensions", "100 Dimensions"], 1, "Two features create a 2D coordinate system where each house is a point (x, y)."),
            make_q("Can computers work with 50 or 100 dimensions (features) at the same time?", ["No, computers can only understand 3D like humans", "Yes, mathematical formulas work just as easily with 100 features as they do with 2 features!", "Only if you use 50 monitors", "No, software crashes above 4 dimensions"], 1, "While humans cannot visualize 100 dimensions, linear algebra handles 100 dimensions with the exact same formulas."),
            make_q("What is a 'Curve' compared to a 'Straight Line' in modeling?", ["A curve is always an error", "A non-linear relationship where the rate of change is not constant (such as children growing rapidly then leveling off as adults)", "A straight line that has been rotated 90 degrees", "A mathematical equation with no variables"], 1, "Curves represent non-linear patterns where the trend changes direction or speed rather than staying strictly straight."),
            make_q("What is an 'Iteration' (or Step) during model training?", ["One single pass or cycle where the model looks at examples, checks its errors, and updates its settings slightly", "Turning the computer off and on", "Deleting one row from a database", "A software license renewal"], 0, "An iteration is one step in the learning process where the model adjusts itself to get slightly better."),
            make_q("What is the 'Learning Rate' in simple terms?", ["The speed at which a human student reads a textbook", "The size of the adjustment step the algorithm takes when nudging its settings to reduce errors", "The price of an online machine learning course", "The clock speed of the computer processor"], 1, "The learning rate controls how big of a step the model takes when updating its numbers; too big and it overshoots, too small and it takes forever."),
            make_q("What happens if the Learning Rate is set way too high?", ["The model learns in 1 second perfectly", "The model takes massive wildly erratic leaps, overshooting the best answer and potentially blowing up", "The computer screen turns off", "The data is deleted from memory"], 1, "A learning rate that is too aggressive jumps past the optimal trend line, causing errors to swing out of control."),
            make_q("What happens if the Learning Rate is set way too low?", ["The model learns immediately", "The model makes tiny baby steps, taking a painfully long time to improve and possibly getting stuck", "The model becomes 100% accurate instantly", "The code throws a syntax error"], 1, "An excessively tiny learning rate means the model barely updates, requiring thousands of unnecessary steps."),
            make_q("What is a 'Global Minimum' on an error curve?", ["The coldest temperature recorded on Earth", "The lowest possible point where the model's error is at its absolute minimum (the best possible fit!)", "The smallest number in a spreadsheet", "A model that runs on zero electricity"], 1, "The global minimum is the bottom of the valley where the prediction error is as small as possible."),
            make_q("What does it mean when we say a model has 'Converged'?", ["The model has crashed with an error", "The model has reached a point where its error is no longer improving noticeably and training is practically complete", "The computer has connected to the Wi-Fi network", "All features have been converted to text"], 1, "Convergence means learning has stabilized at the best settings it can find."),
            make_q("What is the dot product of two identical numbers [3] and [4]?", ["7", "12", "1", "0.75"], 1, "Multiplication: 3 * 4 = 12."),
            make_q("Why do data scientists use graphs and plots when working with math in ML?", ["To make the report look pretty for managers", "Because visual charts make trends, clusters, and unusual outliers immediately obvious to human eyes", "Because Python cannot do math without drawing pictures", "Because graphs save battery power"], 1, "Visualizing data allows humans to spot patterns, clusters, and errors that are hidden inside tables of numbers."),
            make_q("What is a 'Weight' in a machine learning model?", ["The physical heaviness of the computer laptop in kilograms", "A learned number that multiplies a feature, reflecting how important that feature is in making the prediction", "The number of gigabytes of RAM used", "The total count of rows in the dataset"], 1, "Weights are the numbers the model learns: higher weights mean that feature has a stronger influence on the prediction."),
            make_q("If the weight for 'Square Footage' is +150, and the weight for 'House Paint Color' is 0, what does that mean?", ["Square footage matters heavily ($150 per sq ft), while paint color has zero influence on the price prediction", "Paint color is the most important feature", "The house is painted white", "The model has crashed"], 0, "A weight of 0 means the feature is completely ignored by the model, while +150 means square footage strongly drives the price.")
        ]
    })

    # 6. PROBABILITY & STATISTICS BASICS
    topics.append({
        "id": "probability-basics",
        "title": "Probability & Everyday Statistics",
        "description": "Understand chances, percentages, averages, bell curves, and the golden rule: correlation does NOT mean causation!",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Probability & Everyday Statistics",
                    "subtitle": "How Machine Learning Measures Likelihood and Understands Chance"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "Probability is Just Measuring Chance",
                    "content": "In the real world, things are rarely 100% guaranteed. When a doctor diagnoses a patient or a weather app forecasts tomorrow's weather, they speak in terms of **probability**:\n\n- Probability is always a number between **0.0 (0%)** and **1.0 (100%)**.\n- A probability of **0.0** means the event is completely impossible.\n- A probability of **1.0** means the event is 100% certain.\n- A probability of **0.5 (50%)** means it's an even coin toss!"
                },
                {
                    "type": "table",
                    "title": "Everyday Probability Examples",
                    "headers": ["Event", "Probability as a Decimal", "Probability as a Percentage", "Meaning"],
                    "rows": [
                        ["Flipping Heads on a fair coin", "0.50", "50%", "Equally likely to be heads or tails."],
                        ["Rolling a 6 on a standard 6-sided die", "0.167", "16.7%", "One chance out of 6."],
                        ["The sun rising tomorrow", "1.00", "100%", "Completely certain."],
                        ["A fish riding a bicycle", "0.00", "0%", "Completely impossible."]
                    ]
                },
                {
                    "type": "callout",
                    "style": "warning",
                    "title": "The Golden Rule: Correlation Does NOT Mean Causation!",
                    "content": "Just because two things rise and fall together (**correlation**), it does NOT mean that one causes the other (**causation**):\n\n- *Real Example:* Ice cream sales and sunburn cases both skyrocket in July. Does eating ice cream cause sunburns? Of course not! Both are caused by a third factor: **hot sunny summer weather**!\n\nMachine learning models find correlations in data, but humans must use common sense to understand real-world cause and effect."
                }
            ]
        },
        "interactive": {
            "type": "coin-flip-simulator",
            "title": "Coin Flip Probability Simulator",
            "description": "Simulate flipping coins to watch how percentages stabilize at 50% as sample size increases.",
            "params": {"flips": 1000}
        },
        "code": {
            "description": "Simulate flipping coins and plot a normal bell curve in Python.",
            "starter": "import numpy as np\nimport matplotlib.pyplot as plt\n\n# 1. Flip a coin 1,000 times in Python\nflips = np.random.choice(['Heads', 'Tails'], size=1000)\nheads_percentage = np.mean(flips == 'Heads') * 100\nprint(f'1,000 Coin Flips -> Heads: {heads_percentage:.1f}% (Expected ~50%)')\n\n# 2. Simulate human heights (Bell Curve: Mean = 170cm, Std = 8cm)\nheights = np.random.normal(loc=170, scale=8, size=5000)\n\nprint(f'Average Height: {np.mean(heights):.1f} cm')\nprint(f'Middle Height (Median): {np.median(heights):.1f} cm')\n\nplt.figure(figsize=(6, 4))\nplt.hist(heights, bins=30, color='skyblue', edgecolor='black', alpha=0.7)\nplt.title('The Classic Bell Curve (Heights)')\nplt.xlabel('Height (cm)'); plt.ylabel('Count of People'); plt.grid(True)\nplt.show()"
        },
        "quiz": [
            make_q("What does a probability of 0.0 (or 0%) mean?", ["The event is guaranteed to happen", "The event is completely impossible and will never happen", "The event has a 50/50 chance", "The calculation has an error"], 1, "A probability of 0.0 means the event has zero chance of occurring."),
            make_q("What does a probability of 1.0 (or 100%) mean?", ["The event is completely impossible", "The event is 100% certain to happen", "The event is a coin flip", "The model is broken"], 1, "A probability of 1.0 represents absolute, guaranteed certainty."),
            make_q("What is the probability of flipping Heads on a fair two-sided coin?", ["0.0 (0%)", "0.5 (50%)", "1.0 (100%)", "0.25 (25%)"], 1, "There are 2 equally likely outcomes, so 1 / 2 = 0.5 (50%)."),
            make_q("What is the probability of rolling a '3' on a standard fair six-sided die?", ["1 out of 6 (about 16.7%)", "3 out of 6 (50%)", "100%", "0%"], 0, "There is only one face with a 3 out of 6 possible sides: 1/6 = ~16.7%."),
            make_q("If all probabilities for all possible outcomes are added together, what must they always sum to?", ["0.0", "1.0 (or 100%)", "10.0", "Depends on the computer"], 1, "The sum of probabilities for all mutually exclusive possible outcomes always equals exactly 1.0 (100%)."),
            make_q("What does a model mean when it outputs: 'Probability of Spam = 0.85'?", ["The email contains 85 words", "The model is 85% confident that this email is spam", "85 people reported the email", "The email was sent 85 minutes ago"], 1, "A probability of 0.85 means the model estimates an 85% likelihood that the email is spam."),
            make_q("What does the famous statistical phrase 'Correlation does NOT imply causation' mean?", ["Correlation is illegal in statistics", "Just because two things tend to happen at the same time does not mean that one is causing the other", "Statistics cannot be trusted", "Computers cause all correlations"], 1, "Two variables can rise and fall together due to coincidence or a shared third cause, without one causing the other."),
            make_q("Ice cream sales and drowning incidents both increase in the summer. Does eating ice cream cause drowning?", ["Yes, ice cream makes people sink in water", "No! Both increase because of hot summer weather (more people swim and more people eat ice cream)", "Yes, statistics proved it", "Only chocolate ice cream causes drowning"], 1, "This is a classic example of correlation without causation: hot summer weather causes both events."),
            make_q("What is a 'Bell Curve' (Normal Distribution) in plain terms?", ["A curve that looks like a ringing metal bell, where most people are near the average and very few are extreme", "A chart of bell sales", "A flat line with no changes", "A circle drawn on a screen"], 0, "A normal distribution (bell curve) shows that typical values cluster around the center, with extreme highs and lows becoming progressively rarer."),
            make_q("Which of the following real-world measurements naturally follows a Bell Curve?", ["Adult human heights in a large city", "The roll of a single die", "Lottery winning ticket numbers", "The letters of the alphabet"], 0, "Human height is a classic bell curve: most adults are near average height, with very few being extremely short or extremely tall."),
            make_q("What is the 'Mean' of a group of numbers?", ["The largest number", "The arithmetic average (sum of all values divided by count)", "The middle number", "The difference between highest and lowest"], 1, "The mean is the calculated average."),
            make_q("What is the 'Median' of a group of numbers?", ["The number that appears most often", "The exact middle value when the numbers are sorted from lowest to highest", "The total sum", "The average"], 1, "The median divides sorted data in half: 50% are lower, 50% are higher."),
            make_q("What is the 'Mode' in statistics?", ["The battery-saving mode on a laptop", "The value that appears most frequently in a dataset", "The average of all values", "The difference between two values"], 1, "The mode is simply the most common or repeated value."),
            make_q("In the set of numbers [4, 4, 4, 7, 9], what is the Mode?", ["4", "7", "9", "5.6"], 0, "4 appears three times, more than any other number."),
            make_q("If you have nine people with salaries of $50,000 and one CEO earning $10,000,000, what happens to the Mean salary?", ["The mean stays at $50,000", "The mean gets pulled way up to over $1,000,000, misrepresenting what typical workers make", "The mean becomes negative", "The mean turns into zero"], 1, "A single huge outlier drags the mean upward, which is why median is often preferred for salaries."),
            make_q("What is 'Variance' in simple terms?", ["A measure of how spread out or scattered the numbers are around their average", "The speed of the computer processor", "A software bug in Python", "The number of columns in a table"], 0, "Variance measures spread: low variance means data points are clustered tightly together; high variance means they are widely scattered."),
            make_q("If all students in a classroom score exactly 80 on a test, what is the variance of the scores?", ["80", "0 (there is zero spread because everyone got the identical score)", "100", "1"], 1, "When every single number is identical, there is no variation at all (variance = 0)."),
            make_q("What is 'Standard Deviation'?", ["The rules written in a software manual", "The square root of variance, measuring the typical distance data points sit away from the average", "The highest possible test score", "A type of computer memory"], 1, "Standard deviation tells you roughly how far typical values stray from the average, expressed in the original units."),
            make_q("What does a 'Positive Correlation' between study hours and exam scores mean?", ["Students who study more hours tend to get higher exam scores", "Studying has no effect on scores", "Studying causes exam papers to tear", "More study hours result in lower scores"], 0, "Positive correlation means both variables move in the same direction: more study time associates with higher grades."),
            make_q("What does a 'Negative Correlation' between car age and car price mean?", ["Older cars generally sell for lower prices", "Older cars sell for higher prices", "Car age has no relationship with price", "Cars do not age"], 0, "Negative correlation means as one variable goes up (age), the other goes down (price)."),
            make_q("What does a Correlation of 0.0 mean?", ["A perfect relationship", "There is no linear relationship between the two variables at all (like shoe size and IQ)", "The calculation failed", "The data is 100% negative"], 1, "A correlation of zero means the two variables do not move together in a line."),
            make_q("What are the minimum and maximum possible values for a correlation coefficient?", ["0 to 100", "-1.0 (perfect negative) to +1.0 (perfect positive)", "Negative infinity to positive infinity", "0 to 1"], 1, "Correlation is always bounded between -1.0 (perfect opposite relationship) and +1.0 (perfect synchronized relationship)."),
            make_q("What does a 'False Alarm' (False Positive) mean in cancer screening?", ["A patient who has cancer is told they are healthy", "A healthy patient is mistakenly told they might have cancer", "The doctor forgot to call the patient", "The scanner ran out of paper"], 1, "A false positive is a false alarm: the test flags an issue when the patient is actually healthy."),
            make_q("What does a 'Miss' (False Negative) mean in cancer screening?", ["A healthy patient is tested twice", "A patient who actually has cancer is mistakenly told they are completely healthy", "The hospital cancels the appointment", "The test takes 10 minutes"], 1, "A false negative is a missed detection: the test claims everything is clear when disease is actually present."),
            make_q("Why is a False Negative in medical testing often considered more dangerous than a False Positive?", ["Because false negatives cost more paper", "Because missing a real disease delays life-saving treatment, while a false alarm can be cleared up with a follow-up test", "Because false negatives crash hospital databases", "Because false positives are illegal"], 1, "Missing a deadly illness (false negative) can be fatal, making false negatives far more critical in healthcare."),
            make_q("What is a 'Sample' versus a 'Population' in statistics?", ["A sample is a smaller subset of people observed from the entire total population", "A sample is digital; a population is analog", "A population is a small city; a sample is a country", "They are identical synonyms"], 0, "You cannot test every human on Earth (population), so you study a representative subset (sample) to draw conclusions."),
            make_q("If you survey 500 voters leaving polling stations to predict an election of 10 million voters, what are the 500 people called?", ["The population", "The sample", "The target", "The algorithm"], 1, "The 500 surveyed voters represent a sample of the larger voting population."),
            make_q("What is 'Sampling Bias'?", ["A survey that asks too many questions", "When the sample of people chosen does not fairly represent the broader population (like surveying only college students to predict retirement laws)", "A computer hardware glitch", "A dataset with zero rows"], 1, "Sampling bias occurs when your data collection favors certain groups over others, skewing your conclusions."),
            make_q("What is a 'Percentile' in everyday life (like scoring in the 90th percentile on the SAT)?", ["You scored exactly 90%", "You scored higher than 90% of all people who took the exam", "You got 90 questions wrong", "You took the test in 90 minutes"], 1, "The 90th percentile means you performed better than 90% of the entire tested population."),
            make_q("What does the '50th percentile' of any dataset equal?", ["The Maximum value", "The Median (the exact middle value)", "The Mean", "Zero"], 1, "The 50th percentile is by definition the median: half the data is below it, and half is above it."),
            make_q("If you flip a fair coin 10 times in a row and get Heads every time, what is the probability of getting Heads on the 11th flip?", ["0% (Tails is 'due')", "50% (The coin has no memory; each flip is independent!)", "100%", "90%"], 1, "This is the famous 'Gambler's Fallacy': coins have no memory, so every independent flip is always 50/50."),
            make_q("What does an 'Independent Event' mean in probability?", ["An event that happens without any electricity", "An event whose outcome is completely unaffected by what happened in previous events", "An event with 100% probability", "A holiday celebrated in July"], 1, "Independent events do not influence one another (like rolling a die twice)."),
            make_q("What is an 'Outlier' in a bell curve distribution?", ["A point in the tall center of the bell", "A very rare point located far out in the thin outer tails of the bell", "The average point", "The area under the curve"], 1, "Outliers sit in the thin tails far away from the central cluster of the bell curve."),
            make_q("Why do machine learning classifiers output probabilities (like 0.92) instead of just hard YES/NO answers?", ["Because computers are indecisive", "Because probabilities allow humans to see how confident the model is and choose custom decision thresholds", "Because YES and NO take up too much memory", "Because probabilities are easier to type"], 1, "Probabilities express confidence: an email with 99% spam probability is very different from an ambiguous 51% email!"),
            make_q("What is the probability of an event that is 50% likely to happen, expressed as a fraction?", ["1/2", "1/4", "1/10", "1/100"], 0, "50% = 50 / 100 = 1/2.")
        ]
    })

    # 7. EXPLORATORY DATA ANALYSIS (EDA) BASICS
    topics.append({
        "id": "eda-basics",
        "title": "Exploratory Data Analysis (EDA) Basics",
        "description": "Learn how to explore data visually: using bar charts, scatter plots, and histograms to spot patterns and find errors.",
        "duration": "25 min",
        "features": ["read", "interactive", "code", "quiz"],
        "content": {
            "sections": [
                {
                    "type": "hero",
                    "title": "Exploratory Data Analysis (EDA)",
                    "subtitle": "Looking at Data with Your Own Eyes Before Training Any Model"
                },
                {
                    "type": "callout",
                    "style": "definition",
                    "title": "What is EDA in Simple Terms?",
                    "content": "Imagine buying a used car. You wouldn't just wire money without looking under the hood, checking the odometer, and inspecting the tires!\n\n**Exploratory Data Analysis (EDA)** is doing the exact same vehicle inspection on your dataset. Before feeding data into an algorithm, data scientists create simple visual charts and summary numbers to **spot patterns, discover mistakes, and see what the data looks like**."
                },
                {
                    "type": "table",
                    "title": "The 4 Essential Charts for Beginners",
                    "headers": ["Chart Type", "What It Looks Like", "Best Used For", "Everyday Example"],
                    "rows": [
                        ["Bar Chart", "Vertical or horizontal bars of different lengths.", "Comparing counts or totals across categories.", "Comparing total phone sales by Brand (Apple vs Samsung vs Google)."],
                        ["Histogram", "Bars touching each other showing how numbers cluster.", "Seeing how a single numeric measurement is spread out.", "Looking at the age distribution of website visitors (Are they teens or seniors?)."],
                        ["Scatter Plot", "A cloud of individual dots on an X and Y grid.", "Showing the relationship between TWO numbers.", "Plotting House Size (X) vs House Price (Y) to see if bigger houses cost more."],
                        ["Line Chart", "A continuous line moving from left to right.", "Tracking how a number changes over time.", "Showing daily stock prices or temperature over 12 months."]
                    ]
                },
                {
                    "type": "callout",
                    "style": "tip",
                    "title": "What You Are Hunting For During EDA",
                    "content": "1. **Obvious Typos:** Someone entered an age of `-5` or `999`.\n2. **Missing Blanks:** Whole columns where half the rows are empty.\n3. **Surprising Patterns:** Do sales always spike on Friday evenings?\n4. **Unbalanced Groups:** 99% of customers are from California and only 1% from other states."
                }
            ]
        },
        "interactive": {
            "type": "sorting-exercise",
            "title": "Chart Chooser Challenge",
            "description": "Choose the best chart type for each real-world data visualization goal.",
            "items": [
                {"text": "Comparing the number of smartphones sold across 5 brands", "category": "Bar Chart"},
                {"text": "Seeing if study hours correlate with exam scores", "category": "Scatter Plot"},
                {"text": "Tracking daily Bitcoin price changes over 365 days", "category": "Line Chart"},
                {"text": "Checking how customer ages are distributed across age brackets", "category": "Histogram"},
                {"text": "Comparing total website visitors on Monday vs Tuesday vs Wednesday", "category": "Bar Chart"},
                {"text": "Plotting house square footage vs selling price", "category": "Scatter Plot"}
            ],
            "categories": ["Bar Chart", "Histogram", "Scatter Plot", "Line Chart"]
        },
        "code": {
            "description": "Create basic bar charts and scatter plots using Matplotlib in Python.",
            "starter": "import matplotlib.pyplot as plt\n\n# 1. Bar Chart: Comparing counts across categories\ncities = ['New York', 'London', 'Tokyo', 'Paris']\nvisitors = [450, 380, 520, 310]\n\nplt.figure(figsize=(7, 3))\nplt.subplot(1, 2, 1)\nplt.bar(cities, visitors, color=['orange', 'teal', 'coral', 'skyblue'])\nplt.title('Visitors by City')\nplt.ylabel('Count')\n\n# 2. Scatter Plot: Showing relationship between two numbers\nhours = [1, 2, 3, 4, 5, 6, 7, 8]\nscores = [52, 58, 65, 68, 76, 83, 89, 95]\n\nplt.subplot(1, 2, 2)\nplt.scatter(hours, scores, color='purple', s=60)\nplt.title('Study Hours vs Exam Score')\nplt.xlabel('Hours'); plt.ylabel('Score')\n\nplt.tight_layout()\nplt.show()"
        },
        "quiz": [
            make_q("What does 'EDA' stand for in machine learning?", ["Electronic Data Archive", "Exploratory Data Analysis", "Everyday Data Algorithm", "Estimated Diagnostic Accuracy"], 1, "EDA stands for Exploratory Data Analysis: the practice of visually and statistically inspecting data before modeling."),
            make_q("What is the main goal of Exploratory Data Analysis?", ["To write 10,000 lines of code immediately", "To look at and understand the data, spot patterns, and find mistakes before training a model", "To delete the dataset", "To sell customer data to advertisers"], 1, "EDA helps practitioners understand data structure, detect anomalies, and uncover initial relationships."),
            make_q("Why is a 'Bar Chart' useful in data exploration?", ["It tracks changes over 100 years", "It is great for comparing numbers or counts across different categories (like sales by country)", "It only displays circles", "It calculates complex algebra"], 1, "Bar charts clearly compare discrete groups or categories (e.g. products, cities, or colors)."),
            make_q("Which chart is best for showing how a single continuous measurement is distributed (such as customer ages)?", ["A Histogram", "A Pie Chart with 500 slices", "A line drawn randomly on screen", "A screenshot of code"], 0, "Histograms group continuous numbers into binned ranges, showing where values cluster and how spread out they are."),
            make_q("Which chart is best for visualizing the relationship between TWO numerical measurements (like house size vs price)?", ["A Scatter Plot", "A Bar Chart", "A Calendar", "A single bullet point"], 0, "Scatter plots show pairs of numbers as dots on an (X, Y) grid, making correlations instantly visible."),
            make_q("Which chart is ideal for showing how a value changes continuously over time (like daily stock prices)?", ["A Line Chart", "A Pie Chart", "A Bar Chart", "A Venn diagram"], 0, "Line charts connect points sequentially over time, making trends and temporal shifts easy to track."),
            make_q("Suppose a scatter plot between 'Years of Experience' and 'Salary' shows dots rising from bottom-left to top-right. What does this tell you?", ["Experience has no effect on salary", "People with more experience tend to earn higher salaries (a positive relationship)", "More experience leads to lower salaries", "The data is completely corrupted"], 1, "A trend rising from bottom-left to top-right indicates that as experience increases, salary tends to increase."),
            make_q("Suppose a scatter plot between 'Car Mileage' and 'Car Price' shows dots sloping downward from top-left to bottom-right. What does this mean?", ["Higher mileage cars tend to cost less money", "Cars with zero miles are free", "Higher mileage cars are more expensive", "There is no relationship at all"], 0, "A downward slope indicates an inverse (negative) relationship: higher mileage correlates with lower price."),
            make_q("If you inspect a dataset and see someone's age listed as '-10', what should you suspect?", ["They will be born in 10 years", "It is a data entry error or typo that needs to be fixed or removed", "The computer has a negative screen", "The person is a ghost"], 1, "Negative ages are physically impossible; they indicate corrupted or mistyped data that must be cleaned during EDA."),
            make_q("What is a 'Bin' in a histogram?", ["A trash can on your computer desktop", "A range or bucket of numbers (such as ages 20 to 29) that counts how many data points fall inside it", "A type of programming language", "A column of text"], 1, "Histograms divide continuous values into bins (intervals) and count the frequency of occurrences in each bin."),
            make_q("If a histogram shows two distinct tall peaks separated by a dip, what does that usually suggest?", ["The histogram was drawn incorrectly", "The dataset likely contains two distinct groups of people or items mixed together (like adults and children)", "The computer ran out of memory", "The numbers are all zero"], 1, "Two peaks (bimodal distribution) usually indicates that two different sub-populations exist within the same dataset."),
            make_q("What is a 'Box Plot' (Box-and-Whisker plot) useful for?", ["Watching boxing videos", "Quickly seeing the median, spread, and extreme outliers of a numerical feature in a single diagram", "Drawing 3D cubes", "Writing text reports"], 1, "Box plots summarize the median, middle 50% spread, and flag extreme outlier dots beyond the whiskers."),
            make_q("On a box plot, what do isolated dots floating far beyond the whiskers usually represent?", ["Missing values", "Potential extreme outliers", "The average value", "The title of the chart"], 1, "Points plotted individually beyond the whiskers are flagged as potential outliers."),
            make_q("Why is a Pie Chart with 40 thin slices generally considered a poor data visualization?", ["Because pies are delicious", "Because it is very difficult for human eyes to compare angles and slice sizes when there are too many categories", "Because computers cannot draw circles", "Because pie charts use too much ink"], 1, "Human vision is poor at comparing dozens of tiny angled slices; a sorted bar chart is far clearer."),
            make_q("What is a 'Correlation Heatmap'?", ["A thermal camera picture of a computer processor", "A color-coded grid that shows how strongly every feature in a dataset correlates with every other feature", "A map showing desert temperatures", "A heatmap of website clicks"], 1, "A correlation heatmap displays pairwise correlation scores as colors, highlighting which features move together."),
            make_q("If two features on a heatmap have a correlation score of +0.98 (like 'House Square Feet' and 'House Square Meters'), what does this tell an engineer?", ["The two features are almost identical duplicates that provide redundant information", "The features are completely unrelated", "One of the features must be deleted immediately by law", "The model will crash if trained"], 0, "A correlation near 1.0 means the two columns say the exact same thing; one can often be removed to simplify the model."),
            make_q("What is the danger of jumping straight into training an ML model without doing EDA first?", ["Your computer will physically overheat", "You may train a broken model on bad data, miss obvious typos, overlook severe class imbalances, and fail completely", "The code will refuse to compile", "You will be fined by the cloud provider"], 1, "Skipping EDA is like driving blindfolded: you won't know if the data is filled with duplicates, errors, or leakage."),
            make_q("What does it mean if 95% of the data points on a scatter plot are clustered in a tight ball and 1 single point sits miles away in the corner?", ["The plot is drawn incorrectly", "That single point is an extreme outlier that warrants investigation", "The model has achieved 100% accuracy", "All other points are invalid"], 1, "An isolated point far from the cluster is an outlier that could be an error or a rare event."),
            make_q("What is a 'Summary Statistics' table in pandas (like df.describe())?", ["A summary of the news of the day", "A table showing key numbers like count, mean, min, max, and percentiles for every numerical column", "A list of software developers on the team", "A billing receipt for cloud storage"], 1, "df.describe() instantly outputs counts, averages, standard deviations, and percentiles for all numeric columns."),
            make_q("If df.describe() shows that the 'Minimum' value of 'Income' is -$50,000, what should you do?", ["Nothing, negative income is completely normal for everyone", "Investigate why income is negative: is it debt, a coding bug, or a data error?", "Delete all positive numbers instead", "Multiply all incomes by 2"], 1, "Unusual negative values should trigger an investigation into whether they represent debt, losses, or data corruption."),
            make_q("If a dataset of 1,000 customers shows that 998 of them live in 'California' and only 2 live elsewhere, what did EDA reveal?", ["The dataset is perfectly balanced across the nation", "The data is heavily geographically skewed toward California, so the model may not generalize to other states", "The company should move to New York", "The other 49 states do not exist"], 1, "EDA reveals geographical skew, alerting engineers that the model might only be reliable for California residents."),
            make_q("What does a 'Count Plot' show for a categorical feature like 'Pet Type'?", ["How many dogs, cats, birds, and fish exist in the dataset as simple bars", "The average weight of all pets", "The speed of the fastest animal", "The price of pet food"], 0, "A count plot is a bar chart showing the frequency of each category level."),
            make_q("Why should you check for missing values during EDA?", ["Because missing values cause many machine learning algorithms to crash or fail", "Because blank cells make the spreadsheet file too small", "Because missing values turn into viruses", "Because computers dislike blank spaces"], 0, "Most standard ML algorithms cannot process null or NaN values without explicit handling."),
            make_q("What is a 'Trend' in data visualization?", ["A fashionable haircut", "The general direction in which data points tend to move (such as rising, falling, or staying flat)", "A computer font choice", "A temporary file stored in cache"], 1, "A trend describes the general trajectory or pattern observed across the data."),
            make_q("What does a 'flat line' with zero slope on a scatter plot indicate?", ["A very strong relationship", "No relationship: changing the horizontal variable has no noticeable effect on the vertical variable", "A perfect machine learning model", "A software crash"], 1, "A flat horizontal line indicates that knowing X gives no clue about Y."),
            make_q("Why are visual axes labels (like 'Age in Years' and 'Price in Dollars') important in EDA charts?", ["They are required by the operating system", "Without clear labels and units, numbers on a chart are meaningless to human interpreters", "Labels make charts load 10x faster", "Labels prevent computers from turning off"], 1, "Clear axis titles and units are essential for humans to correctly understand what the numbers represent."),
            make_q("What is an 'Anomaly' in exploratory data analysis?", ["A common everyday occurrence", "An unusual, unexpected, or strange data point that does not fit the normal pattern", "A line of code that runs normally", "A computer monitor setting"], 1, "Anomalies are oddities or surprises in the data that demand human attention."),
            make_q("If you plot a histogram of house prices and see a long tail stretching far to the right, what is this called?", ["A left-skewed distribution", "A right-skewed distribution (most houses are modest, with a few ultra-luxury mansions stretching the tail)", "A perfectly symmetric distribution", "A broken plot"], 1, "When extreme high values pull the tail out to the right, it is a right-skewed (positively skewed) distribution."),
            make_q("Why do we look at correlations between input features and the target variable during EDA?", ["To find out which features have the strongest relationships with what we want to predict", "To delete the target variable", "To make the file smaller", "Because correlations are required by law"], 0, "Features that correlate strongly with the target are often the most valuable clues for your model."),
            make_q("If an input feature has a correlation of 0.00 with the target, what might an engineer consider doing?", ["Making it the primary feature in the model", "Considering whether this feature provides any real value, or if it can be safely dropped to simplify the model", "Multiplying it by 1,000", "Restarting the computer"], 1, "Features with zero relationship to the target can often be removed without hurting accuracy."),
            make_q("What is the benefit of plotting data before running machine learning models?", ["It turns complex tables of numbers into intuitive visual shapes that the human brain can instantly understand", "It makes the computer run 50% cooler", "It eliminates the need for testing sets", "It creates synthetic data automatically"], 0, "Human visual processing is exceptionally good at spotting clusters, gaps, and trends that are invisible in raw tables."),
            make_q("What should you do if EDA reveals that 80% of rows in a column are blank missing values?", ["Invent numbers to fill in all 80% of the blanks", "Consider whether the column is too incomplete to be useful, or investigate why so much data was missing", "Delete the entire company database", "Ignore it and hope the computer fixes it"], 1, "Heavily missing features often provide too little signal to be worth keeping, or indicate a broken upstream data collection process."),
            make_q("What is a 'pair plot' (or scatter plot matrix)?", ["A chart that only shows two data points", "A grid of scatter plots comparing every feature against every other feature in a single visual overview", "A chart of pairs of shoes", "A chart showing model weights"], 1, "A pair plot creates a grid of small scatter plots for all numerical variables, offering a bird's-eye view of relationships."),
            make_q("Why is Exploratory Data Analysis considered an iterative, detective-like process?", ["Because you wear a detective hat while coding", "Because every chart you make can raise new questions, uncover new quirks, and guide how you prepare data for modeling", "Because it is required by criminal law", "Because data scientists only work at night"], 1, "EDA is investigative: you explore clues, test hunches, clean anomalies, and refine your understanding step-by-step."),
            make_q("What is the most rewarding part of completing a thorough EDA?", ["Closing your computer and going to sleep", "Having deep confidence that your data is clean, understandable, and ready to train a reliable machine learning model!", "Deleting all your plots", "Paying your cloud computing bill"], 1, "Great EDA gives you clarity and confidence, ensuring your models are built on solid, trustworthy foundations.")
        ]
    })

    return topics
