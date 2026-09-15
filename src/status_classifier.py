import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import ExtraTreesClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
from sklearn.model_selection import train_test_split


# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "public/train.csv"

df = pd.read_csv(DATA_PATH)

print("=" * 65)
print("MISSION READINESS STATUS CLASSIFIER")
print("=" * 65)

print("Rows    :", len(df))
print("Columns :", len(df.columns))


# ============================================================
# 2. SORT DATA
# ============================================================

df = df.sort_values(
    ["unit_number", "time_in_cycles"]
).reset_index(drop=True)


# ============================================================
# 3. CREATE STATUS LABEL
# ============================================================

# Operational rules:
#
# RUL > 40       -> READY
# RUL 20-40      -> WATCH
# RUL <= 20      -> CRITICAL

def create_status(rul):

    if rul > 40:
        return "READY"

    elif rul > 20:
        return "WATCH"

    else:
        return "CRITICAL"


df["status"] = df["RUL"].apply(create_status)


print("\nStatus distribution:")
print(df["status"].value_counts())


# ============================================================
# 4. SENSOR SELECTION
# ============================================================

sensor_columns = [
    col for col in df.columns
    if col.startswith("sensor_")
]

# Remove sensors with almost no variation
variance = df[sensor_columns].var()

useful_sensors = variance[
    variance > 0.001
].index.tolist()


print("\nTotal sensors :", len(sensor_columns))
print("Useful sensors:", len(useful_sensors))


# ============================================================
# 5. BASIC FEATURES
# ============================================================

feature_columns = [
    "time_in_cycles",
    "op_setting_1",
    "op_setting_2",
    "op_setting_3"
] + useful_sensors


# ============================================================
# 6. CREATE DEGRADATION FEATURES
# ============================================================

print("\nCreating sensor degradation features...")

for sensor in useful_sensors:

    # --------------------------------------------------------
    # 5-cycle rolling mean
    # --------------------------------------------------------

    df[f"{sensor}_mean5"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                window=5,
                min_periods=1
            ).mean()
        )
    )

    # --------------------------------------------------------
    # 10-cycle rolling mean
    # --------------------------------------------------------

    df[f"{sensor}_mean10"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                window=10,
                min_periods=1
            ).mean()
        )
    )

    # --------------------------------------------------------
    # 5-cycle standard deviation
    # --------------------------------------------------------

    df[f"{sensor}_std5"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                window=5,
                min_periods=1
            ).std()
        )
    )

    # --------------------------------------------------------
    # Change from previous cycle
    # --------------------------------------------------------

    df[f"{sensor}_diff1"] = (
        df.groupby("unit_number")[sensor]
        .diff()
    )

    # --------------------------------------------------------
    # Change over 5 cycles
    # --------------------------------------------------------

    df[f"{sensor}_diff5"] = (
        df.groupby("unit_number")[sensor]
        .diff(5)
    )


# Find all generated trend features
trend_features = [
    col
    for col in df.columns
    if (
        col.endswith("_mean5")
        or col.endswith("_mean10")
        or col.endswith("_std5")
        or col.endswith("_diff1")
        or col.endswith("_diff5")
    )
]

feature_columns += trend_features


# Handle missing/infinite values
df[feature_columns] = (
    df[feature_columns]
    .replace([np.inf, -np.inf], np.nan)
    .fillna(0)
)


print("Total features:", len(feature_columns))


# ============================================================
# 7. SPLIT BY UNIT
# ============================================================

# Important:
# We split complete machines/units rather than individual rows.
# This reduces data leakage between training and testing.

units = df["unit_number"].unique()

train_units, test_units = train_test_split(
    units,
    test_size=0.20,
    random_state=42
)


train_df = df[
    df["unit_number"].isin(train_units)
].copy()


test_df = df[
    df["unit_number"].isin(test_units)
].copy()


X_train = train_df[feature_columns]
y_train = train_df["status"]

X_test = test_df[feature_columns]
y_test = test_df["status"]


print("\nTraining units:", len(train_units))
print("Testing units :", len(test_units))

print("Training rows :", len(train_df))
print("Testing rows  :", len(test_df))


# ============================================================
# 8. TRAIN EXTRA TREES CLASSIFIER
# ============================================================

print("\n")
print("=" * 65)
print("TRAINING EXTRA TREES STATUS CLASSIFIER")
print("=" * 65)


model = ExtraTreesClassifier(
    n_estimators=500,
    max_depth=None,
    min_samples_leaf=2,
    max_features=0.8,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


model.fit(
    X_train,
    y_train
)


print("Training completed!")


# ============================================================
# 9. MODEL EVALUATION
# ============================================================

predictions = model.predict(X_test)


accuracy = accuracy_score(
    y_test,
    predictions
)


print("\n")
print("=" * 65)
print("CLASSIFIER PERFORMANCE")
print("=" * 65)


print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        digits=3
    )
)


# ============================================================
# 10. CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

labels = [
    "READY",
    "WATCH",
    "CRITICAL"
]


matrix = confusion_matrix(
    y_test,
    predictions,
    labels=labels
)


print(
    pd.DataFrame(
        matrix,
        index=labels,
        columns=labels
    )
)


# ============================================================
# 11. RISK FUNCTION
# ============================================================

def get_risk(status):

    if status == "READY":
        return "Low"

    elif status == "WATCH":
        return "Medium"

    else:
        return "High"


# ============================================================
# 12. ACTION FUNCTION
# ============================================================

def get_action(status):

    if status == "READY":
        return "Continue operation"

    elif status == "WATCH":
        return "Schedule inspection"

    else:
        return "Immediate maintenance"


# ============================================================
# 13. CONFIDENCE-AWARE SAFETY RULE
# ============================================================

def apply_safety_rule(
    predicted_status,
    probabilities,
    classes
):

    # Highest probability
    confidence = max(probabilities)

    # Store original AI decision
    original_status = predicted_status

    # Default: no safety override
    safety_override = False

    # --------------------------------------------------------
    # Safety rule
    #
    # If AI says READY but confidence is below 60%,
    # classify as WATCH.
    #
    # Reason:
    # An uncertain READY decision should be reviewed
    # instead of allowing continued operation automatically.
    # --------------------------------------------------------

    if (
        predicted_status == "READY"
        and confidence < 0.60
    ):

        predicted_status = "WATCH"

        safety_override = True

    return (
        predicted_status,
        original_status,
        confidence,
        safety_override
    )


# ============================================================
# 14. TEST CASES
# ============================================================

test_targets = [
    80,
    30,
    10,
    5
]


print("\n")
print("=" * 65)
print("OPERATIONAL AI TEST CASES")
print("=" * 65)


for target_rul in test_targets:

    # --------------------------------------------------------
    # Find a real test record close to target RUL
    # --------------------------------------------------------

    index = (
        test_df["RUL"] - target_rul
    ).abs().idxmin()


    row = test_df.loc[index]


    # --------------------------------------------------------
    # Prepare input
    # --------------------------------------------------------

    input_data = row[
        feature_columns
    ].to_frame().T


    # --------------------------------------------------------
    # Raw AI prediction
    # --------------------------------------------------------

    raw_prediction = model.predict(
        input_data
    )[0]


    # --------------------------------------------------------
    # AI probabilities
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        input_data
    )[0]


    probability_dict = dict(
        zip(
            model.classes_,
            probabilities
        )
    )


    # --------------------------------------------------------
    # Apply safety rule
    # --------------------------------------------------------

    (
        predicted_status,
        original_status,
        confidence,
        safety_override
    ) = apply_safety_rule(
        raw_prediction,
        probabilities,
        model.classes_
    )


    # --------------------------------------------------------
    # Actual status
    # --------------------------------------------------------

    actual_status = row["status"]


    # --------------------------------------------------------
    # Risk and action
    # --------------------------------------------------------

    risk = get_risk(
        predicted_status
    )


    action = get_action(
        predicted_status
    )


    # --------------------------------------------------------
    # Display test case
    # --------------------------------------------------------

    print("\n")
    print("-" * 65)

    print(
        f"TEST CASE: Target RUL = {target_rul}"
    )

    print("-" * 65)


    print(
        f"Unit Number          : "
        f"{row['unit_number']}"
    )


    print(
        f"Cycle                : "
        f"{row['time_in_cycles']}"
    )


    print(
        f"Actual RUL           : "
        f"{row['RUL']:.2f}"
    )


    print(
        f"Actual Status        : "
        f"{actual_status}"
    )


    print(
        f"Original AI Status   : "
        f"{original_status}"
    )


    print(
        f"AI Confidence        : "
        f"{confidence * 100:.2f}%"
    )


    print(
        f"Final AI Status      : "
        f"{predicted_status}"
    )


    print(
        f"READY Probability    : "
        f"{probability_dict.get('READY', 0) * 100:.2f}%"
    )


    print(
        f"WATCH Probability    : "
        f"{probability_dict.get('WATCH', 0) * 100:.2f}%"
    )


    print(
        f"CRITICAL Probability: "
        f"{probability_dict.get('CRITICAL', 0) * 100:.2f}%"
    )


    if safety_override:

        print(
            "Safety Override      : "
            "YES - Low confidence READY "
            "changed to WATCH"
        )

    else:

        print(
            "Safety Override      : NO"
        )


    print(
        f"Risk                 : "
        f"{risk}"
    )


    print(
        f"Action               : "
        f"{action}"
    )


    # --------------------------------------------------------
    # Determine final test result
    # --------------------------------------------------------

    if predicted_status == actual_status:

        print(
            "TEST RESULT          : PASS"
        )

    else:

        print(
            "TEST RESULT          : CHECK"
        )


# ============================================================
# 15. SAVE FINAL CLASSIFIER
# ============================================================

classifier_data = {

    "model": model,

    "features": feature_columns,

    "status_rules": {

        "READY":
            "RUL > 40",

        "WATCH":
            "20 < RUL <= 40",

        "CRITICAL":
            "RUL <= 20"
    },

    "confidence_rule": {

        "threshold":
            0.60,

        "low_confidence_ready":
            "READY -> WATCH"
    }
}


joblib.dump(
    classifier_data,
    "ml/status_classifier.pkl"
)


# ============================================================
# 16. FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 65)
print("FINAL CLASSIFIER")
print("=" * 65)


print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


print(
    "Confidence threshold: 60%"
)


print(
    "Model saved to: "
    "ml/status_classifier.pkl"
)


print("\nTraining completed successfully! 🎉")