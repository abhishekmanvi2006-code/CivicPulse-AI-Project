# CivicPulse AI — 5-Minute Hackathon Demo Script

> **Goal:** Demonstrate the complete end-to-end flow from citizen grievance submission to AI triage, spatial hotspot detection, municipal action, and real-time citizen tracking.

---

## ⏱️ Timeline Overview

| Time | Stage | Action / Highlight |
|---|---|---|
| **0:00 – 0:45** | **Introduction & Overview** | Introduce problem, 4 stages, and live AI engine status badge. |
| **0:45 – 1:45** | **Stage 1: Capture** | Submit a critical safety complaint using 1-click preset. Show instant AI analysis card. |
| **1:45 – 2:30** | **Stage 2: Understand** | Submit a duplicate waterlogging complaint. Demonstrate auto-merge, distance check, and priority escalation without deleting reports. |
| **2:30 – 3:30** | **Stage 3: Reveal** | Open Authority Dashboard. Show Leaflet map with priority-colored markers and size scaling by duplicates. Generate a 1-minute Action Brief. |
| **3:30 – 4:30** | **Stage 4: Act** | Open incident detail modal. Review transparent "Why this priority?" factor breakdown. Assign department, change status to In Progress / Resolved. |
| **4:30 – 5:00** | **Citizen Tracking & Honesty** | Open Citizen Tracking portal with the Tracking ID; show real-time synchronization. Briefly highlight the About & Limitations disclosure. |

---

## 🎬 Step-by-Step Walkthrough

### Part 1: Introduction & App Setup (0:00 – 0:45)
1. Open the browser at **`http://localhost:5173`**.
2. **Key Talking Points:**
   - *"Urban civic issues are messy, emotional, and repetitive. Traditional municipal portals are black holes where complaints vanish."*
   - *"CivicPulse transforms scattered complaints into prioritized, explainable, trackable action across 4 stages: Capture, Understand, Reveal, and Act."*
   - Point out the status badge in the navbar: **`Gemini 2.5`** (if API key is in `.env`) or **`Rule-Based Fallback`** (working 100% offline).
   - Point out the **`Mocked`** tags for simulated facilities and authentication.

---

### Part 2: Stage 1 — Citizen Capture (0:45 – 1:45)
1. Click **`Report Issue`** in the navigation bar.
2. Under **"Quick 1-Click Demo Scenarios"**, click **`Open Manhole (Critical Safety)`**.
   - Notice the form auto-fills: *"Uncovered sewer manhole on school road right where children walk. Extreme falling danger."*
   - Notice the Leaflet map automatically centers on coordinates `(12.9756, 77.6416)` adjacent to National Public School.
   - Leave Category as **`✨ Let AI decide`**.
3. Click the **`Submit Complaint`** button.
4. **Observe the Confirmation Screen:**
   - Instant **Tracking ID** generated (e.g., `CP-2026-9812`).
   - AI categorized the report as **Drainage** with high confidence.
   - Assigned **`CRITICAL`** priority ($85+/100$) due to safety keywords and school zone proximity.
   - Click **`Copy Tracking ID`**.

---

### Part 3: Stage 2 — Understand & Duplicate Detection (1:45 – 2:30)
1. Click **`Report Issue`** again.
2. Click the preset **`Flooded Street (Waterlogging Duplicate)`**.
   - Text: *"Waterlogging near shops on 12th Main Road, standing rain water blocking pedestrians and vehicles."*
3. Click **`Submit Complaint`**.
4. **Observe the Duplicate Detection Alert:**
   - A distinct banner notifies: **`Corroborated Issue (Duplicate Detected)`**.
   - Explains that the AI geo-pipeline linked this complaint to parent ticket `CP-2026-0002` located $<80\text{m}$ away with high cosine text similarity.
   - Clarify for the judges: *"We do not delete duplicates. Instead, every duplicate report escalates the community weight multiplier of the primary ticket."*

---

### Part 4: Stage 3 — Reveal (Authority Dashboard & Action Brief) (2:30 – 3:30)
1. Click **`Authority Dashboard`** in the navigation.
2. Review the **Executive KPI Cards**:
   - Total Reports, Critical Open issues, Duplicates Merged, and Average Resolution Time.
3. Review the **Interactive Priority Map**:
   - Markers colored by priority: **Red** (Critical), **Orange** (High), **Amber** (Medium), **Green** (Low).
   - Marker size dynamically enlarges where multiple duplicates corroborate an issue.
   - Toggle **`Sensitive Zones (Mocked)`** to see the radius circles for St. Mary Hospital and National Public School.
4. Review the **Detected Hotspots Panel**:
   - Show how spatial clustering identified `HOTSPOT-1` around 4th Cross & 12th Main.
   - Read the AI Root Cause Insight: *"Likely root cause: Blocked storm drain choke-point causing road submergence and pavement degradation."*
5. Click **`Generate Today's Top 5 Action Brief`**:
   - The **Executive AI Action Brief** modal appears.
   - Shows: **What is happening**, **Why it matters**, **Recommended action**, **Suggested department**, and **Urgency**.
   - Emphasize: *"Readable by municipal commissioners in under 1 minute."* Close the modal.

---

### Part 5: Stage 4 — Act (Workflow & Transparent Explainability) (3:30 – 4:30)
1. In the **Priority Triage Queue** table, click the first row (the highest score critical complaint).
2. The **Report Detail Modal** opens:
   - Point to the **"Explainable Priority Breakdown"**:
     - $+35$ Public Safety Risk (uncovered manhole)
     - $+18$ School Zone Proximity (Mocked)
     - $+17$ Category Baseline
     - $+16$ Community Multiplier
   - Explain: *"This is calculated from a transparent deterministic formula, not hallucinated by an LLM."*
3. In the **Authority Action Panel**:
   - Change Status from `SUBMITTED` to **`IN_PROGRESS`**.
   - Set Department to **`Drainage`**.
   - Enter Assigned Officer: **`Rapid Response Unit Alpha`**.
   - Add Note: *"Safety barricade erected; permanent ductile iron cover on site."*
   - Click **`Save & Broadcast Update`**.
   - Notice the new timestamped event immediately logged in the **Audit Timeline**.

---

### Part 6: Citizen Tracking & Ethics Disclosure (4:30 – 5:00)
1. Click **`Track Report`** in the navigation.
2. Paste or enter the Tracking ID from Part 2.
3. Show the **5-step Resolution Stepper**:
   - Status has updated to **`In Progress`**.
   - Assigned Department shows **`Drainage`**.
   - The official update note from the authority is visible to the citizen in real-time.
4. Click **`About & Limitations`**:
   - Show the transparency disclosure separating what is real (SQLite, Leaflet, AI pipeline, duplicate engine) from what is mocked (department dispatch, sensitive coordinates, authentication).
5. Point out the **`Reset Demo`** button that resets all 45 realistic synthetic cases anytime.

---

## 🏆 Summary Checklist for Judges
- [x] **Capture:** Mobile-first, draggable pin, GPS, category selector + "Let AI decide", optional photo preview.
- [x] **Understand:** 20-word summary, category confidence, TF-IDF + geo duplicate detection, transparent priority formula.
- [x] **Reveal:** Authority map colored by priority, hotspot spatial clustering, root-cause deductions, 1-minute Action Briefs.
- [x] **Act:** Multi-department routing, status workflow, resolution verification, real-time citizen tracking portal.
- [x] **Honesty:** All mocked components explicitly labelled with `Mocked` badges.
- [x] **Fallback:** Dual-mode AI (Gemini 2.5 Flash + 100% offline rule-based fallback).
