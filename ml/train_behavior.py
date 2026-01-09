import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Generate synthetic data
def generate_synthetic_data(n_samples=1000):
    data = []
    for _ in range(n_samples):
        # Genuine user
        data.append({
            'typing_variance': np.random.uniform(50, 200),
            'paste_count': np.random.randint(0, 2),
            'tab_switch_count': np.random.randint(0, 3),
            'response_time_variance': np.random.uniform(100, 500),
            'is_ai_assisted': 0
        })
        # AI-assisted user
        data.append({
            'typing_variance': np.random.uniform(10, 50),  # More consistent
            'paste_count': np.random.randint(2, 5),
            'tab_switch_count': np.random.randint(3, 8),
            'response_time_variance': np.random.uniform(10, 100),  # Less variance
            'is_ai_assisted': 1
        })
    return pd.DataFrame(data)

# Train model
df = generate_synthetic_data(500)
X = df[['typing_variance', 'paste_count', 'tab_switch_count', 'response_time_variance']]
y = df['is_ai_assisted']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print(f"Model accuracy: {model.score(X_test, y_test):.2f}")

# Save model
joblib.dump(model, '../backend/ml_models/behavior_model.pkl')
print("Model saved!")