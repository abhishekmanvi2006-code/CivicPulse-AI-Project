const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_key_here')) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey: apiKey.trim() });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Geo & Math Utilities
// -----------------------------------------------------------------------------
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// -----------------------------------------------------------------------------
// TF-IDF & Text Cosine Similarity
// -----------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are',
  'was', 'were', 'it', 'this', 'that', 'there', 'here', 'near', 'by', 'with', 'from',
  'very', 'too', 'please', 'help', 'our', 'my', 'we', 'they', 'issue', 'problem'
]);

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateCosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;

  const freqA = {};
  const freqB = {};
  const allWords = new Set([...tokensA, ...tokensB]);

  for (const t of tokensA) freqA[t] = (freqA[t] || 0) + 1;
  for (const t of tokensB) freqB[t] = (freqB[t] || 0) + 1;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const word of allWords) {
    const a = freqA[word] || 0;
    const b = freqB[word] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return Number((dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))).toFixed(2));
}

// -----------------------------------------------------------------------------
// Rule-Based Categorization & Summarization
// -----------------------------------------------------------------------------
const CATEGORY_KEYWORDS = {
  'Waterlogging': ['waterlogging', 'flooding', 'rain water', 'submerged', 'water accumulation', 'waterlogged', 'knee deep', 'stagnant water'],
  'Drainage': ['drain', 'drainage', 'gutter', 'sewage', 'clogged', 'blocked drain', 'overflowing drain', 'sludge', 'manhole overflow', 'stench'],
  'Road Damage': ['pothole', 'potholes', 'crater', 'broken road', 'caved in', 'damaged asphalt', 'tar road', 'speed breaker', 'cracked road', 'uneven surface'],
  'Streetlight': ['streetlight', 'street light', 'lamp post', 'dark street', 'no light', 'broken bulb', 'flickering light', 'wire hanging', 'electricity pole'],
  'Garbage': ['garbage', 'trash', 'waste', 'dump', 'overflowing bin', 'debris', 'rubbish', 'litter', 'smell', 'uncollected'],
  'Water Supply': ['water pipe', 'pipeline', 'pipe burst', 'drinking water', 'no water supply', 'contaminated water', 'leakage', 'low pressure']
};

function ruleBasedCategorize(text) {
  const lower = (text || '').toLowerCase();
  let bestCat = 'Other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) matchCount += 1;
    }
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestCat = cat;
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.70 + (bestScore * 0.08), 0.98) : 0.55;
  return { category: bestCat, confidence: Number(confidence.toFixed(2)) };
}

function ruleBasedSummary(text, category) {
  if (!text) return 'Civic report pending review.';
  const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
  let base = sentences[0] || text;
  const words = base.split(/\s+/);
  if (words.length <= 18) {
    return base;
  }
  return words.slice(0, 16).join(' ') + '...';
}

// -----------------------------------------------------------------------------
// Priority Scoring & Transparent Explainability Formula
// -----------------------------------------------------------------------------
function calculatePriorityScore({
  description,
  category,
  duplicateCount = 1,
  latitude,
  longitude,
  sensitiveLocations = [],
  createdAt = new Date().toISOString()
}) {
  const text = (description || '').toLowerCase();
  const factors = [];
  let totalScore = 0;

  // 1. Safety Risk (0 - 35 points)
  let safetyPoints = 0;
  let safetyReason = 'Routine maintenance requirement with normal public risk';
  if (text.includes('open manhole') || text.includes('uncovered manhole') || text.includes('deep hole')) {
    safetyPoints = 35;
    safetyReason = 'Uncovered manhole creates extreme risk of falling injuries or fatal vehicle entrapment';
  } else if (text.includes('live wire') || text.includes('exposed wire') || text.includes('sparking') || text.includes('electric shock')) {
    safetyPoints = 35;
    safetyReason = 'Exposed live electrical wiring presents immediate electrocution hazard';
  } else if (text.includes('deep crater') || text.includes('caved in') || text.includes('accident') || text.includes('bike skidded')) {
    safetyPoints = 28;
    safetyReason = 'Severe road surface failure causing active vehicle accidents and two-wheeler skids';
  } else if (text.includes('severe flooding') || text.includes('water inside homes') || text.includes('knee deep')) {
    safetyPoints = 25;
    safetyReason = 'Substantial water accumulation impeding emergency access and pedestrian safety';
  } else if (text.includes('dark') || text.includes('unsafe') || text.includes('women safety') || text.includes('crime')) {
    safetyPoints = 20;
    safetyReason = 'Zero illumination at night elevating transit vulnerability and public safety hazard';
  } else if (text.includes('stench') || text.includes('mosquito') || text.includes('health hazard') || text.includes('disease')) {
    safetyPoints = 16;
    safetyReason = 'Bio-waste and stagnant water multiplying mosquito breeding and local disease risk';
  } else {
    safetyPoints = 8;
  }
  totalScore += safetyPoints;
  factors.push({
    factor: 'Public Safety Risk',
    points: safetyPoints,
    explanation: safetyReason
  });

  // 2. Category Baseline Severity (0 - 20 points)
  const categoryBaseScores = {
    'Waterlogging': 18,
    'Drainage': 17,
    'Road Damage': 16,
    'Streetlight': 14,
    'Water Supply': 15,
    'Garbage': 12,
    'Other': 8
  };
  const catPoints = categoryBaseScores[category] || 10;
  totalScore += catPoints;
  factors.push({
    factor: 'Category Baseline Impact',
    points: catPoints,
    explanation: `Baseline infrastructural disruption weight assigned to ${category || 'Civic'} hazards`
  });

  // 3. Duplicate Count / Public Multiplier (0 - 20 points)
  let dupPoints = 4;
  let dupReason = 'Single citizen report logged';
  if (duplicateCount >= 5) {
    dupPoints = 20;
    dupReason = `Corroborated by ${duplicateCount} citizen reports indicating widespread community impact`;
  } else if (duplicateCount >= 3) {
    dupPoints = 16;
    dupReason = `Multiple citizen reports (${duplicateCount}) confirm escalating neighborhood impact`;
  } else if (duplicateCount >= 2) {
    dupPoints = 11;
    dupReason = `2 linked citizen reports indicate shared concern across residents`;
  }
  totalScore += dupPoints;
  factors.push({
    factor: 'Public Multiplier (Duplicate Reports)',
    points: dupPoints,
    explanation: dupReason
  });

  // 4. Sensitive Zone Proximity (0 - 20 points) [Mocked]
  let sensitivePoints = 0;
  let sensitiveReason = 'Located in standard residential/commercial sector';
  if (latitude && longitude && Array.isArray(sensitiveLocations) && sensitiveLocations.length) {
    for (const loc of sensitiveLocations) {
      const dist = haversineDistanceMeters(latitude, longitude, loc.latitude, loc.longitude);
      const effectiveRadius = loc.radius_meters || 250;
      if (dist <= effectiveRadius) {
        if (loc.type === 'Hospital') {
          sensitivePoints = Math.max(sensitivePoints, 20);
          sensitiveReason = `Within ${Math.round(dist)}m of ${loc.name} emergency corridor (Mocked)`;
        } else if (loc.type === 'School') {
          sensitivePoints = Math.max(sensitivePoints, 18);
          sensitiveReason = `Adjacent to ${loc.name} student transit zone (${Math.round(dist)}m) (Mocked)`;
        } else if (loc.type === 'Main Arterial Road') {
          sensitivePoints = Math.max(sensitivePoints, 15);
          sensitiveReason = `Directly affecting ${loc.name} heavy transit corridor (${Math.round(dist)}m) (Mocked)`;
        }
      }
    }
  }
  totalScore += sensitivePoints;
  factors.push({
    factor: 'Sensitive Location Proximity (Mocked)',
    points: sensitivePoints,
    explanation: sensitiveReason
  });

  // 5. Age / Escalation Factor (0 - 10 points)
  let agePoints = 2;
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursOld > 72) {
    agePoints = 10;
  } else if (hoursOld > 48) {
    agePoints = 7;
  } else if (hoursOld > 24) {
    agePoints = 5;
  }
  totalScore += agePoints;
  factors.push({
    factor: 'Age & Latency Escalation',
    points: agePoints,
    explanation: hoursOld > 24 ? `Report has remained unresolved for ${Math.round(hoursOld)}h` : 'Recently filed complaint'
  });

  // Clamp 0 - 100
  totalScore = Math.min(Math.max(totalScore, 5), 100);

  let priorityBand = 'LOW';
  if (totalScore >= 75) priorityBand = 'CRITICAL';
  else if (totalScore >= 55) priorityBand = 'HIGH';
  else if (totalScore >= 35) priorityBand = 'MEDIUM';

  return {
    priority: priorityBand,
    priorityScore: totalScore,
    factors
  };
}

// -----------------------------------------------------------------------------
// Duplicate Matching Engine
// -----------------------------------------------------------------------------
function findPotentialDuplicate(newReport, existingReports, maxDistanceMeters = 160) {
  if (!existingReports || !existingReports.length) return null;

  for (const existing of existingReports) {
    // Only compare against active parents (not already marked duplicate)
    if (existing.parent_id) continue;
    if (existing.id === newReport.id) continue;

    const dist = haversineDistanceMeters(
      newReport.latitude, newReport.longitude,
      existing.latitude, existing.longitude
    );

    if (dist <= maxDistanceMeters) {
      // Check category match or category compatibility
      const catMatch = (existing.category === newReport.category) ||
        (existing.category === 'Drainage' && newReport.category === 'Waterlogging') ||
        (existing.category === 'Waterlogging' && newReport.category === 'Drainage');

      const sim = calculateCosineSimilarity(newReport.description, existing.description);

      // Duplicate match condition: close geo-distance AND (high text similarity OR same category with moderate similarity)
      if ((sim >= 0.35 && dist <= maxDistanceMeters) || (catMatch && dist <= 80 && sim >= 0.22) || (sim >= 0.65 && dist <= 200)) {
        return {
          parentReport: existing,
          similarityScore: sim,
          distanceMeters: Math.round(dist)
        };
      }
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Hotspot / Cluster Engine
// -----------------------------------------------------------------------------
function detectHotspots(complaints, clusterRadiusMeters = 260) {
  // Simple spatial clustering for complaints within radius
  const visited = new Set();
  const clusters = [];

  const activeReports = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED');

  for (let i = 0; i < activeReports.length; i++) {
    if (visited.has(activeReports[i].id)) continue;

    const cluster = [activeReports[i]];
    visited.add(activeReports[i].id);

    for (let j = 0; j < activeReports.length; j++) {
      if (i === j || visited.has(activeReports[j].id)) continue;
      const d = haversineDistanceMeters(
        activeReports[i].latitude, activeReports[i].longitude,
        activeReports[j].latitude, activeReports[j].longitude
      );
      if (d <= clusterRadiusMeters) {
        cluster.push(activeReports[j]);
        visited.add(activeReports[j].id);
      }
    }

    if (cluster.length >= 2) {
      clusters.push(cluster);
    }
  }

  // Format clusters
  return clusters.map((items, idx) => {
    const avgLat = items.reduce((sum, r) => sum + r.latitude, 0) / items.length;
    const avgLng = items.reduce((sum, r) => sum + r.longitude, 0) / items.length;

    // Category breakdown
    const catCounts = {};
    for (const r of items) {
      catCounts[r.category] = (catCounts[r.category] || 0) + 1;
    }

    // Top categories
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const dominantCat = sortedCats[0] ? sortedCats[0][0] : 'General';

    // Total affected count including duplicates
    const totalReports = items.reduce((sum, r) => sum + (r.duplicate_count || 1), 0);

    // AI Root Cause deduction (Rule-based or Gemini)
    let rootCause = `Accumulation of ${totalReports} reports in ${items[0].address || 'neighborhood'}.`;
    if (catCounts['Drainage'] && catCounts['Waterlogging']) {
      rootCause = 'Likely root cause: Blocked storm drain choke-point causing road submergence and pavement degradation.';
    } else if (catCounts['Road Damage'] && items.length >= 3) {
      rootCause = 'Likely root cause: Heavy commercial vehicle transit coupled with water seepage causing recurring asphalt collapse.';
    } else if (catCounts['Garbage'] && catCounts['Drainage']) {
      rootCause = 'Likely root cause: Unregulated solid waste dumping spilling into open drainage channels.';
    } else if (catCounts['Streetlight'] && items.length >= 2) {
      rootCause = 'Likely root cause: Localized feeder line fault or water ingress into subterranean distribution box.';
    }

    return {
      clusterId: `HOTSPOT-${idx + 1}`,
      center: { latitude: Number(avgLat.toFixed(5)), longitude: Number(avgLng.toFixed(5)) },
      areaName: items[0].address || `Zone ${idx + 1}`,
      reportCount: items.length,
      totalComplaintsRepresented: totalReports,
      categoryMix: catCounts,
      dominantCategory: dominantCat,
      rootCauseInsight: rootCause,
      reports: items.map(r => ({
        id: r.id,
        tracking_id: r.tracking_id,
        category: r.category,
        priority: r.priority,
        priority_score: r.priority_score,
        summary: r.summary,
        status: r.status
      }))
    };
  }).sort((a, b) => b.totalComplaintsRepresented - a.totalComplaintsRepresented);
}

// -----------------------------------------------------------------------------
// Gemini API Orchestrator (with Rule-Based Fallback)
// -----------------------------------------------------------------------------
async function analyzeComplaintWithAI({ description, userCategory, imageBase64, sensitiveLocations = [], latitude, longitude }) {
  const gemini = getGeminiClient();
  const ruleCat = ruleBasedCategorize(description);
  const selectedCategory = (userCategory && userCategory !== 'Let AI decide') ? userCategory : ruleCat.category;
  const ruleSum = ruleBasedSummary(description, selectedCategory);

  if (!gemini) {
    const priorityAnalysis = calculatePriorityScore({
      description,
      category: selectedCategory,
      latitude,
      longitude,
      sensitiveLocations
    });

    return {
      category: selectedCategory,
      category_confidence: ruleCat.confidence,
      summary: ruleSum,
      priority: priorityAnalysis.priority,
      priority_score: priorityAnalysis.priorityScore,
      priority_factors: priorityAnalysis.factors,
      ai_source: 'rule_based'
    };
  }

  // Attempt Gemini API Call
  try {
    const prompt = `You are an AI Civic Analyst for city infrastructure. Analyze this citizen complaint:
"${description}"
User selected category: "${userCategory || 'None'}"

Allowed Categories: Waterlogging, Road Damage, Garbage, Streetlight, Drainage, Water Supply, Other.

Respond in strict JSON with:
{
  "category": "<one of the allowed categories>",
  "category_confidence": <number 0.0 to 1.0>,
  "summary": "<one sentence summary, max 20 words>",
  "safety_assessment": "<brief explanation of public risk>"
}`;

    const modelName = DEFAULT_MODEL;
    const response = await gemini.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text.trim());
    const finalCategory = (userCategory && userCategory !== 'Let AI decide')
      ? userCategory
      : (parsed.category || selectedCategory);

    const priorityAnalysis = calculatePriorityScore({
      description,
      category: finalCategory,
      latitude,
      longitude,
      sensitiveLocations
    });

    // If Gemini provided a safety assessment, enhance the safety factor explanation
    if (parsed.safety_assessment && priorityAnalysis.factors[0]) {
      priorityAnalysis.factors[0].explanation += ` (Gemini: ${parsed.safety_assessment})`;
    }

    return {
      category: finalCategory,
      category_confidence: Number((parsed.category_confidence || 0.95).toFixed(2)),
      summary: parsed.summary || ruleSum,
      priority: priorityAnalysis.priority,
      priority_score: priorityAnalysis.priorityScore,
      priority_factors: priorityAnalysis.factors,
      ai_source: 'gemini'
    };
  } catch (err) {
    console.warn(`Gemini API call failed (${err.message}), falling back to Rule-based engine.`);
    const priorityAnalysis = calculatePriorityScore({
      description,
      category: selectedCategory,
      latitude,
      longitude,
      sensitiveLocations
    });

    return {
      category: selectedCategory,
      category_confidence: ruleCat.confidence,
      summary: ruleSum,
      priority: priorityAnalysis.priority,
      priority_score: priorityAnalysis.priorityScore,
      priority_factors: priorityAnalysis.factors,
      ai_source: 'rule_based'
    };
  }
}

// -----------------------------------------------------------------------------
// Action Brief Generator (Single, Hotspot, Top 5)
// -----------------------------------------------------------------------------
async function generateActionBrief({ type, targetData }) {
  const gemini = getGeminiClient();

  const departmentMap = {
    'Waterlogging': 'Drainage & Stormwater Dept',
    'Drainage': 'Drainage & Stormwater Dept',
    'Road Damage': 'Roads & Infrastructure Division',
    'Streetlight': 'Electrical Maintenance Division',
    'Garbage': 'Sanitation & Solid Waste Management',
    'Water Supply': 'Water Works & Supply Board',
    'Other': 'Civic Grievance Rapid Response'
  };

  // Rule-based deterministic generator
  function fallbackBrief() {
    if (type === 'single') {
      const report = targetData;
      const dept = departmentMap[report.category] || 'Civil Operations';
      const urgency = report.priority === 'CRITICAL' ? 'Immediate (Dispatch within 2 hours)'
                    : report.priority === 'HIGH' ? 'Urgent (Action within 12 hours)'
                    : 'Standard Priority (Within 48 hours)';

      return {
        title: `Action Brief: ${report.tracking_id} (${report.category})`,
        what_is_happening: `${report.summary || report.description} Reported at ${report.address || 'location'}.`,
        why_it_matters: `Priority score ${report.priority_score}/100. Factors include: ${Array.isArray(report.priority_factors) ? report.priority_factors.map(f => f.explanation).join('; ') : 'Civic service disruption'}.`,
        recommended_action: `Deploy an inspection squad to secure perimeter, clear obstruction, and log resolution photo once remedial work is finished.`,
        suggested_department: dept,
        urgency,
        ai_source: 'rule_based'
      };
    } else if (type === 'hotspot') {
      const cluster = targetData;
      const dept = departmentMap[cluster.dominantCategory] || 'Joint Taskforce';
      return {
        title: `Hotspot Action Brief: ${cluster.areaName} (${cluster.clusterId})`,
        what_is_happening: `Localized cluster of ${cluster.totalComplaintsRepresented} reports centered around ${cluster.areaName}. Dominant issue is ${cluster.dominantCategory}.`,
        why_it_matters: cluster.rootCauseInsight || `High concentration of related grievances indicating systemic infrastructure bottleneck.`,
        recommended_action: `Coordinate joint response team led by ${dept}. Inspect primary conduit and clear drainage/pavement obstructions across the entire corridor rather than handling single symptoms.`,
        suggested_department: dept,
        urgency: 'High (Joint field inspection within 24 hours)',
        ai_source: 'rule_based'
      };
    } else {
      // Top 5 priorities
      const items = Array.isArray(targetData) ? targetData.slice(0, 5) : [];
      return {
        title: `Executive Action Brief: Today's Top ${items.length} Priorities`,
        what_is_happening: `Current emergency triage across ${items.map(i => `${i.tracking_id} (${i.category})`).join(', ')}.`,
        why_it_matters: `These cases aggregate safety risks (open hazards, hospital/school zones, high duplicate counts) with an average priority score of ${Math.round(items.reduce((s, i) => s + (i.priority_score || 0), 0) / (items.length || 1))}/100.`,
        recommended_action: `Mobilize rapid response units for critical markers first. Reassign unassigned tickets to designated engineering leads by 10:00 AM.`,
        suggested_department: 'Municipal Operations Steering Committee',
        urgency: 'Critical Operational Directive',
        ai_source: 'rule_based'
      };
    }
  }

  if (!gemini) {
    return fallbackBrief();
  }

  // Gemini Generation
  try {
    const prompt = `You are a Municipal Executive Assistant. Generate a concise, 1-minute civic action brief for authority officials in JSON format.
Type: ${type}
Data: ${JSON.stringify(targetData)}

Format your response as strict JSON:
{
  "title": "<Concise Header>",
  "what_is_happening": "<max 2 sentences explaining the incident/cluster>",
  "why_it_matters": "<max 2 sentences explaining the impact, risk, and sensitivity>",
  "recommended_action": "<actionable, pragmatic operational instruction>",
  "suggested_department": "<e.g. Roads, Sanitation, Electrical, Water Works, Drainage>",
  "urgency": "<Immediate | Urgent | Standard Priority>"
}`;

    const response = await gemini.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text.trim());
    parsed.ai_source = 'gemini';
    return parsed;
  } catch (err) {
    console.warn('Gemini action brief generation failed, using fallback:', err.message);
    return fallbackBrief();
  }
}

module.exports = {
  haversineDistanceMeters,
  calculateCosineSimilarity,
  ruleBasedCategorize,
  ruleBasedSummary,
  calculatePriorityScore,
  findPotentialDuplicate,
  detectHotspots,
  analyzeComplaintWithAI,
  generateActionBrief,
  DEFAULT_MODEL
};
