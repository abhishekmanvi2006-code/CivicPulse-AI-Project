const { getDb } = require('./db');
const { calculatePriorityScore, calculateCosineSimilarity, haversineDistanceMeters } = require('./ai');

// Coordinates centered around a lively metropolitan sector
// (e.g., Metro Tech Corridor / Indiranagar, Lat: 12.9780, Lng: 77.6400)
const CENTER_LAT = 12.9780;
const CENTER_LNG = 77.6400;

const SENSITIVE_LOCATIONS = [
  {
    name: 'St. Mary Emergency Care & Hospital (Mocked)',
    type: 'Hospital',
    latitude: 12.9792,
    longitude: 77.6385,
    radius_meters: 300
  },
  {
    name: 'National Public Model School (Mocked)',
    type: 'School',
    latitude: 12.9755,
    longitude: 77.6415,
    radius_meters: 250
  },
  {
    name: '100ft Metro Arterial Expressway (Mocked)',
    type: 'Main Arterial Road',
    latitude: 12.9770,
    longitude: 77.6405,
    radius_meters: 200
  },
  {
    name: 'City Children Memorial Clinic (Mocked)',
    type: 'Hospital',
    latitude: 12.9825,
    longitude: 77.6440,
    radius_meters: 250
  }
];

// Curated realistic complaints
const RAW_COMPLAINTS = [
  // --- CLUSTER 1: 4th Cross & 12th Main Drainage Disaster (Hotspot with Drain + Waterlogging + Road Damage + Garbage) ---
  {
    code: 'C1-1',
    description: 'Main storm drain completely blocked with plastic waste and silt, sewage backing up onto the footpath.',
    category: 'Drainage',
    latitude: 12.9781,
    longitude: 77.6402,
    address: '4th Cross & 12th Main junction, Ward 82',
    status: 'IN_PROGRESS',
    department: 'Drainage',
    assigned_to: 'Eng. Rajesh Sharma',
    hoursAgo: 48,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Citizen reported via mobile web portal', actor: 'Citizen', hoursAgo: 48 },
      { status: 'UNDER_REVIEW', action: 'Triage Completed', note: 'High priority drainage blockage verified', actor: 'Automated AI Engine', hoursAgo: 46 },
      { status: 'ASSIGNED', action: 'Department Assigned', note: 'Assigned to Stormwater Drainage Division', actor: 'Municipal Supervisor', hoursAgo: 36 },
      { status: 'IN_PROGRESS', action: 'Desilting Unit Dispatched', note: 'Suction jetting machine on site', actor: 'Eng. Rajesh Sharma', hoursAgo: 12 }
    ]
  },
  {
    code: 'C1-2',
    description: 'Severe waterlogging right in front of shops due to clogged storm drain. Water knee-deep after yesterday rain.',
    category: 'Waterlogging',
    latitude: 12.9783,
    longitude: 77.6404,
    address: '12th Main, Near Coffee House, Ward 82',
    status: 'ASSIGNED',
    department: 'Drainage',
    assigned_to: 'Eng. Rajesh Sharma',
    hoursAgo: 44,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Citizen reported water stagnation', actor: 'Citizen', hoursAgo: 44 },
      { status: 'ASSIGNED', action: 'Linked to Drainage Hotspot', note: 'Action pending clearing of main conduit', actor: 'Municipal Supervisor', hoursAgo: 30 }
    ]
  },
  {
    code: 'C1-3',
    description: 'Road surface crumbling and large potholes formed because of standing drain water. Asphalt completely washed away.',
    category: 'Road Damage',
    latitude: 12.9780,
    longitude: 77.6405,
    address: '4th Cross Road, Ward 82',
    status: 'UNDER_REVIEW',
    department: 'Roads',
    hoursAgo: 40,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Citizen reported road damage', actor: 'Citizen', hoursAgo: 40 }
    ]
  },
  {
    code: 'C1-4',
    description: 'Huge pile of garbage dumped right next to the overflowing drain, stinking terribly and blocking pedestrian walkway.',
    category: 'Garbage',
    latitude: 12.9782,
    longitude: 77.6401,
    address: 'Corner of 4th Cross & 12th Main, Ward 82',
    status: 'SUBMITTED',
    department: 'Sanitation',
    hoursAgo: 35,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Citizen grievance submitted', actor: 'Citizen', hoursAgo: 35 }
    ]
  },

  // --- URGENT SAFETY EMERGENCIES (4+ Critical Safety Issues) ---
  {
    code: 'SAFE-1',
    description: 'Deep open manhole without cover on unlit pedestrian footpath right opposite National Public School gate! Extreme danger of children falling in.',
    category: 'Drainage',
    latitude: 12.9756,
    longitude: 77.6416,
    address: 'Opposite National Public Model School Gate, 8th Main',
    status: 'IN_PROGRESS',
    department: 'Drainage',
    assigned_to: 'Rapid Response Team Alpha',
    hoursAgo: 6,
    timeline: [
      { status: 'SUBMITTED', action: 'Emergency Report', note: 'Critical citizen report near school zone', actor: 'Citizen', hoursAgo: 6 },
      { status: 'UNDER_REVIEW', action: 'Safety Escalation', note: 'Priority score 96: Immediate pedestrian hazard near school', actor: 'AI Emergency Triage', hoursAgo: 5 },
      { status: 'IN_PROGRESS', action: 'Barricade Erected', note: 'Temporary safety barricade placed, cast iron lid ordered', actor: 'Rapid Response Team Alpha', hoursAgo: 2 }
    ]
  },
  {
    code: 'SAFE-2',
    description: 'Exposed live wire hanging from broken streetlight pole sparking onto metal railing after thunderstorm. Electric shock hazard for passersby.',
    category: 'Streetlight',
    latitude: 12.9793,
    longitude: 77.6386,
    address: 'St. Mary Hospital Entrance Road, Near Gate 2',
    status: 'ASSIGNED',
    department: 'Electrical',
    assigned_to: 'Elec Officer K. Nair',
    hoursAgo: 4,
    timeline: [
      { status: 'SUBMITTED', action: 'Hazard Logged', note: 'Citizen flagged live wire sparking near hospital entrance', actor: 'Citizen', hoursAgo: 4 },
      { status: 'ASSIGNED', action: 'Urgent Dispatch', note: 'Dispatched emergency electrical lineman crew', actor: 'Control Room Officer', hoursAgo: 2 }
    ]
  },
  {
    code: 'SAFE-3',
    description: 'Huge crater and caved-in road in the middle lane of 100ft Expressway. Two motorcycle riders skidded and crashed this morning!',
    category: 'Road Damage',
    latitude: 12.9772,
    longitude: 77.6406,
    address: '100ft Metro Arterial Road, Near Pillar 45',
    status: 'UNDER_REVIEW',
    department: 'Roads',
    hoursAgo: 9,
    timeline: [
      { status: 'SUBMITTED', action: 'Accident Reported', note: 'Citizen report with accident risk alert', actor: 'Citizen', hoursAgo: 9 }
    ]
  },
  {
    code: 'SAFE-4',
    description: 'Drinking water pipeline ruptured under high pressure, spewing gallons of potable water while creating sinkhole near clinic.',
    category: 'Water Supply',
    latitude: 12.9824,
    longitude: 77.6438,
    address: '7th Cross Road, Near City Children Memorial Clinic',
    status: 'IN_PROGRESS',
    department: 'Water Works',
    assigned_to: 'Water Board Squad 4',
    hoursAgo: 14,
    timeline: [
      { status: 'SUBMITTED', action: 'Pipe Burst Alert', note: 'Potable water waste & subsidence', actor: 'Citizen', hoursAgo: 14 },
      { status: 'ASSIGNED', action: 'Valve Isolated', note: 'Sector 5 feeder valve turned off to stop flooding', actor: 'Water Board Squad 4', hoursAgo: 10 }
    ]
  },

  // --- GENERAL COMPLAINTS ACROSS CATEGORIES ---
  {
    code: 'GEN-1',
    description: 'Streetlights completely dead on entire residential lane for past 4 nights. Dark street making residents feel unsafe.',
    category: 'Streetlight',
    latitude: 12.9810,
    longitude: 77.6370,
    address: '14th Cross, 2nd Stage, Indiranagar',
    status: 'ASSIGNED',
    department: 'Electrical',
    assigned_to: 'Elec Officer K. Nair',
    hoursAgo: 78,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Resident welfare association complaint', actor: 'Citizen', hoursAgo: 78 }
    ]
  },
  {
    code: 'GEN-2',
    description: 'Multiple potholes extending over 50 meters outside community park. Slowing down morning school buses and traffic.',
    category: 'Road Damage',
    latitude: 12.9740,
    longitude: 77.6430,
    address: 'Park View Road, Sector 3',
    status: 'RESOLVED',
    department: 'Roads',
    assigned_to: 'Roads Unit 2',
    resolution_notes: 'Cold mix asphalt patching completed over 6 potholes. Surface leveled and roller applied.',
    hoursAgo: 96,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Potholes logged', actor: 'Citizen', hoursAgo: 96 },
      { status: 'ASSIGNED', action: 'Assigned', note: 'Assigned to patch crew', actor: 'Supervisor', hoursAgo: 72 },
      { status: 'RESOLVED', action: 'Repaired', note: 'Cold mix patching completed successfully', actor: 'Roads Unit 2', hoursAgo: 24 }
    ]
  },
  {
    code: 'GEN-3',
    description: 'Commercial vegetable waste dumped on corner vacant plot. Attracting stray dogs and heavy fly infestation.',
    category: 'Garbage',
    latitude: 12.9835,
    longitude: 77.6395,
    address: 'Behind Supermarket, 9th A Main',
    status: 'ASSIGNED',
    department: 'Sanitation',
    assigned_to: 'Sanitation Inspector Vinod',
    hoursAgo: 26,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Solid waste accumulation reported', actor: 'Citizen', hoursAgo: 26 }
    ]
  },
  {
    code: 'GEN-4',
    description: 'Sewage overflow from residential chamber onto service road. Unbearable foul odor spreading into nearby apartments.',
    category: 'Drainage',
    latitude: 12.9765,
    longitude: 77.6360,
    address: 'Service Road, 5th Block',
    status: 'SUBMITTED',
    department: 'Drainage',
    hoursAgo: 16,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Citizen grievance', actor: 'Citizen', hoursAgo: 16 }
    ]
  },
  {
    code: 'GEN-5',
    description: 'Tap water received in houses is yellowish and smells like rust. Suspected cross contamination with sewage line.',
    category: 'Water Supply',
    latitude: 12.9800,
    longitude: 77.6420,
    address: '6th Main, 1st Cross, Ward 83',
    status: 'UNDER_REVIEW',
    department: 'Water Works',
    hoursAgo: 18,
    timeline: [
      { status: 'SUBMITTED', action: 'Water Quality Alert', note: 'Water sample test requested', actor: 'Citizen', hoursAgo: 18 }
    ]
  },
  {
    code: 'GEN-6',
    description: 'Overgrown tree branches completely obstructing traffic sign board and pedestrian signal at intersection.',
    category: 'Other',
    latitude: 12.9775,
    longitude: 77.6410,
    address: '100ft Rd & 6th Main Signal',
    status: 'RESOLVED',
    department: 'Roads',
    resolution_notes: 'Horticulture & road safety wing trimmed tree branches. Traffic signs now fully visible.',
    hoursAgo: 110,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Visual obstruction reported', actor: 'Citizen', hoursAgo: 110 },
      { status: 'RESOLVED', action: 'Trimmed', note: 'Branches cleared by horticulture wing', actor: 'Roads Unit', hoursAgo: 30 }
    ]
  },
  {
    code: 'GEN-7',
    description: 'Broken stone slab over storm water drain. People tripping while stepping down from bus stop.',
    category: 'Drainage',
    latitude: 12.9750,
    longitude: 77.6400,
    address: 'Metro Bus Stop #14, Main Road',
    status: 'IN_PROGRESS',
    department: 'Drainage',
    assigned_to: 'Eng. Ramesh G.',
    hoursAgo: 50,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Footpath slab damage', actor: 'Citizen', hoursAgo: 50 }
    ]
  },
  {
    code: 'GEN-8',
    description: 'Continuous water leakage from municipal valve chamber soaking the asphalt and wasting treated water.',
    category: 'Water Supply',
    latitude: 12.9840,
    longitude: 77.6365,
    address: 'Near Water Tank, 11th Cross',
    status: 'ASSIGNED',
    department: 'Water Works',
    hoursAgo: 60,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Valve leakage reported', actor: 'Citizen', hoursAgo: 60 }
    ]
  },
  {
    code: 'GEN-9',
    description: 'Streetlight pole tilted at a 30-degree angle after delivery van collision. Needs alignment before it falls.',
    category: 'Streetlight',
    latitude: 12.9790,
    longitude: 77.6435,
    address: 'Opposite State Bank, 10th Main',
    status: 'UNDER_REVIEW',
    department: 'Electrical',
    hoursAgo: 22,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Tilted electrical post', actor: 'Citizen', hoursAgo: 22 }
    ]
  },
  {
    code: 'GEN-10',
    description: 'Construction debris and discarded concrete blocks dumped illegally on sidewalk, forcing pedestrians to walk on active road.',
    category: 'Garbage',
    latitude: 12.9760,
    longitude: 77.6380,
    address: 'Next to Construction Site #42, 3rd Cross',
    status: 'SUBMITTED',
    department: 'Sanitation',
    hoursAgo: 15,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'C&D debris reported', actor: 'Citizen', hoursAgo: 15 }
    ]
  },
  {
    code: 'GEN-11',
    description: 'Deep ditch dug by telecom contractor left unpaved and unmarked without barricades.',
    category: 'Road Damage',
    latitude: 12.9815,
    longitude: 77.6410,
    address: 'Cross 5, Near Post Office',
    status: 'ASSIGNED',
    department: 'Roads',
    hoursAgo: 32,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Unfilled trench hazard', actor: 'Citizen', hoursAgo: 32 }
    ]
  },
  {
    code: 'GEN-12',
    description: 'Stagnant rainwater pool in underpass making pedestrian crossing impossible after moderate rain.',
    category: 'Waterlogging',
    latitude: 12.9735,
    longitude: 77.6390,
    address: 'Pedestrian Underpass 2, South Sector',
    status: 'SUBMITTED',
    department: 'Drainage',
    hoursAgo: 19,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Underpass flooded', actor: 'Citizen', hoursAgo: 19 }
    ]
  },
  {
    code: 'GEN-13',
    description: 'Green waste from tree pruning piled on curb for over one week. Dried branches drying out and fire hazard.',
    category: 'Garbage',
    latitude: 12.9830,
    longitude: 77.6415,
    address: '15th Main, Near Park Gate',
    status: 'RESOLVED',
    department: 'Sanitation',
    resolution_notes: 'Sanitation truck cleared all dried garden waste and disinfected spot.',
    hoursAgo: 120,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Garden waste cleanup request', actor: 'Citizen', hoursAgo: 120 },
      { status: 'RESOLVED', action: 'Collected', note: 'Truck collected waste', actor: 'Sanitation Unit 4', hoursAgo: 40 }
    ]
  },
  {
    code: 'GEN-14',
    description: 'Defective street lamp flickering continuously like a strobe light, causing glare and headaches for ground floor houses.',
    category: 'Streetlight',
    latitude: 12.9805,
    longitude: 77.6390,
    address: '4th Cross, House #110 lane',
    status: 'SUBMITTED',
    department: 'Electrical',
    hoursAgo: 38,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Flickering lamp post', actor: 'Citizen', hoursAgo: 38 }
    ]
  },
  {
    code: 'GEN-15',
    description: 'Water pressure in municipal pipeline has dropped to trickle for past 3 days in entire street.',
    category: 'Water Supply',
    latitude: 12.9770,
    longitude: 77.6370,
    address: 'Cross 2, Teachers Colony',
    status: 'ASSIGNED',
    department: 'Water Works',
    hoursAgo: 55,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Low pressure grievance', actor: 'Citizen', hoursAgo: 55 }
    ]
  },
  {
    code: 'GEN-16',
    description: 'Broken speed bump with sharp exposed metal rebar studs poking out of road surface.',
    category: 'Road Damage',
    latitude: 12.9745,
    longitude: 77.6410,
    address: 'Cross 8, Near Kindergarten',
    status: 'IN_PROGRESS',
    department: 'Roads',
    assigned_to: 'Roads Unit 1',
    hoursAgo: 28,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Tyre puncture and tire hazard', actor: 'Citizen', hoursAgo: 28 }
    ]
  },
  {
    code: 'GEN-17',
    description: 'Open public dustbin container broken and overturned on road by stray cattle.',
    category: 'Garbage',
    latitude: 12.9820,
    longitude: 77.6380,
    address: '7th Main Market Road',
    status: 'ASSIGNED',
    department: 'Sanitation',
    hoursAgo: 24,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Overturned bin reported', actor: 'Citizen', hoursAgo: 24 }
    ]
  },
  {
    code: 'GEN-18',
    description: 'Waterlogging near hospital emergency driveway after rain, ambulances having difficulty turning into gate.',
    category: 'Waterlogging',
    latitude: 12.9794,
    longitude: 77.6384,
    address: 'Emergency Road, St. Mary Hospital Zone',
    status: 'IN_PROGRESS',
    department: 'Drainage',
    assigned_to: 'Eng. Rajesh Sharma',
    hoursAgo: 12,
    timeline: [
      { status: 'SUBMITTED', action: 'Emergency Access Alert', note: 'Hospital access waterlogged', actor: 'Citizen', hoursAgo: 12 }
    ]
  },
  {
    code: 'GEN-19',
    description: 'Traffic signal at busy four-way junction blinking red on all sides, causing severe gridlock.',
    category: 'Other',
    latitude: 12.9770,
    longitude: 77.6405,
    address: '100ft Road Intersection',
    status: 'RESOLVED',
    department: 'Electrical',
    resolution_notes: 'Traffic controller board rebooted and timing sequences re-synchronized with central grid.',
    hoursAgo: 48,
    timeline: [
      { status: 'SUBMITTED', action: 'Signal Glitch', note: 'Blinking red signal', actor: 'Traffic Warden', hoursAgo: 48 },
      { status: 'RESOLVED', action: 'Repaired', note: 'Controller rebooted and operational', actor: 'Traffic Tech', hoursAgo: 38 }
    ]
  },
  {
    code: 'GEN-20',
    description: 'Drain grates stolen by scrap thieves leaving open holes along cyclist lane.',
    category: 'Drainage',
    latitude: 12.9752,
    longitude: 77.6425,
    address: 'Cycle Track, 9th Cross',
    status: 'ASSIGNED',
    department: 'Drainage',
    hoursAgo: 34,
    timeline: [
      { status: 'SUBMITTED', action: 'Theft & Hazard Alert', note: 'Missing iron gratings', actor: 'Citizen', hoursAgo: 34 }
    ]
  },
  {
    code: 'GEN-21',
    description: 'Large dead tree branch hanging precariously over high voltage transmission line.',
    category: 'Streetlight',
    latitude: 12.9802,
    longitude: 77.6428,
    address: '12th Cross, Near Substation',
    status: 'UNDER_REVIEW',
    department: 'Electrical',
    hoursAgo: 17,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Power line tree hazard', actor: 'Citizen', hoursAgo: 17 }
    ]
  },
  {
    code: 'GEN-22',
    description: 'Water meter box vandalized and leaking continuously on pavement outside commercial complex.',
    category: 'Water Supply',
    latitude: 12.9788,
    longitude: 77.6375,
    address: '100ft Road, Near Metro Pillar 32',
    status: 'SUBMITTED',
    department: 'Water Works',
    hoursAgo: 13,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Meter leakage', actor: 'Citizen', hoursAgo: 13 }
    ]
  },
  {
    code: 'GEN-23',
    description: 'Fly-tipping of chemical packaging materials and plastic drums on side berm of bypass road.',
    category: 'Garbage',
    latitude: 12.9845,
    longitude: 77.6420,
    address: 'Bypass Road Berm, Northern Border',
    status: 'ASSIGNED',
    department: 'Sanitation',
    hoursAgo: 42,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Industrial litter', actor: 'Citizen', hoursAgo: 42 }
    ]
  },
  {
    code: 'GEN-24',
    description: 'Sunken storm drain grating creating a 6-inch sharp drop on left vehicular lane.',
    category: 'Road Damage',
    latitude: 12.9768,
    longitude: 77.6395,
    address: 'Main Arterial Road, Near Cross 4',
    status: 'UNDER_REVIEW',
    department: 'Roads',
    hoursAgo: 29,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Sunken grate hazard', actor: 'Citizen', hoursAgo: 29 }
    ]
  },
  {
    code: 'GEN-25',
    description: 'Street name signboard broken off and lying on ground, confusing delivery drivers and ambulances.',
    category: 'Other',
    latitude: 12.9762,
    longitude: 77.6418,
    address: '8th Main & 3rd Cross',
    status: 'SUBMITTED',
    department: 'Roads',
    hoursAgo: 65,
    timeline: [
      { status: 'SUBMITTED', action: 'Report Filed', note: 'Signboard broken', actor: 'Citizen', hoursAgo: 65 }
    ]
  },
  {
    code: 'GEN-26',
    description: 'Severe waterlogging at Metro Station gate 3 making entry impossible without wading in dirty water.',
    category: 'Waterlogging',
    latitude: 12.9786,
    longitude: 77.6398,
    address: 'Metro Station Gate 3, 100ft Road',
    status: 'ASSIGNED',
    department: 'Drainage',
    hoursAgo: 21,
    timeline: [
      { status: 'SUBMITTED', action: 'Subway Access Stagnation', note: 'Gate 3 access blocked', actor: 'Citizen', hoursAgo: 21 }
    ]
  },
  {
    code: 'GEN-27',
    description: 'Cracked underground water supply pipe flooding basement parking of residential complex.',
    category: 'Water Supply',
    latitude: 12.9818,
    longitude: 77.6432,
    address: '9th Cross, Silver Oak Apartments',
    status: 'IN_PROGRESS',
    department: 'Water Works',
    assigned_to: 'Water Board Squad 2',
    hoursAgo: 16,
    timeline: [
      { status: 'SUBMITTED', action: 'Basement Flooding', note: 'Main line pipe rupture', actor: 'Citizen', hoursAgo: 16 }
    ]
  },
  {
    code: 'GEN-28',
    description: 'Streetlight pole electrical inspection hatch left unlocked with exposed circuit breakers at child eye level.',
    category: 'Streetlight',
    latitude: 12.9763,
    longitude: 77.6412,
    address: 'Outside Children Playground, Sector 4',
    status: 'UNDER_REVIEW',
    department: 'Electrical',
    hoursAgo: 8,
    timeline: [
      { status: 'SUBMITTED', action: 'Electrical Box Open', note: 'Hazard at playground', actor: 'Citizen', hoursAgo: 8 }
    ]
  },
  {
    code: 'GEN-29',
    description: 'Large pothole hidden under muddy puddle causing cars to bottom out and crack oil pans.',
    category: 'Road Damage',
    latitude: 12.9778,
    longitude: 77.6422,
    address: 'Cross 7, Near Grocery Hub',
    status: 'ASSIGNED',
    department: 'Roads',
    hoursAgo: 31,
    timeline: [
      { status: 'SUBMITTED', action: 'Hidden Pothole Alert', note: 'Oil pan damage reported', actor: 'Citizen', hoursAgo: 31 }
    ]
  },
  {
    code: 'GEN-30',
    description: 'Discarded electronics, shattered television glass and batteries dumped beside footpath.',
    category: 'Garbage',
    latitude: 12.9832,
    longitude: 77.6378,
    address: '16th Cross, Indiranagar',
    status: 'SUBMITTED',
    department: 'Sanitation',
    hoursAgo: 11,
    timeline: [
      { status: 'SUBMITTED', action: 'E-Waste Dumping', note: 'Hazardous glass and e-waste', actor: 'Citizen', hoursAgo: 11 }
    ]
  },
  {
    code: 'GEN-31',
    description: 'Overflowing storm drain grate spewing black wastewater into park walking track.',
    category: 'Drainage',
    latitude: 12.9748,
    longitude: 77.6429,
    address: 'Public Park Perimeter, East Gate',
    status: 'IN_PROGRESS',
    department: 'Drainage',
    assigned_to: 'Eng. Ramesh G.',
    hoursAgo: 15,
    timeline: [
      { status: 'SUBMITTED', action: 'Park Contamination', note: 'Drain overflow on track', actor: 'Citizen', hoursAgo: 15 }
    ]
  }
];

// 5-6 Deliberate Duplicates to link to specific parents
const DUPLICATE_REPORTS = [
  // Dup 1: Targets SAFE-1 (Open manhole near school)
  {
    targetCode: 'SAFE-1',
    description: 'Huge hole in footpath without lid right where schoolchildren walk near National Public School! Someone will fall inside.',
    category: 'Drainage',
    latitude: 12.9757,
    longitude: 77.6417,
    address: '8th Main, School Gate Walkway',
    hoursAgo: 4
  },
  // Dup 2: Targets SAFE-1 (Another citizen reporting open manhole)
  {
    targetCode: 'SAFE-1',
    description: 'Uncovered sewer manhole on school road. Very unsafe for children in evening.',
    category: 'Drainage',
    latitude: 12.9755,
    longitude: 77.6414,
    address: '8th Main Road, Opposite Model School',
    hoursAgo: 2
  },
  // Dup 3: Targets SAFE-2 (Exposed live wire near hospital)
  {
    targetCode: 'SAFE-2',
    description: 'Electric wire hanging down from lamp post near St. Mary Hospital entrance sparking violently when wind blows.',
    category: 'Streetlight',
    latitude: 12.9792,
    longitude: 77.6387,
    address: 'St. Mary Hospital Gate 2 Road',
    hoursAgo: 3
  },
  // Dup 4: Targets SAFE-3 (Deep crater on 100ft road)
  {
    targetCode: 'SAFE-3',
    description: 'Dangerous crater on 100ft expressway near metro pillar 45. Car tires are getting punctured.',
    category: 'Road Damage',
    latitude: 12.9773,
    longitude: 77.6407,
    address: '100ft Road, Near Metro Pillar 45',
    hoursAgo: 7
  },
  // Dup 5: Targets C1-2 (Waterlogging on 12th Main)
  {
    targetCode: 'C1-2',
    description: 'Water standing on 12th main road, cars splashing water onto pedestrians and shop entrances.',
    category: 'Waterlogging',
    latitude: 12.9784,
    longitude: 77.6403,
    address: '12th Main Road, Indiranagar',
    hoursAgo: 30
  },
  // Dup 6: Targets GEN-1 (Dead streetlights)
  {
    targetCode: 'GEN-1',
    description: 'No streetlights working on 14th cross 2nd stage, pitch black at night.',
    category: 'Streetlight',
    latitude: 12.9811,
    longitude: 77.6371,
    address: '14th Cross Road, Indiranagar',
    hoursAgo: 48
  }
];

async function seedDatabase(db) {
  console.log('Seeding SQLite database with demo civic reports...');

  // Clear existing
  db.exec(`
    DELETE FROM timeline_events;
    DELETE FROM complaints;
    DELETE FROM sensitive_locations;
  `);

  // Seed sensitive locations
  for (const loc of SENSITIVE_LOCATIONS) {
    db.run(
      `INSERT INTO sensitive_locations (name, type, latitude, longitude, radius_meters)
       VALUES (?, ?, ?, ?, ?)`,
      [loc.name, loc.type, loc.latitude, loc.longitude, loc.radius_meters]
    );
  }

  const sensitiveList = db.query('SELECT * FROM sensitive_locations');
  const codeToIdMap = {};

  // Insert primary complaints
  let index = 1;
  for (const raw of RAW_COMPLAINTS) {
    const trackingId = `CP-2026-${String(index).padStart(4, '0')}`;
    index++;

    const createdAt = new Date(Date.now() - (raw.hoursAgo * 60 * 60 * 1000)).toISOString();
    const updatedAt = new Date(Date.now() - (Math.max(raw.hoursAgo - 2, 1) * 60 * 60 * 1000)).toISOString();

    const priorityInfo = calculatePriorityScore({
      description: raw.description,
      category: raw.category,
      duplicateCount: 1,
      latitude: raw.latitude,
      longitude: raw.longitude,
      sensitiveLocations: sensitiveList,
      createdAt
    });

    const summary = raw.description.split('.')[0] + '.';

    const insertResult = db.run(
      `INSERT INTO complaints (
        tracking_id, citizen_name, citizen_phone, description, category,
        category_confidence, summary, latitude, longitude, address,
        priority, priority_score, priority_factors, status, department,
        assigned_to, parent_id, duplicate_count, similarity_score, ai_source,
        resolution_notes, resolution_photo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        'Civic Citizen (Demo)',
        '+91 98765 43210',
        raw.description,
        raw.category,
        0.94,
        summary,
        raw.latitude,
        raw.longitude,
        raw.address,
        priorityInfo.priority,
        priorityInfo.priorityScore,
        JSON.stringify(priorityInfo.factors),
        raw.status,
        raw.department || 'Unassigned',
        raw.assigned_to || null,
        null,
        1,
        0,
        'rule_based',
        raw.resolution_notes || null,
        raw.resolution_notes ? 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80' : null,
        createdAt,
        updatedAt
      ]
    );

    const insertedId = insertResult.lastInsertRowid;
    codeToIdMap[raw.code] = insertedId;

    // Timeline events
    if (raw.timeline && raw.timeline.length) {
      for (const t of raw.timeline) {
        const time = new Date(Date.now() - (t.hoursAgo * 60 * 60 * 1000)).toISOString();
        db.run(
          `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [insertedId, t.status, t.action, t.note, t.actor, time]
        );
      }
    }
  }

  // Insert deliberate duplicates linked to parents
  for (const dup of DUPLICATE_REPORTS) {
    const parentId = codeToIdMap[dup.targetCode];
    if (!parentId) continue;

    const parent = db.get('SELECT * FROM complaints WHERE id = ?', [parentId]);
    if (!parent) continue;

    const trackingId = `CP-2026-${String(index).padStart(4, '0')}`;
    index++;

    const createdAt = new Date(Date.now() - (dup.hoursAgo * 60 * 60 * 1000)).toISOString();
    const sim = calculateCosineSimilarity(dup.description, parent.description);

    const priorityInfo = calculatePriorityScore({
      description: dup.description,
      category: dup.category,
      duplicateCount: 1,
      latitude: dup.latitude,
      longitude: dup.longitude,
      sensitiveLocations: sensitiveList,
      createdAt
    });

    const dupResult = db.run(
      `INSERT INTO complaints (
        tracking_id, citizen_name, citizen_phone, description, category,
        category_confidence, summary, latitude, longitude, address,
        priority, priority_score, priority_factors, status, department,
        assigned_to, parent_id, duplicate_count, similarity_score, ai_source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        'Neighboring Citizen (Demo)',
        '+91 91234 56789',
        dup.description,
        dup.category,
        0.92,
        dup.description.slice(0, 80) + '...',
        dup.latitude,
        dup.longitude,
        dup.address,
        priorityInfo.priority,
        priorityInfo.priorityScore,
        JSON.stringify(priorityInfo.factors),
        'DUPLICATE',
        parent.department,
        parent.assigned_to,
        parentId,
        1,
        sim,
        'rule_based',
        createdAt,
        createdAt
      ]
    );

    const dupId = dupResult.lastInsertRowid;

    // Increment parent duplicate count and recalculate parent's priority
    const newDupCount = (parent.duplicate_count || 1) + 1;
    const parentRecalc = calculatePriorityScore({
      description: parent.description,
      category: parent.category,
      duplicateCount: newDupCount,
      latitude: parent.latitude,
      longitude: parent.longitude,
      sensitiveLocations: sensitiveList,
      createdAt: parent.created_at
    });

    db.run(
      `UPDATE complaints
       SET duplicate_count = ?, priority = ?, priority_score = ?, priority_factors = ?, updated_at = ?
       WHERE id = ?`,
      [
        newDupCount,
        parentRecalc.priority,
        parentRecalc.priorityScore,
        JSON.stringify(parentRecalc.factors),
        new Date().toISOString(),
        parentId
      ]
    );

    // Timeline event on parent indicating duplicate merged
    db.run(
      `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parentId,
        parent.status,
        'Duplicate Report Linked',
        `Linked duplicate report ${trackingId} (similarity: ${Math.round(sim * 100)}%). Community impact multiplier escalated to ${newDupCount}.`,
        'AI Duplicate Engine',
        createdAt
      ]
    );

    // Timeline event on duplicate ticket
    db.run(
      `INSERT INTO timeline_events (complaint_id, status, action, note, actor, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dupId,
        'DUPLICATE',
        'Auto-Merged as Duplicate',
        `Linked to primary ticket ${parent.tracking_id} located ${Math.round(haversineDistanceMeters(dup.latitude, dup.longitude, parent.latitude, parent.longitude))}m away. Citizen updates will mirror parent.`,
        'AI Duplicate Engine',
        createdAt
      ]
    );
  }

  // Count reports
  const totalReports = db.query('SELECT count(*) as count FROM complaints')[0].count;
  const criticalReports = db.query("SELECT count(*) as count FROM complaints WHERE priority = 'CRITICAL' AND status != 'RESOLVED'")[0].count;
  const duplicateReports = db.query("SELECT count(*) as count FROM complaints WHERE status = 'DUPLICATE'")[0].count;

  console.log(`Database seeded successfully! Total: ${totalReports}, Critical Open: ${criticalReports}, Duplicates Merged: ${duplicateReports}`);
  return { totalReports, criticalReports, duplicateReports };
}

// Allow direct CLI execution: node seed.js
if (require.main === module) {
  getDb().then(db => {
    seedDatabase(db).then(() => {
      console.log('Seed script execution completed.');
      process.exit(0);
    }).catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
  });
}

module.exports = {
  seedDatabase,
  SENSITIVE_LOCATIONS
};
