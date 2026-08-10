"""
SupportOps Copilot — iOS 26 "Liquid Glass" styled Streamlit app.

Flow:
  Opening screen  -> Sign Up / Log In
  Sign Up         -> stores user in users.csv -> auto redirect to Sign In
  Sign In         -> validates against users.csv -> Dashboard
  Dashboard       -> sidebar (glass, sliding/collapsible) with:
                     - Welcome header
                     - Analyze Ticket   (single ticket -> JSON, like original)
                     - Quick Fill       (circular sample buttons)
                     - History / Logs   (every ticket ever analyzed, in every view)
                     - Batch Summary    (CSV upload -> metrics + table + JSON)
                     - Comparison Table (category x priority crosstab)
                     - Sign Out         (bottom of sidebar)

Run with:  streamlit run app.py
"""

import hashlib
import json
import os
import re
from datetime import datetime
from types import SimpleNamespace

import pandas as pd
import streamlit as st

# ============================================================================
# CONFIG / CONSTANTS
# ============================================================================

st.set_page_config(
    page_title="SupportOps",
    page_icon="💬",
    layout="wide",
    initial_sidebar_state="collapsed",
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, "users.csv")
LOGS_FILE = os.path.join(BASE_DIR, "ticket_logs.csv")

ALLOWED_CATEGORIES = [
    "billing",
    "technical_bug",
    "account_access",
    "refund",
    "shipping",
    "feature_request",
    "other",
]

ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"]
ALLOWED_SENTIMENTS = ["negative", "neutral", "positive"]

SAMPLE_TICKETS = {
    "billing": "I was charged twice for my order and need this corrected as soon as possible.",
    "technical_bug": "The mobile app crashes every time I try to open the checkout screen.",
    "account_access": "I cannot log in to my account because the password reset link is not working.",
    "refund": "I would like a refund for the damaged item I received yesterday.",
    "shipping": "My package still shows in transit and the tracking number has not updated in days.",
    "feature_request": "Please add a dark mode option to the dashboard and a way to export reports.",
    "other": "I have a general question about your support process.",
}

SAMPLE_ICONS = {
    "billing": "💳",
    "technical_bug": "🐞",
    "account_access": "🔑",
    "refund": "💰",
    "shipping": "📦",
    "feature_request": "✨",
    "other": "❓",
}

NAV_ITEMS = [
    ("analyze", "🎫", "Analyze Ticket"),
    ("quickfill", "🎯", "Quick Fill"),
    ("history", "🕘", "History / Logs"),
    ("batch", "📊", "Batch Summary"),
    ("compare", "📈", "Comparison Table"),
]

# ============================================================================
# CORE CLASSIFICATION HELPERS (rule based, fully self-contained — no external
# LLM / extract module required so this file runs standalone)
# ============================================================================


def _normalize_label(value, allowed_values, fallback):
    if not value:
        return fallback

    normalized = str(value).strip().lower().replace(" ", "_")
    if normalized in allowed_values:
        return normalized

    aliases = {
        "billing": "billing",
        "payment": "billing",
        "refunds": "refund",
        "returns": "refund",
        "shipping": "shipping",
        "delivery": "shipping",
        "account": "account_access",
        "login": "account_access",
        "technical": "technical_bug",
        "bug": "technical_bug",
        "feature": "feature_request",
        "general": "other",
    }
    return aliases.get(normalized, fallback)


def _detect_pii(ticket):
    detected = []

    if re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", ticket):
        detected.append("email")

    if re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", ticket):
        detected.append("phone")

    address_keywords = [
        "street", "st.", "road", "rd.", "avenue", "ave.", "lane", "ln.",
        "address", "apartment", "zip", "postal",
    ]
    if any(keyword in ticket.lower() for keyword in address_keywords):
        detected.append("address")

    return detected


def _infer_product(ticket):
    text = ticket.lower()
    product_rules = [
        ("mobile app", ["mobile app", "ios", "android", "app"]),
        ("website", ["website", "site", "web app", "portal"]),
        ("checkout", ["checkout", "cart", "payment"]),
        ("subscription", ["subscription", "plan", "renewal"]),
        ("order", ["order", "tracking", "shipment", "delivery"]),
        ("account", ["account", "login", "password", "profile"]),
    ]
    for product, keywords in product_rules:
        if any(keyword in text for keyword in keywords):
            return product
    return None


def _missing_information(ticket, category):
    missing = []
    lower_ticket = ticket.lower()

    if not re.search(r"\b(order|order\s*#|order\s*id|txn|transaction)[:#\-\s]*[\w-]+", lower_ticket):
        if category in {"billing", "refund", "shipping"}:
            missing.append("order_id")

    if not re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", ticket):
        if category in {"account_access", "technical_bug"}:
            missing.append("email")

    if category == "shipping" and not any(t in lower_ticket for t in ["address", "street", "apt", "suite", "zip"]):
        missing.append("shipping_address")

    if category == "refund" and not any(t in lower_ticket for t in ["receipt", "transaction", "payment", "card"]):
        missing.append("payment_reference")

    return missing


def _safe_reply(category, priority, refund_request, missing_information):
    if refund_request:
        return "Thanks for reaching out. We are reviewing your refund request and will next verify the order or payment details."
    if category == "account_access":
        return "Thanks for reaching out. We are checking your account access issue and will help restore access once we confirm the missing details."
    if category == "technical_bug":
        return "Thanks for reporting this issue. We are reviewing the bug and will follow up with the next safe troubleshooting steps."
    if category == "shipping":
        return "Thanks for the update. We are checking the shipment status and will confirm what information we still need from you."
    if priority in {"high", "urgent"} or missing_information:
        return "Thanks for contacting support. We are reviewing this as a priority and will follow up once we have the remaining details."
    return "Thanks for contacting support. We are reviewing your request and will follow up with the next steps."


def classify_ticket(ticket):
    """Lightweight rule-based classifier (stands in for an LLM call)."""
    text = ticket.lower()

    category_rules = [
        ("refund", ["refund", "chargeback", "charge back", "money back"]),
        ("billing", ["charged", "charge", "bill", "invoice", "overcharged"]),
        ("shipping", ["shipping", "package", "delivery", "tracking", "shipment", "in transit"]),
        ("account_access", ["log in", "login", "password", "cannot access", "locked out", "reset link"]),
        ("technical_bug", ["crash", "bug", "error", "not working", "broken", "glitch"]),
        ("feature_request", ["feature", "please add", "suggestion", "would be nice", "request that"]),
    ]
    category = "other"
    for cat, keywords in category_rules:
        if any(k in text for k in keywords):
            category = cat
            break

    if any(w in text for w in ["urgent", "immediately", "asap", "critical", "right now"]):
        priority = "urgent"
    elif any(w in text for w in ["as soon as possible", "important", "cannot", "can't", "broken", "crash", "crashes"]):
        priority = "high"
    elif any(w in text for w in ["no rush", "whenever", "just wondering", "no hurry"]):
        priority = "low"
    else:
        priority = "medium"

    if any(w in text for w in ["angry", "frustrated", "unacceptable", "worst", "disappointed", "terrible", "awful"]):
        sentiment = "negative"
    elif any(w in text for w in ["thanks", "thank you", "great", "love", "happy", "appreciate"]):
        sentiment = "positive"
    else:
        sentiment = "neutral"

    return SimpleNamespace(category=category, priority=priority, sentiment=sentiment)


def _estimate_confidence(ticket, result):
    score = 0.55
    if result is not None:
        score += 0.2
    if len(ticket.split()) > 12:
        score += 0.08
    if _detect_pii(ticket):
        score += 0.05
    if result is not None and str(getattr(result, "category", "")).strip():
        score += 0.07
    return round(min(score, 0.99), 2)


def build_response(ticket):
    result = classify_ticket(ticket)

    category = _normalize_label(getattr(result, "category", None), ALLOWED_CATEGORIES, "other")
    priority = _normalize_label(getattr(result, "priority", None), ALLOWED_PRIORITIES, "medium")
    sentiment = _normalize_label(getattr(result, "sentiment", None), ALLOWED_SENTIMENTS, "neutral")

    refund_request = any(
        k in ticket.lower()
        for k in ["refund", "chargeback", "charge back", "charged twice", "return my money", "money back"]
    )

    missing_information = _missing_information(ticket, category)

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "sla_risk": priority in {"high", "urgent"},
        "product": _infer_product(ticket),
        "customer_request": ticket.strip(),
        "missing_information": missing_information,
        "refund_request": refund_request,
        "pii_detected": _detect_pii(ticket),
        "safe_reply": _safe_reply(category, priority, refund_request, missing_information),
        "confidence": _estimate_confidence(ticket, result),
    }


# ============================================================================
# PERSISTENCE — users.csv / ticket_logs.csv
# ============================================================================


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def load_users() -> pd.DataFrame:
    if not os.path.exists(USERS_FILE):
        return pd.DataFrame(columns=["username", "password_hash", "created_at"])
    return pd.read_csv(USERS_FILE)


def username_exists(username: str) -> bool:
    users = load_users()
    return username.strip().lower() in users["username"].astype(str).str.lower().values


def save_user(username: str, password: str) -> None:
    users = load_users()
    new_row = pd.DataFrame([{
        "username": username.strip(),
        "password_hash": _hash_password(password),
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }])
    users = pd.concat([users, new_row], ignore_index=True)
    users.to_csv(USERS_FILE, index=False)


def verify_user(username: str, password: str) -> bool:
    users = load_users()
    if users.empty:
        return False
    match = users[users["username"].astype(str).str.lower() == username.strip().lower()]
    if match.empty:
        return False
    return match.iloc[0]["password_hash"] == _hash_password(password)


def log_ticket(username: str, response: dict) -> None:
    row = {"timestamp": datetime.now().isoformat(timespec="seconds"), "username": username}
    row.update(response)
    row["missing_information"] = ";".join(response.get("missing_information", []))
    row["pii_detected"] = ";".join(response.get("pii_detected", []))

    if os.path.exists(LOGS_FILE):
        logs = pd.read_csv(LOGS_FILE)
        logs = pd.concat([logs, pd.DataFrame([row])], ignore_index=True)
    else:
        logs = pd.DataFrame([row])
    logs.to_csv(LOGS_FILE, index=False)


def load_logs() -> pd.DataFrame:
    if not os.path.exists(LOGS_FILE):
        return pd.DataFrame()
    return pd.read_csv(LOGS_FILE)


# ============================================================================
# iOS 26 "LIQUID GLASS" THEME
# ============================================================================

IOS_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: -apple-system, "SF Pro Display", "SF Pro Text", Inter, sans-serif;
    color: #f2f2f7;
}

/* ---------- True black iOS 26 "Liquid Glass" dark background ---------- */
.stApp {
    background:
        radial-gradient(circle at 12% 8%, rgba(80, 80, 255, 0.10) 0%, transparent 40%),
        radial-gradient(circle at 88% 4%, rgba(255, 45, 146, 0.08) 0%, transparent 38%),
        radial-gradient(circle at 50% 100%, rgba(48, 209, 174, 0.07) 0%, transparent 42%),
        linear-gradient(160deg, #050506 0%, #0b0b0d 45%, #000000 100%);
    background-attachment: fixed;
    color: #f2f2f7;
}

#MainMenu, footer, header {visibility: hidden;}

h1, h2, h3, h4, h5, p, span, label, div { color: #f2f2f7; }
.stCaption, [data-testid="stCaptionContainer"] { color: #9a9aa2 !important; }

/* ---------- Generic dark glass panel ---------- */
.glass-panel {
    background: rgba(255, 255, 255, 0.055);
    backdrop-filter: blur(28px) saturate(150%);
    -webkit-backdrop-filter: blur(28px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 26px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.06);
    padding: 28px 30px;
    transition: all 0.35s cubic-bezier(.2,.8,.2,1);
}
.glass-panel:hover {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.10);
    transform: translateY(-2px);
}

/* ---------- Buttons everywhere -> dark glass pills ---------- */
div[data-testid="stButton"] > button, div[data-testid="stFormSubmitButton"] > button {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    color: #f2f2f7;
    font-weight: 600;
    padding: 0.55em 1.4em;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
    transition: all 0.25s ease;
}
div[data-testid="stButton"] > button:hover, div[data-testid="stFormSubmitButton"] > button:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.28);
    color: #ffffff;
    box-shadow: 0 8px 26px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset;
    transform: translateY(-1px) scale(1.015);
}
div[data-testid="stButton"] > button:active {
    transform: scale(0.97);
}

/* Primary CTA buttons (Sign Up / Log In on opening screen) */
.st-key-btn_go_signup button, .st-key-btn_go_signin button {
    width: 100%;
    padding: 0.9em 1em;
    font-size: 1.05rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255,255,255,0.18);
    color: #ffffff;
}
.st-key-btn_go_signup button:hover, .st-key-btn_go_signin button:hover {
    background: rgba(255,255,255,0.22);
    box-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 0 24px rgba(120,120,255,0.18);
    transform: translateY(-2px) scale(1.01);
}

/* Close / cross button */
.st-key-btn_close button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    padding: 0;
    font-weight: 700;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.14);
}
.st-key-btn_close button:hover {
    background: rgba(255, 69, 58, 0.85);
    border-color: rgba(255,69,58,0.9);
    color: white;
}

/* Text-link style buttons (switch signup/signin) */
.st-key-btn_switch_link button {
    background: transparent;
    border: none;
    box-shadow: none;
    color: #6ea8ff;
    font-weight: 600;
    padding: 0.2em 0;
}
.st-key-btn_switch_link button:hover {
    background: transparent;
    color: #a5c8ff;
    text-decoration: underline;
    transform: none;
    box-shadow: none;
}

/* Sign out button */
.st-key-btn_signout button {
    width: 100%;
    background: rgba(255, 69, 58, 0.10);
    color: #ff6961;
    border: 1px solid rgba(255,69,58,0.28);
}
.st-key-btn_signout button:hover {
    background: rgba(255, 69, 58, 0.85);
    color: white;
    border-color: rgba(255,69,58,0.9);
}

/* Sidebar nav buttons: full width, dark glass, hover fills like frosted glass lighting up */
.st-key-nav_analyze button, .st-key-nav_quickfill button, .st-key-nav_history button,
.st-key-nav_batch button, .st-key-nav_compare button {
    width: 100%;
    text-align: left;
    justify-content: flex-start;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 6px;
}
.st-key-nav_analyze button:hover, .st-key-nav_quickfill button:hover, .st-key-nav_history button:hover,
.st-key-nav_batch button:hover, .st-key-nav_compare button:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.22);
    color: #ffffff;
    transform: translateX(3px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
}

/* Circular quick-fill buttons */
div[class*="st-key-qf_"] button {
    border-radius: 50%;
    width: 84px;
    height: 84px;
    font-size: 1.6rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}
div[class*="st-key-qf_"] button:hover {
    background: rgba(255,255,255,0.22);
    border-color: rgba(255,255,255,0.35);
    transform: scale(1.12);
    box-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 0 26px rgba(255,255,255,0.12);
}

/* Sidebar container */
section[data-testid="stSidebar"] {
    background: rgba(10, 10, 12, 0.55);
    backdrop-filter: blur(34px) saturate(150%);
    -webkit-backdrop-filter: blur(34px) saturate(150%);
    border-right: 1px solid rgba(255,255,255,0.08);
}

/* Inputs */
div[data-testid="stTextInput"] input, div[data-testid="stTextArea"] textarea {
    background: rgba(255,255,255,0.06);
    color: #f2f2f7;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.14);
    transition: all 0.25s ease;
}
div[data-testid="stTextInput"] input::placeholder, div[data-testid="stTextArea"] textarea::placeholder {
    color: #7a7a82;
}
div[data-testid="stTextInput"] input:focus, div[data-testid="stTextArea"] textarea:focus {
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.3);
    box-shadow: 0 0 0 3px rgba(255,255,255,0.10);
}

/* File uploader dark glass */
section[data-testid="stFileUploaderDropzone"] {
    background: rgba(255,255,255,0.05);
    border: 1px dashed rgba(255,255,255,0.2);
    border-radius: 18px;
}

/* Dataframes / tables dark glass wrapper */
div[data-testid="stDataFrame"], div[data-testid="stTable"] {
    background: rgba(255,255,255,0.04);
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    padding: 6px;
}

/* Metrics as glass chips */
div[data-testid="stMetric"] {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 18px;
    padding: 12px 14px;
    transition: all 0.25s ease;
}
div[data-testid="stMetric"]:hover {
    background: rgba(255,255,255,0.09);
    transform: translateY(-2px);
}
div[data-testid="stMetricValue"] { color: #ffffff; }
div[data-testid="stMetricLabel"] { color: #9a9aa2; }

/* JSON viewer */
div[data-testid="stJson"] {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
}

/* Cards on opening screen */
.feature-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(22px) saturate(150%);
    -webkit-backdrop-filter: blur(22px) saturate(150%);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 22px;
    padding: 22px;
    text-align: center;
    transition: all 0.3s ease;
    height: 100%;
}
.feature-card:hover {
    background: rgba(255,255,255,0.10);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.55), 0 0 30px rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.22);
}
.feature-card .icon { font-size: 2.1rem; margin-bottom: 8px; }
.feature-card h4 { margin: 6px 0; color: #ffffff; }
.feature-card p { color: #a5a5ad; font-size: 0.9rem; }

.brand-title {
    text-align: center;
    font-size: 3.4rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff 0%, #c7c7cf 45%, #8e8e96 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0;
}
.brand-subtitle {
    text-align: center;
    color: #9a9aa2;
    font-size: 1.05rem;
    margin-top: 4px;
    margin-bottom: 28px;
}
.sidebar-welcome {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
    padding: 6px 2px 14px 2px;
}
.badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
}
.badge-urgent, .badge-high { background: rgba(255,69,58,0.18); color: #ff8a80; }
.badge-medium { background: rgba(255,159,10,0.18); color: #ffc266; }
.badge-low { background: rgba(52,199,89,0.18); color: #7ee0a0; }
</style>
"""

st.markdown(IOS_CSS, unsafe_allow_html=True)


# ============================================================================
# SESSION STATE INIT
# ============================================================================

if "view" not in st.session_state:
    st.session_state.view = "opening"
if "user" not in st.session_state:
    st.session_state.user = None
if "ticket_text" not in st.session_state:
    st.session_state.ticket_text = ""
if "active_tab" not in st.session_state:
    st.session_state.active_tab = "analyze"
if "auth_error" not in st.session_state:
    st.session_state.auth_error = ""


def goto(view: str) -> None:
    """Change the current view AND immediately rerun so the change is
    reflected on this click (fixes the 'takes an extra click / wrong page'
    navigation bug)."""
    st.session_state.view = view
    st.session_state.auth_error = ""
    st.rerun()


# ============================================================================
# OPENING SCREEN
# ============================================================================


def render_opening():
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("<div class='brand-title'>SupportOps</div>", unsafe_allow_html=True)
    st.markdown(
        "<div class='brand-subtitle'>Your AI-assisted support ticket copilot — classify, "
        "triage and track customer tickets in one glassy dashboard.</div>",
        unsafe_allow_html=True,
    )

    left, mid, right = st.columns([1, 3, 1])
    with mid:
        cards = [
            ("🎫", "Instant Triage", "Paste any ticket and get category, priority, sentiment and a safe reply — instantly."),
            ("📊", "Batch Analysis", "Upload a CSV of tickets and get accuracy metrics, tables and JSON in one click."),
            ("🕘", "Full History", "Every ticket you analyze is logged, so you can review trends at any time."),
            ("📈", "Comparison Table", "See how categories and priorities compare across everything you've analyzed."),
        ]
        cols = st.columns(4)
        for col, (icon, title, desc) in zip(cols, cards):
            with col:
                st.markdown(
                    f"""<div class='feature-card'>
                            <div class='icon'>{icon}</div>
                            <h4>{title}</h4>
                            <p>{desc}</p>
                        </div>""",
                    unsafe_allow_html=True,
                )

        st.markdown("<br>", unsafe_allow_html=True)
        b1, b2 = st.columns(2)
        with b1:
            if st.button("Sign Up", key="btn_go_signup", use_container_width=True):
                goto("signup")
        with b2:
            if st.button("Log In", key="btn_go_signin", use_container_width=True):
                goto("signin")


# ============================================================================
# SIGN UP
# ============================================================================


def render_signup():
    left, mid, right = st.columns([1, 2, 1])
    with mid:
        top_l, top_r = st.columns([6, 1])
        with top_r:
            if st.button("✕", key="btn_close", help="Back to home"):
                goto("opening")

        st.markdown("<div class='glass-panel'>", unsafe_allow_html=True)
        st.markdown("### Create your account")
        st.caption("Join SupportOps to start analyzing tickets.")

        with st.form("signup_form", border=False):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            confirm = st.text_input("Confirm password", type="password")
            submitted = st.form_submit_button("Sign Up", use_container_width=True)

        if submitted:
            if not username.strip() or not password:
                st.session_state.auth_error = "Please fill in all fields."
            elif password != confirm:
                st.session_state.auth_error = "Passwords do not match."
            elif username_exists(username):
                st.session_state.auth_error = "That username is already taken."
            else:
                save_user(username, password)
                goto("signin")

        if st.session_state.auth_error:
            st.error(st.session_state.auth_error)

        st.markdown("<div style='text-align:center; margin-top:8px;'>Already have an account?</div>", unsafe_allow_html=True)
        c1, c2, c3 = st.columns([1, 1, 1])
        with c2:
            if st.button("Sign in", key="btn_switch_link", use_container_width=True):
                goto("signin")

        st.markdown("</div>", unsafe_allow_html=True)


# ============================================================================
# SIGN IN
# ============================================================================


def render_signin():
    left, mid, right = st.columns([1, 2, 1])
    with mid:
        top_l, top_r = st.columns([6, 1])
        with top_r:
            if st.button("✕", key="btn_close", help="Back to home"):
                goto("opening")

        st.markdown("<div class='glass-panel'>", unsafe_allow_html=True)
        st.markdown("### Welcome back")
        st.caption("Sign in to open your dashboard.")

        with st.form("signin_form", border=False):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign In", use_container_width=True)

        if submitted:
            if verify_user(username, password):
                st.session_state.user = username.strip()
                goto("dashboard")
            else:
                st.session_state.auth_error = "Incorrect username or password."

        if st.session_state.auth_error:
            st.error(st.session_state.auth_error)

        st.markdown("<div style='text-align:center; margin-top:8px;'>Don't have an account?</div>", unsafe_allow_html=True)
        c1, c2, c3 = st.columns([1, 1, 1])
        with c2:
            if st.button("Sign up", key="btn_switch_link", use_container_width=True):
                goto("signup")

        st.markdown("</div>", unsafe_allow_html=True)


# ============================================================================
# SIDEBAR (dashboard navigation)
# ============================================================================


def render_sidebar():
    with st.sidebar:
        st.markdown(f"<div class='sidebar-welcome'>👋 Welcome to Board<br><span style='font-weight:400;font-size:0.85rem;color:#555;'>{st.session_state.user}</span></div>", unsafe_allow_html=True)
        st.markdown("---")

        for key, icon, label in NAV_ITEMS:
            with st.container(key=f"nav_{key}"):
                if st.button(f"{icon}  {label}", key=f"btn_nav_{key}", use_container_width=True):
                    st.session_state.active_tab = key

        st.markdown("<div style='flex-grow:1; min-height: 120px;'></div>", unsafe_allow_html=True)
        st.markdown("---")
        with st.container(key="signout_wrap"):
            if st.button("🚪  Sign Out", key="btn_signout", use_container_width=True):
                st.session_state.user = None
                st.session_state.active_tab = "analyze"
                st.session_state.ticket_text = ""
                goto("opening")


# ============================================================================
# DASHBOARD TABS
# ============================================================================


def render_analyze_tab():
    st.markdown("### 🎫 Analyze Ticket")
    st.caption("Paste a customer support ticket and run the analysis. Output is JSON, same schema as before.")

    st.markdown("<div class='glass-panel'>", unsafe_allow_html=True)
    ticket_text = st.text_area(
        "Customer message",
        key="ticket_text",
        height=180,
        placeholder="Paste the customer support ticket here...",
        label_visibility="collapsed",
    )
    run = st.button("Run Command", key="btn_run_analyze")
    st.markdown("</div>", unsafe_allow_html=True)

    if run:
        cleaned = ticket_text.strip()
        if not cleaned:
            st.json({"error": "Please enter a customer message."})
        else:
            response_json = build_response(cleaned)
            log_ticket(st.session_state.user, response_json)

            st.markdown("**JSON output**")
            st.json(response_json, expanded=True)

            st.download_button(
                "Download JSON",
                data=json.dumps(response_json, indent=2),
                file_name="supportops_analysis.json",
                mime="application/json",
                key="dl_single_json",
            )


def render_quickfill_tab():
    st.markdown("### 🎯 Quick Fill")
    st.caption("Tap a bubble to load a sample ticket into the Analyze tab.")

    cols = st.columns(len(SAMPLE_TICKETS))
    for col, (name, text) in zip(cols, SAMPLE_TICKETS.items()):
        with col:
            with st.container(key=f"qf_{name}"):
                if st.button(SAMPLE_ICONS.get(name, "📝"), key=f"btn_qf_{name}", help=name.replace("_", " ").title()):
                    st.session_state.ticket_text = text
                    st.session_state.active_tab = "analyze"
                    st.rerun()
            st.markdown(f"<div style='text-align:center; font-size:0.8rem; color:#555;'>{name.replace('_',' ').title()}</div>", unsafe_allow_html=True)


def render_history_tab():
    st.markdown("### 🕘 History / Logs")
    logs = load_logs()

    if logs.empty:
        st.info("No tickets analyzed yet. Try the Analyze Ticket or Batch Summary tabs.")
        return

    my_logs = logs[logs["username"] == st.session_state.user] if "username" in logs.columns else logs

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total tickets", len(my_logs))
    m2.metric("Urgent/High", int(my_logs["priority"].isin(["high", "urgent"]).sum()) if "priority" in my_logs else 0)
    m3.metric("Refund requests", int(my_logs["refund_request"].astype(str).isin(["True", "true"]).sum()) if "refund_request" in my_logs else 0)
    m4.metric("Avg confidence", f"{my_logs['confidence'].astype(float).mean():.2f}" if "confidence" in my_logs and len(my_logs) else "—")

    st.markdown("#### All analyzed tickets")
    st.dataframe(my_logs, hide_index=True, use_container_width=True)

    if "category" in my_logs.columns and len(my_logs):
        st.markdown("#### Category breakdown")
        st.bar_chart(my_logs["category"].value_counts())

    st.download_button(
        "Download full history (CSV)",
        data=my_logs.to_csv(index=False),
        file_name="ticket_history.csv",
        mime="text/csv",
        key="dl_history_csv",
    )


def render_batch_tab():
    st.markdown("### 📊 Batch Summary")
    st.caption("Upload a CSV with a `customer_message` or `ticket` column to analyze many tickets at once.")

    uploaded_file = st.file_uploader("Upload CSV", type=["csv"], label_visibility="collapsed")

    if uploaded_file is None:
        st.info("Waiting for a CSV upload...")
        return

    batch_frame = pd.read_csv(uploaded_file)
    text_column = "customer_message" if "customer_message" in batch_frame.columns else "ticket"

    if text_column not in batch_frame.columns:
        st.error("CSV must contain a 'customer_message' or 'ticket' column.")
        return

    predictions = batch_frame[text_column].astype(str).apply(build_response)
    summary_frame = pd.DataFrame(list(predictions))
    merged = pd.concat([batch_frame.reset_index(drop=True), summary_frame], axis=1)

    for _, resp in predictions.items():
        log_ticket(st.session_state.user, resp)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Tickets", len(merged))
    m2.metric("Billing", int((merged["category"] == "billing").sum()))
    m3.metric("Shipping", int((merged["category"] == "shipping").sum()))
    m4.metric("Urgent/high", int(merged["priority"].isin(["high", "urgent"]).sum()))

    if {"true_category", "true_priority"}.issubset(merged.columns):
        cat_acc = (merged["category"] == merged["true_category"]).mean()
        pri_acc = (merged["priority"] == merged["true_priority"]).mean()
        a1, a2 = st.columns(2)
        a1.metric("Category accuracy", f"{cat_acc:.2%}")
        a2.metric("Priority accuracy", f"{pri_acc:.2%}")

    st.markdown("#### Table")
    show_cols = [c for c in ["ticket_id", text_column, "category", "priority", "sentiment", "sla_risk", "refund_request", "confidence"] if c in merged.columns]
    st.dataframe(merged[show_cols] if show_cols else merged, hide_index=True, use_container_width=True)

    st.markdown("#### JSON output")
    batch_json = list(predictions)
    st.json(batch_json, expanded=False)

    d1, d2 = st.columns(2)
    with d1:
        st.download_button(
            "Download JSON",
            data=json.dumps(batch_json, indent=2),
            file_name="batch_analysis.json",
            mime="application/json",
            key="dl_batch_json",
        )
    with d2:
        st.download_button(
            "Download table (CSV)",
            data=merged.to_csv(index=False),
            file_name="batch_analysis.csv",
            mime="text/csv",
            key="dl_batch_csv",
        )


def render_compare_tab():
    st.markdown("### 📈 Comparison Table")
    st.caption("Category vs priority breakdown across everything you've analyzed so far.")

    logs = load_logs()
    if logs.empty or "username" not in logs.columns:
        st.info("No data yet — analyze a ticket first.")
        return

    my_logs = logs[logs["username"] == st.session_state.user]
    if my_logs.empty or "category" not in my_logs.columns or "priority" not in my_logs.columns:
        st.info("No data yet — analyze a ticket first.")
        return

    crosstab = pd.crosstab(my_logs["category"], my_logs["priority"])
    st.dataframe(crosstab, use_container_width=True)

    st.markdown("#### Sentiment vs category")
    if "sentiment" in my_logs.columns:
        crosstab2 = pd.crosstab(my_logs["category"], my_logs["sentiment"])
        st.dataframe(crosstab2, use_container_width=True)


TAB_RENDERERS = {
    "analyze": render_analyze_tab,
    "quickfill": render_quickfill_tab,
    "history": render_history_tab,
    "batch": render_batch_tab,
    "compare": render_compare_tab,
}


def render_dashboard():
    render_sidebar()
    TAB_RENDERERS.get(st.session_state.active_tab, render_analyze_tab)()


# ============================================================================
# ROUTER
# ============================================================================

if st.session_state.view == "opening":
    render_opening()
elif st.session_state.view == "signup":
    render_signup()
elif st.session_state.view == "signin":
    render_signin()
elif st.session_state.view == "dashboard" and st.session_state.user:
    render_dashboard()
else:
    goto("opening")
