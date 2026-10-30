# CivicPulse AI — System Limitations & Honesty Disclosure

This document outlines the operational boundaries, mocked vs. functional components, failure modes, and engineering roadmap for **CivicPulse AI**.

---

## 1. What is Real (Functional & Verifiable)

1. **Persistent Local Database (SQLite via `sql.js`):**
   - All reports, spatial coordinates, duplicate links, department assignments, and timestamped timeline events persist to `backend/civicpulse.db`.
2. **Interactive Mapping (Leaflet & OpenStreetMap):**
   - Renders live markers dynamically color-coded by priority (Red = Critical, Orange = High, Yellow = Medium, Green = Low).
   - Marker sizes dynamically scale proportionally to duplicate corroboration counts ($22\text{px} \rightarrow 38\text{px}$).
3. **Dual AI Pipeline (Gemini 2.5 Flash + Rule-Based Fallback):**
   - Natural language categorization and 20-word executive summarization using `@google/genai` (model: `gemini-2.5-flash`).
   - 100% offline fallback using keyword frequency, token weighting, and TF-IDF cosine similarity.
4. **Deterministic & Explainable Priority Engine:**
   - Priority points (0–100) are computed mathematically from 5 transparent factors. The "Why this priority?" panel displays the actual arithmetic point contributions ($+35, +18, +20$) rather than LLM-hallucinated explanations.
5. **Spatial Hotspot Clustering:**
   - Radius clustering within 260m identifies geographic clusters and computes root-cause hypotheses from category combinations.
6. **Executive Action Brief Generation:**
   - 1-minute briefs for single complaints, clusters, or Today's Top 5 priorities.
7. **Citizen Tracking Portal:**
   - Real-time 5-stage stepper (`Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`), mirroring authority updates.

---

## 2. What is Mocked (Labelled as "Mocked" in Code and UI)

1. **Sensitive Facility Locations (Mocked):**
   - `St. Mary Emergency Care & Hospital`, `National Public Model School`, and `100ft Metro Arterial Expressway` are simulated geographical centroids used to demonstrate proximity scoring without tapping real municipal cadastral databases.
2. **Municipal Role-Based Access Control (Mocked):**
   - The toggle between "Citizen View" and "Authority View" in the navigation bar is a simulated client-side switch for demo evaluation; no real OAuth/SSO or municipal LDAP credentials are required.
3. **Department Dispatch & Field Teams (Mocked):**
   - Assigning tickets to `Roads`, `Sanitation`, `Electrical`, `Water Works`, or `Drainage` updates local database state rather than dispatching actual physical municipal utility vehicles.
4. **SMS / WhatsApp Gateway Notifications (Mocked):**
   - Citizen phone numbers and simulated SMS dispatches are mock inputs for demonstrating tracking linkage.
5. **Synthetic Citizen Identities (Mocked):**
   - The 45 initial seed reports represent realistic synthetic grievances situated in a sample metropolitan sector (Lat: 12.9780, Lng: 77.6400).

---

## 3. Where the AI Can Be Wrong (Failure Modes & Edge Cases)

1. **Colloquial Slang, Sarcasm & Metaphors:**
   - Sarcastic reports (e.g., *"Thanks for the new municipal swimming pool on 5th avenue!"*) can mislead keyword extractors if Gemini API is disabled or rate-limited.
2. **Vague or Low-Context Descriptions:**
   - Submissions containing only 1–2 ambiguous words (e.g., *"broken"* or *"fix this"*) may default to baseline confidence scores and receive conservative priority weights until inspected.
3. **GPS Drift & Boundary Edge Cases:**
   - A mobile GPS report with 30m accuracy variance might land just outside the 250m sensitivity radius of a school, missing the proximity bonus.
4. **Duplicate False Positives on Arterial Corridors:**
   - Two distinct potholes located 80 meters apart on the same major avenue may be misidentified as duplicates if descriptions are generic (e.g., *"Huge pothole on main road"*).
5. **Adversarial / Spam Inputs:**
   - Without rate-limiting or CAPTCHA, automated bots could artificially inflate duplicate counts to manipulate priority rankings.

---

## 4. Next Steps for City Production Deployment

1. **Official Municipal GIS Integration:**
   - Connect directly with municipal ArcIMS/QGIS spatial layers for true property boundaries, stormwater conduits, and electric substations.
2. **Multi-Channel Citizen Intake:**
   - Deploy an automated WhatsApp Business Bot and IVR phone hotline allowing citizens to submit audio voice notes and GPS pins directly.
3. **Geo-Fenced Field Worker PWA:**
   - Equip municipal repair crews with an offline-first PWA requiring timestamped, geo-verified "after" photos before marked tickets can be marked as `RESOLVED`.
4. **Automated SLA Escalation Matrix:**
   - Implement background cron triggers that automatically escalate `CRITICAL` safety issues directly to the Ward Councillor's dashboard if unassigned after 4 hours.
