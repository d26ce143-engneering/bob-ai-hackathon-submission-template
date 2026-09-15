import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "public/train.csv"

df = pd.read_csv(DATA_PATH)

print("=" * 65)
print("DEGRADATION-AWARE RUL MODEL")
print("=" * 65)

print("Rows    :", len(df))
print("Columns :", len(df.columns))


# ============================================================
# 2. SORT BY MACHINE AND CYCLE
# ============================================================

df = df.sort_values(
    ["unit_number", "time_in_cycles"]
).reset_index(drop=True)


# ============================================================
# 3. SENSOR SELECTION
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
# 4. BASIC FEATURES
# ============================================================

feature_columns = [
    "time_in_cycles",
    "op_setting_1",
    "op_setting_2",
    "op_setting_3"
] + useful_sensors


# ============================================================
# 5. ROLLING / DEGRADATION FEATURES
# ============================================================

print("\nCreating degradation features...")

for sensor in useful_sensors:

    # 5-cycle rolling average
    df[f"{sensor}_mean5"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                5,
                min_periods=1
            ).mean()
        )
    )

    # 10-cycle rolling average
    df[f"{sensor}_mean10"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                10,
                min_periods=1
            ).mean()
        )
    )

    # 5-cycle standard deviation
    df[f"{sensor}_std5"] = (
        df.groupby("unit_number")[sensor]
        .transform(
            lambda x: x.rolling(
                5,
                min_periods=1
            ).std()
        )
    )

    # Change from previous cycle
    df[f"{sensor}_diff1"] = (
        df.groupby("unit_number")[sensor]
        .diff()
    )

    # Change over 5 cycles
    df[f"{sensor}_diff5"] = (
        df.groupby("unit_number")[sensor]
        .diff(5)
    )


trend_features = [
    col for col in df.columns
    if (
        col.endswith("_mean5")
        or col.endswith("_mean10")
        or col.endswith("_std5")
        or col.endswith("_diff1")
        or col.endswith("_diff5")
    )
]

feature_columns += trend_features

df[feature_columns] = (
    df[feature_columns]
    .replace([np.inf, -np.inf], np.nan)
    .fillna(0)
)

print("Total features:", len(feature_columns))


# ============================================================
# 6. CAP RUL
# ============================================================

RUL_CAP = 125

df["RUL_capped"] = df["RUL"].clip(
    upper=RUL_CAP
)


# ============================================================
# 7. SPLIT BY UNIT
# ============================================================

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
y_train = train_df["RUL_capped"]

X_test = test_df[feature_columns]
y_test = test_df["RUL_capped"]

print("\nTraining units:", len(train_units))
print("Testing units :", len(test_units))

print("Training rows :", len(train_df))
print("Testing rows  :", len(test_df))


# ============================================================
# 8. BASELINE EXTRA TREES
# ============================================================

print("\n")
print("=" * 65)
print("TRAINING DEGRADATION-AWARE EXTRA TREES")
print("=" * 65)

model = ExtraTreesRegressor(
    n_estimators=500,
    max_depth=None,
    min_samples_leaf=2,
    max_features=0.8,
    random_state=42,
    n_jobs=-1
)


# ============================================================
# 9. GIVE MORE IMPORTANCE TO MAINTENANCE REGION
# ============================================================

# The model receives greater weight for assets
# that are close to maintenance thresholds.

sample_weights = np.ones(len(y_train))

sample_weights[y_train <= 40] = 2.0
sample_weights[y_train <= 20] = 3.0
sample_weights[y_train <= 10] = 4.0

print("\nTraining with maintenance-region weighting...")

model.fit(
    X_train,
    y_train,
    sample_weight=sample_weights
)

print("Training completed!")


# ============================================================
# 10. EVALUATE MODEL
# ============================================================

predictions = model.predict(X_test)

predictions = np.clip(
    predictions,
    0,
    RUL_CAP
)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)


print("\n")
print("=" * 65)
print("NEW MODEL PERFORMANCE")
print("=" * 65)

print(f"MAE  : {mae:.2f} cycles")
print(f"RMSE : {rmse:.2f} cycles")
print(f"R²   : {r2:.2f}")


# ============================================================
# 11. COMPARE WITH OLD MODEL
# ============================================================

old_mae = 9.67
old_r2 = 0.88

print("\n")
print("=" * 65)
print("COMPARISON WITH PREVIOUS MODEL")
print("=" * 65)

print(f"Previous MAE : {old_mae:.2f}")
print(f"New MAE      : {mae:.2f}")

print(f"\nPrevious R²  : {old_r2:.2f}")
print(f"New R²       : {r2:.2f}")


if mae < old_mae and r2 >= old_r2:

    print("\n🏆 NEW MODEL IS BETTER")

elif mae < old_mae:

    print("\n✅ MAE IMPROVED")

elif r2 > old_r2:

    print("\n✅ R² IMPROVED")

else:

    print("\n⚠️ PREVIOUS MODEL IS BETTER")


# ============================================================
# 12. RISK CLASSIFICATION
# ============================================================

def get_status(rul):

    if rul > 40:
        return "READY"

    elif rul > 20:
        return "WATCH"

    else:
        return "CRITICAL"


def get_risk(rul):

    if rul > 40:
        return "Low"

    elif rul > 20:
        return "Medium"

    else:
        return "High"


def get_action(rul):

    if rul > 40:
        return "Continue operation"

    elif rul > 20:
        return "Schedule inspection"

    else:
        return "Immediate maintenance"


# ============================================================
# 13. AI TEST CASES
# ============================================================

test_targets = [80, 30, 10, 5]

print("\n")
print("=" * 65)
print("AI TEST CASES - NEW MODEL")
print("=" * 65)


for target_rul in test_targets:

    index = (
        test_df["RUL"] - target_rul
    ).abs().idxmin()

    row = test_df.loc[index]

    input_data = row[
        feature_columns
    ].to_frame().T

    predicted_rul = model.predict(
        input_data
    )[0]

    predicted_rul = np.clip(
        predicted_rul,
        0,
        RUL_CAP
    )

    actual_rul = row["RUL"]

    error = abs(
        actual_rul - predicted_rul
    )

    status = get_status(
        predicted_rul
    )

    risk = get_risk(
        predicted_rul
    )

    action = get_action(
        predicted_rul
    )

    print("\n" + "-" * 65)

    print(
        f"TEST CASE: Target RUL = {target_rul}"
    )

    print("-" * 65)

    print(
        f"Unit Number     : {row['unit_number']}"
    )

    print(
        f"Cycle           : {row['time_in_cycles']}"
    )

    print(
        f"Actual RUL      : {actual_rul:.2f}"
    )

    print(
        f"Predicted RUL   : {predicted_rul:.2f}"
    )

    print(
        f"Prediction Error: {error:.2f} cycles"
    )

    print(
        f"Status          : {status}"
    )

    print(
        f"Risk            : {risk}"
    )

    print(
        f"Action          : {action}"
    )


# ============================================================
# 14. SAVE MODEL
# ============================================================

model_data = {

    "model": model,

    "features": feature_columns,

    "rul_cap": RUL_CAP,

    "status_rules": {
        "ready": "> 40",
        "watch": "20 - 40",
        "critical": "<= 20"
    }
}


joblib.dump(
    model_data,
    "ml/best_rul_model.pkl"
)


print("\n")
print("=" * 65)
print("MODEL SAVED")
print("=" * 65)

print(
    "Saved to: ml/best_rul_model.pkl"
)

print("\nTraining completed successfully! 🎉")