from flask import Flask, jsonify, request
from flask_cors import CORS

import pandas as pd
import numpy as np
import joblib


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# LOAD DATA
# ============================================================

DATA_PATH = "public/train.csv"

df = pd.read_csv(DATA_PATH)

df = df.sort_values(
    ["unit_number", "time_in_cycles"]
).reset_index(drop=True)


# ============================================================
# LOAD RUL MODEL
# ============================================================

rul_data = joblib.load(
    "ml/best_rul_model.pkl"
)

rul_model = rul_data["model"]
rul_features = rul_data["features"]
rul_cap = rul_data["rul_cap"]


# ============================================================
# LOAD STATUS CLASSIFIER
# ============================================================

status_data = joblib.load(
    "ml/status_classifier.pkl"
)

status_model = status_data["model"]
status_features = status_data["features"]


# ============================================================
# SENSOR COLUMNS
# ============================================================

sensor_columns = [
    col
    for col in df.columns
    if col.startswith("sensor_")
]


variance = df[sensor_columns].var()

useful_sensors = variance[
    variance > 0.001
].index.tolist()


# ============================================================
# CREATE FEATURES
# ============================================================

def create_features(unit_number, cycle=None):

    unit_df = df[
        df["unit_number"] == unit_number
    ].copy()

    if unit_df.empty:
        return None, None


    # If no cycle supplied, use a demonstration
    # "current" point around 80% of the unit lifecycle.
    if cycle is None:

        position = int(
            len(unit_df) * 0.80
        )

        position = min(
            position,
            len(unit_df) - 1
        )

        selected_index = unit_df.index[position]

    else:

        differences = (
            unit_df["time_in_cycles"] - cycle
        ).abs()

        selected_index = differences.idxmin()


    # --------------------------------------------------------
    # Create trend features on the complete unit history
    # --------------------------------------------------------

    for sensor in useful_sensors:

        unit_df[f"{sensor}_mean5"] = (
            unit_df[sensor]
            .rolling(
                5,
                min_periods=1
            )
            .mean()
        )

        unit_df[f"{sensor}_mean10"] = (
            unit_df[sensor]
            .rolling(
                10,
                min_periods=1
            )
            .mean()
        )

        unit_df[f"{sensor}_std5"] = (
            unit_df[sensor]
            .rolling(
                5,
                min_periods=1
            )
            .std()
        )

        unit_df[f"{sensor}_diff1"] = (
            unit_df[sensor].diff()
        )

        unit_df[f"{sensor}_diff5"] = (
            unit_df[sensor].diff(5)
        )


    # --------------------------------------------------------
    # Clean values
    # --------------------------------------------------------

    unit_df = (
        unit_df
        .replace(
            [np.inf, -np.inf],
            np.nan
        )
        .fillna(0)
    )


    # --------------------------------------------------------
    # Selected row
    # --------------------------------------------------------

    selected_row = unit_df.loc[
        selected_index
    ]


    # --------------------------------------------------------
    # RUL input
    # --------------------------------------------------------

    rul_input = selected_row[
        rul_features
    ].to_frame().T


    # --------------------------------------------------------
    # Status input
    # --------------------------------------------------------

    status_input = selected_row[
        status_features
    ].to_frame().T


    return (
        selected_row,
        rul_input,
        status_input
    )


# ============================================================
# STATUS FUNCTIONS
# ============================================================

def get_risk(status):

    if status == "READY":
        return "Low"

    if status == "WATCH":
        return "Medium"

    return "High"


def get_action(status):

    if status == "READY":
        return "Continue operation"

    if status == "WATCH":
        return "Schedule inspection"

    return "Immediate maintenance"


# ============================================================
# AI PREDICTION ENDPOINT
# ============================================================

@app.route(
    "/predict",
    methods=["GET"]
)
def predict():

    try:

        # ----------------------------------------------------
        # Get unit
        # ----------------------------------------------------

        unit_number = request.args.get(
            "unit",
            default=1,
            type=int
        )


        # ----------------------------------------------------
        # Optional cycle
        # ----------------------------------------------------

        cycle = request.args.get(
            "cycle",
            default=None,
            type=int
        )


        # ----------------------------------------------------
        # Create model features
        # ----------------------------------------------------

        result = create_features(
            unit_number,
            cycle
        )


        if result[0] is None:

            return jsonify({
                "success": False,
                "error": "Unit not found"
            }), 404


        selected_row = result[0]
        rul_input = result[1]
        status_input = result[2]


        # ====================================================
        # RUL PREDICTION
        # ====================================================

        predicted_rul = rul_model.predict(
            rul_input
        )[0]


        predicted_rul = float(
            np.clip(
                predicted_rul,
                0,
                rul_cap
            )
        )


        actual_rul = float(
            selected_row["RUL"]
        )


        # ====================================================
        # STATUS PREDICTION
        # ====================================================

        raw_status = status_model.predict(
            status_input
        )[0]


        probabilities = (
            status_model
            .predict_proba(status_input)[0]
        )


        probability_dict = dict(
            zip(
                status_model.classes_,
                probabilities
            )
        )


        confidence = float(
            max(probabilities)
        )


        original_status = raw_status


        # ====================================================
        # SAFETY RULE
        # ====================================================

        safety_override = False


        if (
            raw_status == "READY"
            and confidence < 0.60
        ):

            final_status = "WATCH"

            safety_override = True

        else:

            final_status = raw_status


        # ====================================================
        # RISK / ACTION
        # ====================================================

        risk = get_risk(
            final_status
        )

        action = get_action(
            final_status
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "unit_number": int(
                selected_row["unit_number"]
            ),

            "cycle": int(
                selected_row["time_in_cycles"]
            ),

            "actual_rul": actual_rul,

            "predicted_rul": round(
                predicted_rul,
                2
            ),

            "original_status":
                original_status,

            "final_status":
                final_status,

            "confidence":
                round(
                    confidence * 100,
                    2
                ),

            "probabilities": {

                "READY":
                    round(
                        probability_dict.get(
                            "READY",
                            0
                        ) * 100,
                        2
                    ),

                "WATCH":
                    round(
                        probability_dict.get(
                            "WATCH",
                            0
                        ) * 100,
                        2
                    ),

                "CRITICAL":
                    round(
                        probability_dict.get(
                            "CRITICAL",
                            0
                        ) * 100,
                        2
                    )
            },

            "safety_override":
                safety_override,

            "risk":
                risk,

            "action":
                action

        })


    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        return jsonify({

            "success": False,

            "error": str(error)

        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "AI API running",

        "rul_model": "loaded",

        "status_model": "loaded",

        "dataset_rows": len(df)

    })


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("=" * 55)
    print("MISSION READINESS AI API")
    print("=" * 55)

    print(
        "Dataset rows:",
        len(df)
    )

    print(
        "RUL model: loaded"
    )

    print(
        "Status classifier: loaded"
    )

    print(
        "AI API running at:"
    )

    print(
        "http://localhost:8000"
    )

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )