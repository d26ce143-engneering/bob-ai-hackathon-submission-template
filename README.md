# 🚀 [Teach Titans]

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | [Teach Titans] |
| **Track** | [AI / React.js /Python(Flask AI API)  / SQL Lite] |
| **Team Lead** | [Solanki Dharma] — [d26ce@charusat.edu.in] |
| **Members** | [Patel Jeel], [Tala Vinit], [Majithiya Aditiya 3] |

---

## 🎯 Problem Statement

> In 2–3 sentences: Mission Readiness & Predictive Maintenance
Copilot?

Mission Readiness & Predictive Maintenance Copilot is an AI-powered dashboard that analyzes sensor and maintenance data to predict equipment health, Remaining Useful Life (RUL), and readiness status. It helps maintenance officers identify at-risk assets, prioritize maintenance, and take proactive actions before failures occur.

---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

Our solution is an AI-powered predictive maintenance dashboard that analyzes sensor and maintenance data to predict equipment health, RUL, and readiness status. It identifies at-risk assets, highlights potential component issues, and provides prioritized maintenance recommendations to prevent failures and improve mission readiness.

---

## ✨ Key Features

- **Feature 1:** AI-based Remaining Useful Life (RUL) prediction for equipment
- **Feature 2:** Ready, Watch, and Critical mission-readiness classification
- **Feature 3:** Component failure risk identification and explanation
- **Feature 4:**Prioritized maintenance planning and scheduling
- **Feature 5:** Maintenance records stored and managed using SQLite database

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, JavaScript (JSX) |
| **Frameworks** | React, Vite, Flask, Express.js |
| **IBM Technologies** | IBM Bob
| **Databases** | SQLite |
| **Other** | Scikit-learn, Pandas, NumPy, Joblib, Tailwind CSS, Recharts |

---

## 📁 Repository Structure

```
mission-readiness-copilot/
    ├── ml/
    │   ├── api.py
    │   ├── best_rul_model.pkl
    │   ├── status_classifier.pkl
    │   ├── status_classifier.py
    │   └── test_model.py
    │
    ├── public/
    │   └── train.csv
    │
    ├── server/
    │   ├── maintenance.db
    │   └── server.js
    │
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    │
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── vite.config.js
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── Screen Recording 2026-09-15 185851.video  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/d26ce143-engneering/bob-ai-hackathon-Teach-Titans.git
cd  bob-ai-hackathon-Teach-Titans

# 2. Install dependencies
npm install

# 3. Configure environment
pip install flask flask-cors pandas numpy scikit-learn joblib

# 4. Run the project
python ml/api.py

npm run server

npm run dev
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 🌐 Live Demo | https://youtu.be/-gx2aMFBHbA?si=cu2xsuhSPIZnq1_H |
| 🖼️ Screenshots | <img width="1920" height="1080" alt="Screenshot 2026-09-15 194137" src="https://github.com/user-attachments/assets/909c5679-b0e6-4c04-8e8c-ffef9e2753ef" />
 |<img width="1920" height="1080" alt="Screenshot 2026-09-15 194155" src="https://github.com/user-attachments/assets/5d0ac47e-4c3c-4ee2-8224-75d03e1356d8" />
<img width="1920" height="1080" alt="Screenshot 2026-09-15 194246" src="https://github.com/user-attachments/assets/baeeedcc-2508-4809-8586-fc670938bd03" />
<img width="1919" height="1079" alt="Screenshot 2026-09-15 160616" src="https://github.com/user-attachments/assets/d8b9b516-4faf-4e5d-a13b-84abb5f4f133" />
<img width="1919" height="1079" alt="Screenshot 2026-09-15 160625" src="https://github.com/user-attachments/assets/ba66e950-081e-4df3-a80b-21922e30add5" />

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- Component failure prediction is currently rule-based/associated with asset risk, rather than a separately trained component-level ML model.
- Asset and maintenance data are prototype/demo data and are not connected to real military equipment systems.
- The ML models are proof-of-concept models trained on the provided sensor dataset and would require more real-world data and validation for production deployment.

---

## 🏅 What We're Most Proud Of
We are most proud of turning raw sensor data into actionable maintenance decisions. Our system combines RUL prediction, readiness classification, risk identification, and maintenance scheduling in one dashboard, helping maintenance officers move from reactive maintenance to proactive, data-driven decisions.

---
