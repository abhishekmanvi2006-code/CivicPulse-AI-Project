require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');
const {
  analyzeComplaintWithAI,
  calculatePriorityScore,
  findPotentialDuplicate,
  detectHotspots,
  generateActionBrief,
  haversineDistanceMeters,
  DEFAULT_MODEL
} = require('./ai');
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper to generate tracking IDs
function generateTrackingId() {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `CP-2026-${randNum}`;
}

// -----------------------------------------------------------------------------
// Health & Config Endpoint
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    !process.env.GEMINI_API_KEY.includes('your_key_here')
  );

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini: {
      configured: hasGeminiKey,
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      statusBadge: hasGeminiKey ? 'Gemini' : 'Rule-based fallback'
    }
  });
});

// -----------------------------------------------------------------------------
// Sensitive Locations (Mocked)
// -----------------------------------------------------------------------------
app.get('/api/sensitive-locations', async (req, res) => {
  try {
    const db = await getDb();
    const locations = db.query('SELECT * FROM sensitive_locations');
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Reset Demo Data
// -----------------------------------------------------------------------------
app.post('/api/admin/reset-demo', async (req, res) => {
  try {
    const db = await getDb();
    const result = await seedDatabase(db);
    res.json({
      success: true,
      message: 'Demo dataset reset successfully',
      stats: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET /api/complaints (with filtering, search, sorting)
// -----------------------------------------------------------------------------
app.get('/api/complaints', async (req, res) => {
  try {
    const db = await getDb();
    const {
      category,
      status,
      priority,
      search,
      includeDuplicates,
      department
    } = req.query;

    let sql = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    // By default hide duplicates from top-level queue unless requested
    if (includeDuplicates !== 'true') {
      sql += ' AND (parent_id IS NULL OR parent_id = 0)';
    }

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (department && department !== 'All') {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (search && search.trim()) {
      sql += ' AND (description LIKE ? OR address LIKE ? OR tracking_id LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    // Default sort by priority_score descending, then created_at descending
    sql += ' ORDER BY priority_score DESC, created_at DESC';

    const complaints = db.query(sql, params).map(c => {
      try {
        c.priority_factors = JSON.parse(c.priority_factors);
      } catch (e) {
        c.priority_factors = [];
      }
      return c;
    });

    res.json({ complaints, total: complaints.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET /api/complaints/:trackingId (Detail + Timeline + Duplicates)
// -----------------------------------------------------------------------------
app.get('/api/complaints/:trackingId', async (req, res) => {
  try {
    const db = await getDb();
    const { trackingId } = req.params;

    // Support lookup by tracking_id or numeric ID
    const complaint = db.get(
      'SELECT * FROM complaints WHERE tracking_id = ? OR id = ?',
      [trackingId, trackingId]
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with provided Tracking ID' });
    }

    try {
      complaint.priority_factors = JSON.parse(complaint.priority_factors);
    } catch (e) {
      complaint.priority_factors = [];
    }

    // Timeline events
    const timeline = db.query(
      'SELECT * FROM timeline_events WHERE complaint_id = ? ORDER BY timestamp ASC',
      [complaint.id]
    );

    // Duplicates linked to this report (if parent)
    const duplicates = db.query(
      'SELECT * FROM complaints WHERE parent_id = ? ORDER BY created_at DESC',
      [complaint.id]
    ).map(d => {
      try { d.priority_factors = JSON.parse(d.priority_factors); } catch (e) { d.priority_factors = []; }
      return d;
    });

    // Parent details if this is a duplicate
    let parent = null;
    if (complaint.parent_id) {
      parent = db.get('SELECT id, tracking_id, status, department, category, summary FROM complaints WHERE id = ?', [complaint.parent_id]);
    }

    res.json({
      complaint,
      timeline,
      duplicates,
      parent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// POST /api/complaints (Citizen Report Submission & AI Pipeline)
// -----------------------------------------------------------------------------
app.post('/api/complaints', async (req, res) => {
  try {
    const db = await getDb();
    const {
      description,
      category: requestedCategory,
      latitude,
      longitude,
      address,
      citizen_name,
      citizen_phone,
      image_url
    } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a descriptive complaint (at least 5 characters).' });
    }

    const lat = Number(latitude) || 12.9780;
    const lng = Number(longitude) || 77.6400;

    // Load sensitive locations for priority calculation
    const sensitiveLocations = db.query('SELECT * FROM sensitive_locations');

    // 1 & 2. Run AI Analysis (Categorization, Summary, Priority Scoring)
    const aiAnalysis = await analyzeComplaintWithAI({
      description,
      userCategory: requestedCategory,
      imageBase64: image_url,
      sensitiveLocations,
      latitude: lat,
      longitude: lng
    });

    // 3. Duplicate Detection
    const activeParents = db.query("SELECT * FROM complaints WHERE status != 'RESOLVED' AND status != 'REJECTED'");
    const duplicateMatch = findPotentialDuplicate(
      {
        id: null,
        description,
        category: aiAnalysis.category,
        latitude: lat,
        longitude: lng
      },
      activeParents,
      160 // within ~160 meters
    );

    const trackingId = generateTrackingId();
    const now = new Date().toISOString();

    let parentId = null;
    let similarityScore = 0;
    let initialStatus = 'SUBMITTED';

    if (duplicateMatch) {
      parentId = duplicateMatch.parentReport.id;
      similarityScore = duplicateMatch.similarityScore;
      initialStatus = 'DUPLICATE';
    }

    // Insert complaint
    const insertResult = db.run(
      `INSERT INTO complaints (
        tracking_id, citizen_name, citizen_phone, description, category,
        category_confidence, summary, image_url, latitude, longitude, address,
        priority, priority_score, priority_factors, status, department,
        assigned_to, parent_id, duplicate_count, similarity_score, ai_source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        citizen_name || 'Anonymous Citizen',
        citizen_phone || null,
        description,
        aiAnalysis.category,
        aiAnalysis.category_confidence,
        aiAnalysis.summary,
        image_url || null,
        lat,
        lng,
        address || 'Reported Location',
        aiAnalysis.priority,
        aiAnalysis.priority_score,
        JSON.stringify(aiAnalysis.priority_factors),
        initialStatus,
        duplicateMatch ? duplicateMatch.parentReport.department : 'Unassigned',
        duplicateMatch ? duplicateMatch.parentReport.assigned_to : null,
        parentId,
        1,
        similarityScore,
        aiAnalysis.ai_source,
        now,
        now
      ]
    );

    const newId = insertResult.lastInsertRowid;

    // Insert initial timeline event
    if (duplicateMatch) {
      db.run(
        `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newId,
          'DUPLICATE',
          'Linked to Existing Report',
          `Auto-merged with ticket ${duplicateMatch.parentReport.tracking_id} located ${duplicateMatch.distanceMeters}m away (similarity: ${Math.round(similarityScore * 100)}%). Updates will track the primary case.`,
          'AI Duplicate Pipeline',
          now
        ]
      );

      // Update parent: increment duplicate count, update timeline, recalculate priority
      const updatedDupCount = (duplicateMatch.parentReport.duplicate_count || 1) + 1;
      const parentRecalc = calculatePriorityScore({
        description: duplicateMatch.parentReport.description,
        category: duplicateMatch.parentReport.category,
        duplicateCount: updatedDupCount,
        latitude: duplicateMatch.parentReport.latitude,
        longitude: duplicateMatch.parentReport.longitude,
        sensitiveLocations,
        createdAt: duplicateMatch.parentReport.created_at
      });

      db.run(
        `UPDATE complaints
         SET duplicate_count = ?, priority = ?, priority_score = ?, priority_factors = ?, updated_at = ?
         WHERE id = ?`,
        [
          updatedDupCount,
          parentRecalc.priority,
          parentRecalc.priorityScore,
          JSON.stringify(parentRecalc.factors),
          now,
          duplicateMatch.parentReport.id
        ]
      );

      db.run(
        `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          duplicateMatch.parentReport.id,
          duplicateMatch.parentReport.status,
          'Duplicate Citizen Report Added',
          `Corroborated by new citizen report ${trackingId} within ${duplicateMatch.distanceMeters}m. Community weight increased to ${updatedDupCount}.`,
          'AI Duplicate Pipeline',
          now
        ]
      );
    } else {
      db.run(
        `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newId,
          'SUBMITTED',
          'Complaint Logged',
          `Report received via citizen mobile portal. AI categorized as ${aiAnalysis.category} with priority ${aiAnalysis.priority} (${aiAnalysis.priority_score}/100).`,
          'Citizen Mobile Portal',
          now
        ]
      );
    }

    res.status(201).json({
      success: true,
      complaint: {
        id: newId,
        tracking_id: trackingId,
        category: aiAnalysis.category,
        category_confidence: aiAnalysis.category_confidence,
        summary: aiAnalysis.summary,
        priority: aiAnalysis.priority,
        priority_score: aiAnalysis.priority_score,
        priority_factors: aiAnalysis.priority_factors,
        status: initialStatus,
        is_duplicate: Boolean(duplicateMatch),
        parent_tracking_id: duplicateMatch ? duplicateMatch.parentReport.tracking_id : null,
        similarity_score: similarityScore,
        ai_source: aiAnalysis.ai_source
      }
    });
  } catch (err) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// PATCH /api/complaints/:id/status (Authority Workflow & Actions)
// -----------------------------------------------------------------------------
app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const {
      status,
      department,
      assigned_to,
      note,
      resolution_notes,
      resolution_photo,
      actor = 'Municipal Authority'
    } = req.body;

    const complaint = db.get('SELECT * FROM complaints WHERE id = ? OR tracking_id = ?', [id, id]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updates = [];
    const params = [];
    const now = new Date().toISOString();

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (department) {
      updates.push('department = ?');
      params.push(department);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (resolution_notes) {
      updates.push('resolution_notes = ?');
      params.push(resolution_notes);
    }
    if (resolution_photo) {
      updates.push('resolution_photo = ?');
      params.push(resolution_photo);
    }

    updates.push('updated_at = ?');
    params.push(now);

    params.push(complaint.id);

    db.run(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Timeline event
    const actionTitle = status === 'RESOLVED' ? 'Issue Marked Resolved'
                      : status === 'IN_PROGRESS' ? 'Work Underway'
                      : status === 'ASSIGNED' ? `Assigned to ${department || 'Department'}`
                      : 'Status Updated';

    const eventNote = note || resolution_notes || (department ? `Assigned to ${department} (${assigned_to || 'Officer'})` : `Status changed to ${status}`);

    db.run(
      `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaint.id, status || complaint.status, actionTitle, eventNote, actor, now]
    );

    // If this complaint has duplicates, update duplicates' department and status as well
    const duplicates = db.query('SELECT id, tracking_id FROM complaints WHERE parent_id = ?', [complaint.id]);
    for (const dup of duplicates) {
      if (status) {
        db.run('UPDATE complaints SET status = ?, department = ?, updated_at = ? WHERE id = ?', [status, department || complaint.department, now, dup.id]);
        db.run(
          `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [dup.id, status, actionTitle, `Synced from primary ticket ${complaint.tracking_id}: ${eventNote}`, 'System Sync', now]
        );
      }
    }

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaintId: complaint.id,
      newStatus: status || complaint.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET /api/analytics/kpis (Executive Dashboard Metrics)
// -----------------------------------------------------------------------------
app.get('/api/analytics/kpis', async (req, res) => {
  try {
    const db = await getDb();

    const all = db.query('SELECT * FROM complaints');
    const totalReports = all.length;
    const criticalOpen = all.filter(c => c.priority === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;
    const highOpen = all.filter(c => c.priority === 'HIGH' && c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;
    const resolved = all.filter(c => c.status === 'RESOLVED').length;
    const duplicatesMerged = all.filter(c => c.status === 'DUPLICATE' || c.parent_id).length;

    // Category breakdown
    const categoryCounts = {};
    for (const c of all) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    // Priority breakdown
    const priorityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const c of all) {
      if (priorityCounts[c.priority] !== undefined) {
        priorityCounts[c.priority]++;
      }
    }

    // Status breakdown
    const statusCounts = {};
    for (const c of all) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    }

    // Avg resolution time calculation for resolved complaints (hours)
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    for (const c of all) {
      if (c.status === 'RESOLVED' && c.created_at && c.updated_at) {
        const diffHrs = (new Date(c.updated_at) - new Date(c.created_at)) / (1000 * 60 * 60);
        if (diffHrs > 0) {
          totalResolutionHours += diffHrs;
          resolvedCount++;
        }
      }
    }
    const avgResolutionTimeHours = resolvedCount > 0 ? Number((totalResolutionHours / resolvedCount).toFixed(1)) : 22.4;

    res.json({
      totalReports,
      criticalOpen,
      highOpen,
      resolved,
      duplicatesMerged,
      resolutionRatePercent: totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0,
      avgResolutionTimeHours,
      categoryCounts,
      priorityCounts,
      statusCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET /api/analytics/hotspots (Geographic Clusters & Root Cause Insights)
// -----------------------------------------------------------------------------
app.get('/api/analytics/hotspots', async (req, res) => {
  try {
    const db = await getDb();
    const complaints = db.query("SELECT * FROM complaints WHERE status != 'RESOLVED' AND status != 'REJECTED'");
    const hotspots = detectHotspots(complaints, 260); // 260 meter radius
    res.json({ hotspots, count: hotspots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// POST /api/action-brief (AI Action Briefs for single report, hotspot, top 5)
// -----------------------------------------------------------------------------
app.post('/api/action-brief', async (req, res) => {
  try {
    const { type, targetData } = req.body;
    if (!type || !targetData) {
      return res.status(400).json({ error: 'Missing type or targetData in action brief request' });
    }

    const brief = await generateActionBrief({ type, targetData });
    res.json({ success: true, brief });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CivicPulse Backend listening on port ${PORT}`);
  console.log(`Gemini Model configured: ${process.env.GEMINI_MODEL || DEFAULT_MODEL}`);
  console.log(`Gemini API Key status: ${process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_key_here') ? 'CONFIGURED' : 'USING RULE-BASED FALLBACK'}`);
});
