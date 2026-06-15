CREATE TABLE IF NOT EXISTS users_optional (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  role TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  health_needs TEXT NOT NULL,
  diet_habits TEXT,
  health_goals TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  target_group TEXT NOT NULL,
  main_needs TEXT NOT NULL,
  strains TEXT NOT NULL,
  cfu_per_serving TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  usage_instruction TEXT NOT NULL,
  warnings TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  product_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strain_name TEXT NOT NULL,
  strain_code TEXT,
  application_areas TEXT NOT NULL,
  suggested_cfu_min INTEGER NOT NULL DEFAULT 0,
  suggested_cfu_max INTEGER NOT NULL DEFAULT 0,
  target_group TEXT NOT NULL,
  warnings TEXT NOT NULL,
  evidence_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_type TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  target_group TEXT,
  needs TEXT NOT NULL,
  lifestyle TEXT,
  special_conditions TEXT,
  recommended_strains TEXT NOT NULL,
  recommended_products TEXT NOT NULL,
  confidence_score INTEGER NOT NULL,
  gut_health_score INTEGER,
  plan_level TEXT,
  primary_goal TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_meta TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS health_journeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  recommendation_log_id INTEGER,
  start_date TEXT NOT NULL,
  target_days INTEGER NOT NULL DEFAULT 90,
  product_days INTEGER NOT NULL DEFAULT 30,
  current_day INTEGER NOT NULL DEFAULT 1,
  initial_score INTEGER NOT NULL,
  plan_level TEXT NOT NULL,
  primary_goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL DEFAULT 1,
  checkpoint_day INTEGER NOT NULL,
  continued_use TEXT NOT NULL,
  bowel_status TEXT NOT NULL,
  bloating_status TEXT NOT NULL,
  stress_sleep TEXT NOT NULL,
  self_score INTEGER NOT NULL,
  willing_to_repurchase TEXT NOT NULL,
  bowel_score INTEGER,
  bloating_score INTEGER,
  sleep_stress_score INTEGER,
  overall_score INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(journey_id, checkpoint_day)
);

CREATE TABLE IF NOT EXISTS reminder_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL DEFAULT 1,
  reminder_type TEXT NOT NULL,
  due_day INTEGER NOT NULL,
  scheduled_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(journey_id, reminder_type)
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL DEFAULT 1,
  log_date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(journey_id, user_id, log_date)
);
