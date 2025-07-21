import random, time, urllib.parse, requests, os
import streamlit as st
import pyttsx3, speech_recognition as sr
import numpy as np, librosa, soundfile as sf
from deep_translator import GoogleTranslator
from playsound import playsound
import threading

# ---------- Session State ---------- #
st.session_state.setdefault("last_reply", [])
st.session_state.setdefault("language", "English")
st.session_state.setdefault("breath_timer", False)
st.session_state.setdefault("start_time", time.time())
st.session_state.setdefault("last_category", "")
st.session_state.setdefault("user_name", "")
st.session_state.setdefault("user_age", "")k

# ---------- TTS ---------- #
engine = pyttsx3.init()
engine.setProperty('rate', 130)
for voice in engine.getProperty('voices'):
    if "female" in voice.name.lower():
        engine.setProperty('voice', voice.id)
        break

def speak_all(lines):
    engine.stop()
    combined = " ".join(str(line) for line in lines)
    engine.say(combined)
    engine.runAndWait()

# ---------- Quote ---------- #
@st.cache_data(ttl=600)
def get_motivational_quote():
    try:
        data = requests.get("https://zenquotes.io/api/random", timeout=3).json()
        return f"{data[0]['q']} — {data[0]['a']}"
    except:
        return "🌐 Your connection seems disturbed."

# ---------- Translation ---------- #
def translate_lines(lines, lang):
    if lang == "English": return lines
    code = {"Hindi": "hi", "Bengali": "bn"}.get(lang, "en")
    return [GoogleTranslator(source='auto', target=code).translate(l) for l in lines]

# ---------- Response DB ---------- #
categories = {
    "anxiety": ["anxious", "stressed", "nervous", "panic"],
    "sadness": ["sad", "down", "depressed", "hopeless"],
    "lonely": ["lonely", "alone", "isolated"],
    "unmotivated": ["lazy", "tired", "can't focus", "unmotivated"],
    "anger": ["angry", "irritated", "frustrated", "mad"],
    "others": ["my friend", "someone", "brother", "sister", "cousin", "partner"]
}
responses = {
    "anxiety": [["😕 Feeling anxious is normal.", "Inhale-Hold-Exhale for 4 seconds each.", "You're doing your best."]],
    "sadness": [["🌧️ Sadness feels heavy sometimes.", "Try journaling or talking.", "You're allowed to feel this."]],
    "lonely": [["🧍‍♂️ Feeling lonely doesn’t mean you're alone.", "Send a small message to a friend.", "You're valued."]],
    "unmotivated": [["Everyone has low days.", "Start with a tiny task.", "Momentum builds slowly."]],
    "anger": [["Anger is valid.", "Take a walk or step away.", "You control the anger."]],
    "others": [["Caring for someone is kind.", "Listening helps more than advice.", "Support matters."]],
    "default": [["😔 I'm here for you.", "Try a 5-minute breathing break.", "You're not alone."]]
}

def get_response(text):
    text = text.lower()
    for cat, keys in categories.items():
        if any(k in text for k in keys):
            return random.choice(responses[cat]), cat
    return random.choice(responses["default"]), "default"

# ---------- Breathing Timer ---------- #
def play_exhale():
    try: playsound("exhale.mp3")
    except: pass

def run_breathing_session():
    st.session_state.breath_timer = True
    st.session_state.stop_clicked = False
    placeholder = st.empty()
    stop_col = st.empty()
    progress_bar = st.progress(0)

    if stop_col.button("❌ Stop Timer", key="inner_stop"):
        st.session_state.stop_clicked = True

    duration = 300
    start = time.time()

    while time.time() - start < duration:
        elapsed = int(time.time() - start)
        percent = min(elapsed / duration, 1.0)
        progress_bar.progress(percent)

        if st.session_state.stop_clicked:
            placeholder.markdown("⏹️ <h3 style='text-align:center;'>Session Stopped</h3>", unsafe_allow_html=True)
            break

        for phase, icon in [("Inhale", "🌬️"), ("Hold", "✋"), ("Exhale", "😌")]:
            placeholder.markdown(f"<h2 style='text-align:center;'>{icon} {phase}</h2>", unsafe_allow_html=True)
            if phase == "Exhale":
                threading.Thread(target=play_exhale).start()
            for _ in range(4):
                if st.session_state.stop_clicked:
                    placeholder.markdown("⏹️ <h3 style='text-align:center;'>Session Stopped</h3>", unsafe_allow_html=True)
                    return
                time.sleep(1)

    if not st.session_state.stop_clicked:
        placeholder.markdown("✅ <h3 style='text-align:center;'>Session Complete</h3>", unsafe_allow_html=True)
        progress_bar.progress(1.0)
    st.session_state.breath_timer = False

# ---------- Voice ---------- #
def detect_emotion_from_voice(path):
    try:
        y, sr_ = librosa.load(path, sr=None)
        rms = np.mean(librosa.feature.rms(y=y))
        return "angry" if rms > 0.04 else "neutral" if rms > 0.02 else "sad"
    except:
        return "neutral"

def recognize_voice():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        st.info("🎙️ Listening...")
        audio = r.listen(source, phrase_time_limit=5)
    try:
        text = r.recognize_google(audio)
        st.success(f"You said: {text}")
        return text
    except:
        st.warning("Sorry, I couldn't understand.")
        return ""

# ---------- UI Styling ---------- #
st.set_page_config("FeelEase ChatBot", "🧠")
st.markdown("""
<style>
.stApp { background-color: #0d0d0d; color: white; }
input, textarea { background-color: #333; color: white; }
.stButton>button { background: #222; color: white; border-radius: 10px; }
.stButton>button:hover { background-color: #444; }
.quote-box { background: #1a1a1a; padding: 12px; border-radius: 8px; font-style: italic; }
.timer { text-align: center; font-size: 16px; color: #aaa; margin-bottom: 8px; }
</style>
""", unsafe_allow_html=True)

# ---------- Sidebar ---------- #
with st.sidebar:
    st.markdown("### 💡 Mental Health Fact")
    st.markdown("🧠 Thoughts aren't always facts. ❤️ You've survived your worst days.")
    if st.button("🧘 Start 5-Min Breathing Exercise"):
        run_breathing_session()
    if st.button("❌ Stop Timer"):
        st.session_state.breath_timer = False

elapsed = int(time.time() - st.session_state.start_time)
st.markdown(f"<p class='timer'>🕒 Time spent in session: {elapsed//60} min {elapsed%60} sec</p>", unsafe_allow_html=True)

# ---------- Header ---------- #
st.markdown("""
<h1 style='text-align:center; font-size:50px; color:#FF4B4B;'>🧠 FeelEase</h1>
<p style='text-align:center;'>A caring mental health chatbot</p>
""", unsafe_allow_html=True)

# ---------- User Info Block ---------- #
with st.expander("👤 Start by telling me about yourself", expanded=True):
    name = st.text_input("Your Name", value=st.session_state.user_name)
    age = st.text_input("Your Age", value=st.session_state.user_age)

    if name.strip() and age.strip():
        st.session_state.user_name = name.strip()
        st.session_state.user_age = age.strip()
        st.success(f"Welcome, {name}! Let's talk.")
    else:
        st.warning("Please enter both name and age to proceed.")

# ---------- Language ---------- #
lang = st.selectbox("🌐 Choose Language", ["English", "Hindi", "Bengali"], index=["English", "Hindi", "Bengali"].index(st.session_state.language))
st.session_state.language = lang

# ---------- Input ---------- #
col1, col2 = st.columns([3,1])
with col1:
    user_input = st.text_input("💬 Tell me how you're feeling:")
with col2:
    if st.button("🎤 Mic Input"):
        user_input = recognize_voice()

if st.button("🔎 Respond"):
    if user_input.strip():
        reply_lines, category = get_response(user_input)
        translated = translate_lines(reply_lines, lang)
        st.session_state.last_reply = translated
        st.session_state.last_category = category

# ---------- Output ---------- #
if st.session_state.last_reply:
    st.markdown(f"### 🤖 I'm here for you, {st.session_state.user_name}")
    for line in st.session_state.last_reply:
        st.markdown(f"{line}")
    if st.button("🔊 Hear Response"):
        speak_all(st.session_state.last_reply)

    if st.session_state.last_category == "default":
        st.markdown("### 🤔 Want to tell me more?")
        more_input = st.text_input("You can describe more:", key="followup_input")
        if st.button("🔎 Get Better Response"):
            if more_input.strip():
                reply_lines, category = get_response(more_input)
                st.session_state.last_reply = translate_lines(reply_lines, st.session_state.language)
                st.session_state.last_category = category
                st.rerun()

        st.markdown("Or choose one that fits best:")
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("😟 Anxiety"):
                st.session_state.last_reply = translate_lines(random.choice(responses["anxiety"]), st.session_state.language)
                st.session_state.last_category = "anxiety"
                st.rerun()
            if st.button("😤 Anger"):
                st.session_state.last_reply = translate_lines(random.choice(responses["anger"]), st.session_state.language)
                st.session_state.last_category = "anger"
                st.rerun()
        with col2:
            if st.button("😔 Sadness"):
                st.session_state.last_reply = translate_lines(random.choice(responses["sadness"]), st.session_state.language)
                st.session_state.last_category = "sadness"
                st.rerun()
            if st.button("😴 Unmotivated"):
                st.session_state.last_reply = translate_lines(random.choice(responses["unmotivated"]), st.session_state.language)
                st.session_state.last_category = "unmotivated"
                st.rerun()
        with col3:
            if st.button("😞 Loneliness"):
                st.session_state.last_reply = translate_lines(random.choice(responses["lonely"]), st.session_state.language)
                st.session_state.last_category = "lonely"
                st.rerun()
            if st.button("❤️ Others"):
                st.session_state.last_reply = translate_lines(random.choice(responses["others"]), st.session_state.language)
                st.session_state.last_category = "others"
                st.rerun()

# ---------- Feedback ---------- #
st.markdown("### ✨ How was my response?")
col1, col2, col3 = st.columns(3)
with col1:
    st.button("😊 Helpful")
with col2:
    st.button("😐 Neutral")
with col3:
    st.button("😞 Not Helpful")

# ---------- Quote + Video ---------- #
st.markdown("### 📺 Suggested Videos")
suggestion = st.text_input("🌐 Rephrase how you're feeling (e.g., anxious, calm, irritated):")
query = suggestion if suggestion else "mental health support"
search_link = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
st.markdown(f"🔗 [Search YouTube for '{query}']({search_link})")

st.markdown("### 🔍 Search More Videos")
custom_query = st.text_input("Enter topic (e.g., stress relief, peaceful music)")
if custom_query:
    link = f"https://www.youtube.com/results?search_query={urllib.parse.quote(custom_query)}"
    st.markdown(f"🔗 [Search YouTube for '{custom_query}']({link})")

# ---------- Footer ---------- #
st.markdown("""
<p style='text-align:center;'>🚀 Made for <a href='https://simplifyhackathon.ai' target='_blank'>Simplify AI Tools Hackathon 2025</a></p>
""", unsafe_allow_html=True)
