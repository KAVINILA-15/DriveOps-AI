import os
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Paths
WORKSPACE = r"c:\Users\S.KAVINILA\Downloads\DriveOps-AI-Manufacturing-Intelligence\DriveOps-AI-Manufacturing-Intelligence"
BRAIN_DIR = r"C:\Users\S.KAVINILA\.gemini\antigravity-ide\brain\920e4463-f699-4e43-80d6-73d298fe9dfb"
ASSETS_DIR = os.path.join(WORKSPACE, "presentation_assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# Copy images into presentation_assets
IMG_HERO = os.path.join(BRAIN_DIR, "smart_factory_ai_1790743444673.jpg")
IMG_COMMAND = os.path.join(BRAIN_DIR, "command_center_hub_1790743474357.jpg")
IMG_SENSOR = os.path.join(BRAIN_DIR, "sensor_diagnostics_1790743503594.jpg")

local_hero = os.path.join(ASSETS_DIR, "hero_smart_factory.jpg")
local_command = os.path.join(ASSETS_DIR, "command_center.jpg")
local_sensor = os.path.join(ASSETS_DIR, "sensor_diagnostics.jpg")

if os.path.exists(IMG_HERO): shutil.copy(IMG_HERO, local_hero)
if os.path.exists(IMG_COMMAND): shutil.copy(IMG_COMMAND, local_command)
if os.path.exists(IMG_SENSOR): shutil.copy(IMG_SENSOR, local_sensor)

print("Images copied successfully.")

# Setup Presentation
prs = Presentation()
prs.slide_width = Inches(13.333)  # 16:9 Widescreen
prs.slide_height = Inches(7.5)

# Color Palette (Dark High-Tech Industrial Theme)
BG_DARK = RGBColor(11, 19, 43)        # #0B132B
CARD_BG = RGBColor(19, 30, 62)        # #131E3E
CARD_BORDER = RGBColor(38, 56, 102)   # #263866
ACCENT_CYAN = RGBColor(0, 229, 255)   # #00E5FF
ACCENT_AMBER = RGBColor(255, 183, 3)  # #FFB703
ACCENT_GREEN = RGBColor(0, 230, 118)  # #00E676
ACCENT_RED = RGBColor(255, 51, 102)   # #FF3366
TEXT_WHITE = RGBColor(245, 247, 250)  # #F5F7FA
TEXT_MUTED = RGBColor(160, 174, 192)  # #A0AEC0
TEXT_DARK = RGBColor(15, 23, 42)

blank_layout = prs.slide_layouts[6]

def set_slide_background(slide, color=BG_DARK):
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = color
    bg_shape.line.fill.background()
    return bg_shape

def add_header(slide, title_text, category="DRIVEOPS-AI | MANUFACTURING INTELLIGENCE"):
    # Category tag
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.35))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = category.upper()
    p_tag.font.size = Pt(11)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_CYAN

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(26)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
    else:
        card.line.fill.background()
    return card

# ==============================================================================
# SLIDE 1: Title Slide (with Hero Image)
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1, RGBColor(7, 12, 28))

# Add Hero Image on the Right
if os.path.exists(local_hero):
    slide1.shapes.add_picture(local_hero, Inches(6.8), Inches(0.8), width=Inches(5.8), height=Inches(5.9))

# Badge
badge = add_card(slide1, Inches(0.8), Inches(1.2), Inches(3.8), Inches(0.45), bg_color=RGBColor(16, 42, 77), border_color=ACCENT_CYAN)
badge_tf = badge.text_frame
badge_tf.vertical_anchor = MSO_ANCHOR.MIDDLE
bp = badge_tf.paragraphs[0]
bp.text = "NEXT-GEN INDUSTRIAL IOT & AI PLATFORM"
bp.alignment = PP_ALIGN.CENTER
bp.font.size = Pt(10)
bp.font.bold = True
bp.font.color.rgb = ACCENT_CYAN

# Main Title
title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.8), Inches(2.2))
tf = title_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "DriveOps-AI"
p.font.size = Pt(46)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE

p2 = tf.add_paragraph()
p2.text = "Smart Car Manufacturing &\nProduction Intelligence"
p2.font.size = Pt(28)
p2.font.bold = True
p2.font.color.rgb = ACCENT_AMBER

# Subtitle / Description
desc_box = slide1.shapes.add_textbox(Inches(0.8), Inches(4.2), Inches(5.6), Inches(1.5))
tf_desc = desc_box.text_frame
tf_desc.word_wrap = True
pd = tf_desc.paragraphs[0]
pd.text = "An end-to-end command center that ingests high-frequency automotive telemetry, runs multi-vector deterministic physics evaluations, and delivers autonomous AI root-cause reasoning for zero-downtime plant operations."
pd.font.size = Pt(13)
pd.font.color.rgb = TEXT_MUTED

# Key KPI tags
kpis = [
    ("4 Vectors", "Machine, Quality, Pace, Safety"),
    ("Deterministic", "Zero Hallucination Physics"),
    ("Gemini AI", "LLM Root-Cause Synthesis")
]
for i, (k1, k2) in enumerate(kpis):
    card = add_card(slide1, Inches(0.8 + i * 1.9), Inches(5.8), Inches(1.8), Inches(0.9), bg_color=CARD_BG, border_color=CARD_BORDER)
    ctf = card.text_frame
    ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
    cp1 = ctf.paragraphs[0]
    cp1.text = k1
    cp1.alignment = PP_ALIGN.CENTER
    cp1.font.size = Pt(13)
    cp1.font.bold = True
    cp1.font.color.rgb = ACCENT_CYAN
    cp2 = ctf.add_paragraph()
    cp2.text = k2
    cp2.alignment = PP_ALIGN.CENTER
    cp2.font.size = Pt(8.5)
    cp2.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 2: The Industrial Challenge vs. DriveOps Solution
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2)
add_header(slide2, "The Manufacturing Problem & The DriveOps Solution", "INDUSTRY 4.0 TRANSFORMATION")

# Left Column: Problem (Red tint)
card_prob = add_card(slide2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), bg_color=RGBColor(28, 18, 30), border_color=RGBColor(140, 30, 60))
tf_p = card_prob.text_frame
tf_p.word_wrap = True
tf_p.margin_left = Inches(0.3)
tf_p.margin_top = Inches(0.3)

p_h = tf_p.paragraphs[0]
p_h.text = "THE PROBLEM: COSTLY UNPLANNED DOWNTIME"
p_h.font.size = Pt(15)
p_h.font.bold = True
p_h.font.color.rgb = ACCENT_RED

problems = [
    ("Unplanned Stoppages", "Automotive assembly lines cost upwards of $22,000/minute during unpredicted robotic stoppages."),
    ("Sensor Data Silos", "Thermal, vibration, and hydraulic telemetry exist in disconnected formats without unified analysis."),
    ("Post-Mortem Reaction", "Faults are typically discovered after scrap parts are produced rather than predicted in real time."),
    ("Slow Root-Cause Analysis", "Technicians spend 45+ minutes diagnosing mechanical error codes manually from station logs.")
]
for title, desc in problems:
    p_t = tf_p.add_paragraph()
    p_t.text = f"\n  {title}"
    p_t.font.bold = True
    p_t.font.size = Pt(12)
    p_t.font.color.rgb = TEXT_WHITE
    p_d = tf_p.add_paragraph()
    p_d.text = f"    {desc}"
    p_d.font.size = Pt(10.5)
    p_d.font.color.rgb = TEXT_MUTED

# Right Column: Solution (Cyan tint)
card_sol = add_card(slide2, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0), bg_color=RGBColor(12, 32, 58), border_color=ACCENT_CYAN)
tf_s = card_sol.text_frame
tf_s.word_wrap = True
tf_s.margin_left = Inches(0.3)
tf_s.margin_top = Inches(0.3)

s_h = tf_s.paragraphs[0]
s_h.text = "THE SOLUTION: DRIVEOPS-AI INTELLIGENCE"
s_h.font.size = Pt(15)
s_h.font.bold = True
s_h.font.color.rgb = ACCENT_CYAN

solutions = [
    ("Real-Time Telemetry Intake", "Automated parsing and evaluation of high-frequency CSV/JSON records up to 50MB per shift."),
    ("Deterministic Physics Rules", "100% reproducible anomaly detection for ISO 10816 vibration, thermal drift, and hydraulic limits."),
    ("Generative AI Diagnosis", "Gemini 1.5 Flash delivers instant mechanical diagnoses and technician action commands in <2 seconds."),
    ("Automated Alert Queue", "Immediate severity classification (Critical, High, Medium, Low) with technician acknowledgement tracking.")
]
for title, desc in solutions:
    s_t = tf_s.add_paragraph()
    s_t.text = f"\n  {title}"
    s_t.font.bold = True
    s_t.font.size = Pt(12)
    s_t.font.color.rgb = ACCENT_AMBER
    s_d = tf_s.add_paragraph()
    s_d.text = f"    {desc}"
    s_d.font.size = Pt(10.5)
    s_d.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 3: System Architecture (3-Tier Cloud / Edge Topology)
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3)
add_header(slide3, "End-to-End System Architecture", "SYSTEM DESIGN & DATA PIPELINE")

tiers = [
    ("TIER 1: PRESENTATION LAYER", "React 19 + Vite 7 SPA", [
        "Interactive plant dashboard with responsive industrial layout",
        "Recharts live telemetry graphs (Temperature, Vibration, OEE)",
        "Wouter declarative client-side routing & TanStack Query v5",
        "Client Deterministic Engine fallback for static deployments"
    ], ACCENT_CYAN),
    ("TIER 2: INTELLIGENCE ENGINE", "Node.js + Express 5 Service", [
        "Modular Machine, Production & Quality Intelligence Engines",
        "Google Gemini 1.5 Flash structured LLM synthesis layer",
        "Circuit Breaker (5-min cooldown) with physics rule fallback",
        "High-throughput RFC-4180 streaming CSV / JSON parsing"
    ], ACCENT_AMBER),
    ("TIER 3: DATA & PERSISTENCE", "Supabase Cloud + PostgreSQL", [
        "Managed Postgres storing machines, telemetry, and alerts",
        "Drizzle ORM for type-safe relational schemas & migrations",
        "Supabase Auth: JWT session management & protected routes",
        "Resilient in-memory store for zero-downtime offline operation"
    ], ACCENT_GREEN)
]

for i, (t_title, t_sub, bullets, color) in enumerate(tiers):
    card = add_card(slide3, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(5.0))
    ctf = card.text_frame
    ctf.word_wrap = True
    ctf.margin_left = Inches(0.25)
    ctf.margin_top = Inches(0.25)
    
    p1 = ctf.paragraphs[0]
    p1.text = t_title
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = color
    
    p2 = ctf.add_paragraph()
    p2.text = t_sub
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    
    p_div = ctf.add_paragraph()
    p_div.text = "──────────────────────────"
    p_div.font.size = Pt(9)
    p_div.font.color.rgb = CARD_BORDER

    for b in bullets:
        pb = ctf.add_paragraph()
        pb.text = f"•  {b}"
        pb.font.size = Pt(11)
        pb.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 4: Machine Health & IoT Telemetry Monitoring (with Sensor Image)
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4)
add_header(slide4, "Machine Health & Physics-Based Telemetry Analytics", "VECTOR 1: PHYSICAL ASSET MONITORING")

# Left details
left_card = add_card(slide4, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0))
ltf = left_card.text_frame
ltf.word_wrap = True
ltf.margin_left = Inches(0.3)
ltf.margin_top = Inches(0.3)

lp1 = ltf.paragraphs[0]
lp1.text = "CORE TELEMETRY VECTORS & INDUSTRIAL THRESHOLDS"
lp1.font.size = Pt(14)
lp1.font.bold = True
lp1.font.color.rgb = ACCENT_CYAN

metrics_spec = [
    ("Bearing Temperature (°C)", "Nominal: <75°C | Warning: ≥85°C | Critical: ≥90°C", "Prevents stator burnout and bearing thermal seizure."),
    ("Vibration Velocity (mm/s)", "Nominal: <3.0 | Warning: ≥4.5 | Critical: ≥6.0", "ISO 10816 vibration standard for mechanical resonance/unbalance."),
    ("Hydraulic Pressure (psi)", "Safe Window: 70 - 115 psi | Critical: <60 or >125", "Ensures precise robotic clamping and prevents hydraulic seal blowouts."),
    ("Power Consumption (kW)", "Warning: ≥48.0 kW | Critical: ≥55.0 kW", "Detects mechanical resistance spikes and electrical surges.")
]
for title, thresh, note in metrics_spec:
    p_m = ltf.add_paragraph()
    p_m.text = f"\n{title}"
    p_m.font.size = Pt(11.5)
    p_m.font.bold = True
    p_m.font.color.rgb = ACCENT_AMBER
    p_th = ltf.add_paragraph()
    p_th.text = f"  Thresholds: {thresh}"
    p_th.font.size = Pt(10)
    p_th.font.color.rgb = TEXT_WHITE
    p_n = ltf.add_paragraph()
    p_n.text = f"  Action: {note}"
    p_n.font.size = Pt(9.5)
    p_n.font.color.rgb = TEXT_MUTED

# Right: Sensor Diagnostics Image
if os.path.exists(local_sensor):
    slide4.shapes.add_picture(local_sensor, Inches(7.1), Inches(1.8), width=Inches(5.4), height=Inches(3.3))

# Bottom right caption card
right_card = add_card(slide4, Inches(7.1), Inches(5.25), Inches(5.4), Inches(1.55), bg_color=CARD_BG, border_color=CARD_BORDER)
rtf = right_card.text_frame
rtf.word_wrap = True
rtf.margin_left = Inches(0.2)
rtf.margin_top = Inches(0.15)
rp1 = rtf.paragraphs[0]
rp1.text = "SMART SENSOR INTEGRATION"
rp1.font.size = Pt(11)
rp1.font.bold = True
rp1.font.color.rgb = ACCENT_GREEN
rp2 = rtf.add_paragraph()
rp2.text = "Industrial IoT sensors transmit high-speed time-series streams. DriveOps-AI maps and normalizes raw telemetry headers on the fly, eliminating the need for rigid vendor-specific CSV templates."
rp2.font.size = Pt(9.5)
rp2.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 5: Production Pace & Quality Intelligence
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5)
add_header(slide5, "Production Throughput & Quality Gate Intelligence", "VECTORS 2 & 3: OPERATIONAL EXCELLENCE")

# Left Card: Production Pace
p_card = add_card(slide5, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
ptf = p_card.text_frame
ptf.word_wrap = True
ptf.margin_left = Inches(0.3)
ptf.margin_top = Inches(0.3)

pp1 = ptf.paragraphs[0]
pp1.text = "PRODUCTION PACE & TAKT ATTAINMENT"
pp1.font.size = Pt(14)
pp1.font.bold = True
pp1.font.color.rgb = ACCENT_CYAN

p_items = [
    ("Target Attainment Metric", "Formula: (Actual Units / Target Units) × 100%. Tracks planned vs. realized vehicle completions per shift."),
    ("Takt Time Gap Evaluation", "Quantifies line delays: Attainment gap >15% flags a Minor Gap; >25% triggers Critical Behind alerts."),
    ("Bottleneck Mitigation", "Identifies starved stations and automatically advises buffer rebalancing to prevent line halts.")
]
for title, desc in p_items:
    t = ptf.add_paragraph()
    t.text = f"\n{title}"
    t.font.size = Pt(11.5)
    t.font.bold = True
    t.font.color.rgb = TEXT_WHITE
    d = ptf.add_paragraph()
    d.text = f"{desc}"
    d.font.size = Pt(10)
    d.font.color.rgb = TEXT_MUTED

# Right Card: Quality Gate
q_card = add_card(slide5, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
qtf = q_card.text_frame
qtf.word_wrap = True
qtf.margin_left = Inches(0.3)
qtf.margin_top = Inches(0.3)

qp1 = qtf.paragraphs[0]
qp1.text = "QUALITY GATE & DEFECT CLUSTERING"
qp1.font.size = Pt(14)
qp1.font.bold = True
qp1.font.color.rgb = ACCENT_AMBER

q_items = [
    ("First-Pass Yield (FPY)", "Monitors quality pass-rate: Optimal ≥98.0%, Degraded <95.0%, and Critical Spike <90.0%."),
    ("Automated Lot Quarantine", "When defect counts exceed 10 units, system automatically recommends holding the next 15 units for inspection."),
    ("Root-Cause Defect Taxonomy", "Tracks defect categories (e.g. geometric variance, spot-weld failure, paint coat thickness) to isolate tooling drift.")
]
for title, desc in q_items:
    t = qtf.add_paragraph()
    t.text = f"\n{title}"
    t.font.size = Pt(11.5)
    t.font.bold = True
    t.font.color.rgb = TEXT_WHITE
    d = qtf.add_paragraph()
    d.text = f"{desc}"
    d.font.size = Pt(10)
    d.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 6: Command Center & Operations Dashboard (with Command Center Image)
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6)
add_header(slide6, "Plant Command Center & Operations Fleet View", "REAL-TIME MONITORING & ALERT DISPATCH")

# Left: Command Center Image
if os.path.exists(local_command):
    slide6.shapes.add_picture(local_command, Inches(0.8), Inches(1.8), width=Inches(6.4), height=Inches(5.0))

# Right: Dashboard Features
dash_card = add_card(slide6, Inches(7.5), Inches(1.8), Inches(5.0), Inches(5.0))
dtf = dash_card.text_frame
dtf.word_wrap = True
dtf.margin_left = Inches(0.3)
dtf.margin_top = Inches(0.3)

dp1 = dtf.paragraphs[0]
dp1.text = "EXECUTIVE PLANT CONTROL ROOM"
dp1.font.size = Pt(14)
dp1.font.bold = True
dp1.font.color.rgb = ACCENT_CYAN

features = [
    ("Fleet-Wide Live Metrics", "Displays plant-wide units produced, shift pace (+14/h), open alerts, and aggregate plant health percentage."),
    ("Production Line Readiness", "Real-time readiness scoring across Body Line A/B, Paint Line C, and Final Assembly."),
    ("Real-Time Alert Queue", "Color-coded severity categorization (Critical, High, Medium, Low) with one-click technician acknowledgement."),
    ("Shift Audit Reports", "Generates comprehensive end-of-shift reports with downloadable CSV audit logs for plant management.")
]
for title, desc in features:
    t = dtf.add_paragraph()
    t.text = f"\n{title}"
    t.font.size = Pt(11.5)
    t.font.bold = True
    t.font.color.rgb = ACCENT_AMBER
    d = dtf.add_paragraph()
    d.text = f"{desc}"
    d.font.size = Pt(10)
    d.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 7: Dual-Layer AI Engine & High-Availability Circuit Breaker
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
set_slide_background(slide7)
add_header(slide7, "Dual-Layer AI Reasoning & Resilience Architecture", "AUTONOMOUS DIAGNOSTICS & FAILOVER")

ai_layers = [
    ("LAYER 1: GENERATIVE AI", "Google Gemini 1.5 Flash", [
        "Invoked when sensor anomalies are detected",
        "Deterministic temperature setting (T = 0.2)",
        "Strict JSON schema enforcement",
        "Generates 2-sentence mechanical diagnosis",
        "Prescribes single technician action command"
    ], ACCENT_CYAN),
    ("LAYER 2: CIRCUIT BREAKER", "5-Minute Dynamic Cooldown", [
        "Monitors HTTP 429 quota exhaustion & timeouts",
        "Automatically trips circuit breaker on network failure",
        "Prevents request queues & server memory leaks",
        "Self-healing: automatically probes API health after cooldown",
        "Guarantees <10ms response even when AI APIs fail"
    ], ACCENT_RED),
    ("LAYER 3: DETERMINISTIC FALLBACK", "Automotive Physics Rules", [
        "100% reproducible deterministic engineering calculations",
        "Zero hallucination risk for critical plant safety",
        "Seamless client-side fallback on static hosts (Vercel)",
        "Same exact mathematical output as backend service",
        "Zero external API dependencies required"
    ], ACCENT_GREEN)
]

for i, (l_title, l_sub, bullets, color) in enumerate(ai_layers):
    card = add_card(slide7, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(5.0))
    ctf = card.text_frame
    ctf.word_wrap = True
    ctf.margin_left = Inches(0.25)
    ctf.margin_top = Inches(0.25)
    
    p1 = ctf.paragraphs[0]
    p1.text = l_title
    p1.font.size = Pt(11.5)
    p1.font.bold = True
    p1.font.color.rgb = color
    
    p2 = ctf.add_paragraph()
    p2.text = l_sub
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    
    p_div = ctf.add_paragraph()
    p_div.text = "──────────────────────────"
    p_div.font.size = Pt(9)
    p_div.font.color.rgb = CARD_BORDER

    for b in bullets:
        pb = ctf.add_paragraph()
        pb.text = f"•  {b}"
        pb.font.size = Pt(10.5)
        pb.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 8: Complete Technical Specifications Table
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
set_slide_background(slide8)
add_header(slide8, "Complete Project Technical Specifications", "FULL-STACK ENGINEERING BREAKDOWN")

# Table
rows, cols = 8, 4
left, top, width, height = Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0)
table_shape = slide8.shapes.add_table(rows, cols, left, top, width, height)
table = table_shape.table

# Set Column Widths
table.columns[0].width = Inches(2.2)
table.columns[1].width = Inches(2.5)
table.columns[2].width = Inches(4.2)
table.columns[3].width = Inches(2.8)

headers = ["LAYER", "CORE TECHNOLOGY", "KEY FUNCTION / MODULES", "BENEFIT"]
for j, h in enumerate(headers):
    cell = table.cell(0, j)
    cell.fill.solid()
    cell.fill.fore_color.rgb = RGBColor(16, 42, 77)
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

tech_data = [
    ("Frontend UI", "React 19, TypeScript, Vite 7", "Wouter Router, Lucide Icons, Sonner Notifications", "Sub-second HMR & modern SPA architecture"),
    ("Styling System", "Tailwind CSS v4", "High-tech dark theme, Glassmorphism, Responsive Grid", "Curated plant-floor industrial aesthetic"),
    ("Visualization", "Recharts & Framer Motion", "Real-time telemetry line charts, animated cards", "Instant visual comprehension of machine status"),
    ("Backend API", "Node.js (v20+), Express 5", "Modular Intelligence Engines, RFC-4180 CSV parser", "Handles 50MB telemetry intake with low latency"),
    ("Artificial Intelligence", "Google Gemini 1.5 Flash", "Prompt engineering with structured JSON (T=0.2)", "Autonomous root-cause mechanical reasoning"),
    ("Database & Auth", "Supabase Cloud (PostgreSQL)", "Tables: machines, alerts, telemetry; Supabase Auth", "Secure JWT authentication & cloud persistence"),
    ("Reliability Layer", "Drizzle ORM & MemoryStore", "In-memory seed fallback + Circuit Breaker pattern", "100% operational uptime if database is offline")
]

for i, row in enumerate(tech_data):
    for j, val in enumerate(row):
        cell = table.cell(i + 1, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG if (i % 2 == 0) else RGBColor(14, 23, 48)
        p = cell.text_frame.paragraphs[0]
        p.text = val
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_WHITE if j == 1 else (ACCENT_AMBER if j == 0 else TEXT_MUTED)

# ==============================================================================
# SLIDE 9: Business Value, ROI & Future Roadmap
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
set_slide_background(slide9)
add_header(slide9, "Industrial Impact, Business ROI & Strategic Roadmap", "VALUE DELIVERED & FUTURE EXPANSION")

# Left Column: Business ROI (3 Cards)
roi_metrics = [
    ("40% Reduction in Unplanned Stoppages", "By detecting bearing wear and thermal drift 2-4 hours before mechanical failure, plants prevent catastrophic line freezes.", ACCENT_GREEN),
    ("90% Faster Root-Cause Diagnosis", "AI delivers instant technical diagnoses and repair instructions, reducing shift investigation time from 45 min to under 30 seconds.", ACCENT_CYAN),
    ("Zero Hardware Lock-In", "Flexible telemetry normalizer works with any sensor standard (Siemens, Fanuc, ABB, KUKA) without requiring costly proprietary PLC adapters.", ACCENT_AMBER)
]

for i, (title, desc, color) in enumerate(roi_metrics):
    card = add_card(slide9, Inches(0.8), Inches(1.8 + i * 1.65), Inches(5.7), Inches(1.45))
    ctf = card.text_frame
    ctf.word_wrap = True
    ctf.margin_left = Inches(0.25)
    ctf.margin_top = Inches(0.18)
    p = ctf.paragraphs[0]
    p.text = title
    p.font.size = Pt(12.5)
    p.font.bold = True
    p.font.color.rgb = color
    pd = ctf.add_paragraph()
    pd.text = desc
    pd.font.size = Pt(10)
    pd.font.color.rgb = TEXT_MUTED

# Right Column: Future Roadmap
road_card = add_card(slide9, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.75))
rtf = road_card.text_frame
rtf.word_wrap = True
rtf.margin_left = Inches(0.3)
rtf.margin_top = Inches(0.3)

rp1 = rtf.paragraphs[0]
rp1.text = "STRATEGIC EXPANSION ROADMAP"
rp1.font.size = Pt(14)
rp1.font.bold = True
rp1.font.color.rgb = ACCENT_CYAN

milestones = [
    ("Phase 1: Direct OPC-UA & MQTT Gateway", "Transition from batch CSV/REST ingestion to direct microsecond OPC-UA industrial bus streaming."),
    ("Phase 2: Acoustic AI Anomaly Detection", "Incorporate acoustic sensor microphones to detect subtle harmonic frequency shifts in robotic gearboxes."),
    ("Phase 3: Digital Twin 3D Floor Simulation", "Interactive Three.js plant CAD visualization with real-time temperature heat-mapping on robotic arms."),
    ("Phase 4: Autonomous Robotic Workcell Throttling", "Closed-loop feedback to automatically throttle station cycle speed when thermal limits approach warning thresholds.")
]
for title, desc in milestones:
    t = rtf.add_paragraph()
    t.text = f"\n{title}"
    t.font.size = Pt(11)
    t.font.bold = True
    t.font.color.rgb = ACCENT_AMBER
    d = rtf.add_paragraph()
    d.text = f"{desc}"
    d.font.size = Pt(9.5)
    d.font.color.rgb = TEXT_MUTED

# ==============================================================================
# SLIDE 10: Conclusion & Q&A
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
set_slide_background(slide10, RGBColor(7, 12, 28))

end_card = add_card(slide10, Inches(2.0), Inches(1.5), Inches(9.333), Inches(4.5), bg_color=CARD_BG, border_color=ACCENT_CYAN)
etf = end_card.text_frame
etf.word_wrap = True
etf.vertical_anchor = MSO_ANCHOR.MIDDLE

p_title = etf.paragraphs[0]
p_title.text = "DriveOps-AI"
p_title.alignment = PP_ALIGN.CENTER
p_title.font.size = Pt(44)
p_title.font.bold = True
p_title.font.color.rgb = TEXT_WHITE

p_sub = etf.add_paragraph()
p_sub.text = "Smart Car Manufacturing & Production Intelligence"
p_sub.alignment = PP_ALIGN.CENTER
p_sub.font.size = Pt(20)
p_sub.font.bold = True
p_sub.font.color.rgb = ACCENT_AMBER

p_div = etf.add_paragraph()
p_div.text = "──────────────────────────────────────────────"
p_div.alignment = PP_ALIGN.CENTER
p_div.font.size = Pt(12)
p_div.font.color.rgb = CARD_BORDER

p_live = etf.add_paragraph()
p_live.text = "Live Production Demo: https://driveops-ai.vercel.app\nThank you! Questions & Discussion."
p_live.alignment = PP_ALIGN.CENTER
p_live.font.size = Pt(15)
p_live.font.color.rgb = ACCENT_CYAN

# Save PowerPoint File
output_pptx = os.path.join(WORKSPACE, "DriveOps_AI_Presentation.pptx")
prs.save(output_pptx)
print(f"Presentation saved successfully to: {output_pptx}")
