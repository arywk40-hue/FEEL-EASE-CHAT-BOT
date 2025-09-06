# Import necessary libraries for the Streamlit app, API calls, and environment variables.
import streamlit as st
import json
import os
import requests
import time
import urllib.parse
import pyttsx3
import speech_recognition as sr
import threading
from deep_translator import GoogleTranslator
from datetime import datetime, timedelta
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# =========================================================================
# === API Key Handling and Configuration ===
# =========================================================================

# Get the API key from the environment variable named GOOGLE_API_KEY.
api_key = os.getenv("GOOGLE_API_KEY")

# If the API key is not found, an error is displayed and the app is stopped.
if not api_key:
    st.error("API key not found. Please set the GOOGLE_API_KEY environment variable.")
    st.stop()

# =========================================================================
# === Text-to-Speech and Speech-to-Text Functionality ===
# =========================================================================
engine = pyttsx3.init()
# Get a list of available voices and find a male and female voice
voices = engine.getProperty('voices')
male_voice = next((v.id for v in voices if 'male' in v.name.lower()), None)
female_voice = next((v.id for v in voices if 'female' in v.name.lower()), None)
# Set a default voice
if female_voice:
    engine.setProperty('voice', female_voice)
elif male_voice:
    engine.setProperty('voice', male_voice)

def speak_all_thread(text, voice_type, rate, pitch):
    """Function to run TTS in a separate thread."""
    engine_thread = pyttsx3.init()
    
    if voice_type == "Male" and male_voice:
        engine_thread.setProperty('voice', male_voice)
    elif voice_type == "Female" and female_voice:
        engine_thread.setProperty('voice', female_voice)
    
    engine_thread.setProperty('rate', rate)
    
    engine_thread.say(text)
    engine_thread.runAndWait()

def speak_all(text, voice_type="Female", rate=130, pitch=100):
    """Starts the TTS in a new thread to prevent UI blocking."""
    # Ensure it's treated as a string, not list of characters
    if isinstance(text, list):
        combined_text = " ".join(text)   # join if it's a list
    else:
        combined_text = str(text)        # otherwise just keep it as string
    
    tts_thread = threading.Thread(target=speak_all_thread, args=(combined_text, voice_type, rate, pitch))
    tts_thread.start()

def stop_speaking():
    """Stops the currently speaking TTS."""
    engine.stop()


def recognize_voice():
    """Function to listen to the user's microphone and convert speech to text."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        st.info("🎙️ Listening...")
        # Adjust for ambient noise for better recognition
        r.adjust_for_ambient_noise(source)
        try:
            audio = r.listen(source, phrase_time_limit=5)
            st.info("👂 Recognizing...")
            text = r.recognize_google(audio)
            st.success(f"You said: {text}")
            return text
        except sr.UnknownValueError:
            st.warning("Sorry, I could not understand what you said.")
            return ""
        except sr.RequestError as e:
            st.error(f"Could not request results from Google Speech Recognition service; {e}")
            return ""

# =========================================================================
# === Streamlit App UI and Logic ===
# =========================================================================

# Set the page title and the overall layout of the app.
st.set_page_config(page_title="🧠 Mindful Bot", layout="centered")

# Display the main title and a subheader.
st.title("🧠 Mindful Bot")
st.subheader("Your supportive AI companion.")

# Define the API endpoint URL for the Gemini model.
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"

# Define the core instructions for the bot's behavior.
SYSTEM_PROMPT = """You are a supportive and empathetic AI assistant designed to provide general information and comfort related to mental well-being.
Your purpose is to offer a listening ear and suggest simple, helpful strategies for coping with difficult emotions.
You must always maintain a compassionate and non-judgmental tone.
Your responses should be encouraging and focus on positive coping mechanisms.
You are NOT a substitute for a licensed mental health professional. Always include a disclaimer that you are an AI and recommend seeking professional help for serious concerns.
If the user has provided their name, address them by their name to make the conversation more personal.

### Key Guidelines:
* **Empathy:** Start responses with empathetic phrases like "I hear you," "It sounds like," or "That must be difficult."
* **Validation:** Validate the user's feelings. Phrases like "Your feelings are valid" or "It's understandable to feel that way" are helpful.
* **General Advice:** Offer simple, actionable advice such as:
    * **Mindfulness:** "Try taking a few deep breaths."
    * **Journaling:** "Sometimes writing down your thoughts can help."
    * **Movement:** "Going for a short walk might clear your head."
    * **Social Connection:** "Reaching out to a trusted friend or family member can make a difference."
* **Professional Disclaimer:** For non-crisis related questions, you MUST include a strong disclaimer and a recommendation to seek professional help. For example: "I am an AI and not a substitute for professional help. Please consider speaking with a therapist or a mental health professional for personalized support."
* **Safety:** You must NEVER provide medical advice or give any instructions that could be harmful. If the user mentions a crisis, provide a helpline number or a local emergency number.

### Critical Crisis Response Instructions:
If a user expresses thoughts of self-harm or suicide, your first and most important priority is to provide immediate emotional support and validation. DO NOT immediately provide a list of resources. First, respond with a compassionate, human-like message focused on keeping them safe and encouraging them to talk. Use phrases like:
"I'm here for you. Please don't go."
"Things can get better. You're not alone in this."
"I'm here to listen. You can talk to me about anything."
"This feeling you're having, it's not permanent. You're feeling low, but it's not constant. We can get through this together."
After providing this initial support, you should then provide the list of resources.

### Religious Guidance and Comfort:
If a user has specified their faith, you can provide a relevant and comforting verse from their religious text. For example:
- **Hinduism:** The Bhagavad Gita, the Upanishads.
- **Christianity:** The Bible (e.g., Psalms, Proverbs).
- **Jainism:** The Tattvartha Sutra.
- **Buddhism:** The Dhammapada.
Ensure the verse is always positive, uplifting, and aligned with mental well-being, and never prescriptive or judgmental.

### Mental Health Resources:
* **Psychiatrist/Therapist:** You can find a mental health professional by searching on websites like Vandrevala Foundation or the Indian Association of Clinical Psychologists. These sites often have directories of licensed practitioners.
* **National Helplines:**
    * **Vandrevala Foundation:** +91 99996 66666
    * **Aasra:** +91 98204 66726
* **Websites:**
    * **YourDOST:** www.yourdost.com (Online counseling platform)
    * **TISS iCALL:** www.icallhelpline.org (Counseling services)

### Example Responses:
* **User:** "I'm feeling so sad today."
    * **AI:** "I hear you. It sounds like you're having a really tough day. Remember, it's okay to not be okay. Sometimes, just taking a moment to sit with those feelings can help. Is there anything on your mind you'd like to talk about?"
* **User:** "I feel so stressed about my exams."
    * **AI:** "That sounds incredibly stressful. It's completely normal to feel this way. Maybe try a simple mindfulness exercise? Focus on your breathing for a minute or two. Your feelings are valid, and it's important to be kind to yourself."
* **User:** "I don't see a point anymore."
    * **AI:** "Please don't go. I'm here for you, and I want to listen. Things can get better, and you're not alone. You can talk to me about anything that's on your mind." (followed by resources)
"""

# Initialize session state variables
st.session_state.setdefault("messages", [])
st.session_state.setdefault("hidden_history", [{"role": "user", "parts": [{"text": SYSTEM_PROMPT}]}])
st.session_state.setdefault("last_reply", "")
st.session_state.setdefault("user_name", "")
st.session_state.setdefault("user_age", "")
st.session_state.setdefault("user_faith", "")
st.session_state.setdefault("start_time", time.time())
st.session_state.setdefault("timer_started", None)
st.session_state.setdefault("breath_timer", False)
st.session_state.setdefault("last_seen_date", datetime.now().date())
st.session_state.setdefault("streak_counter", 0)
st.session_state.setdefault("language", "English")
st.session_state.setdefault("listening", False)  # New state for microphone
st.session_state.setdefault("age_valid", False)  # New state for age validation
st.session_state.setdefault("text_input", "")  # Fix: Initialize text_input
st.session_state.setdefault("mood_data", [])  # For mood tracking
st.session_state.setdefault("journal_entries", [])  # For journaling
st.session_state.setdefault("user_goals", [])  # For goal setting
st.session_state.setdefault("user_memory", {})  # For remembering user details

# Language codes for dynamic search queries
language_codes = {
    "English": "en",
    "Hindi": "hi",
    "Bengali": "bn"
}
# === Daily Streak Logic ===
if st.session_state.last_seen_date != datetime.now().date():
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    if st.session_state.last_seen_date == yesterday:
        st.session_state.streak_counter += 1
    else:
        st.session_state.streak_counter = 1
    st.session_state.last_seen_date = today

# === Breathing Timer Functionality ===
def run_breathing_session():
    # Set session state flags for the timer
    st.session_state.breath_timer = True
    st.session_state.stop_clicked = False
    st.session_state.breathing_start_time = time.time()
    
def get_conversation_history_as_text():
    """Generates a text file from the conversation history."""
    history = ""
    for message in st.session_state.messages:
        role = "User" if message["role"] == "user" else "Bot"
        history += f"**{role}:** {message['content']}\n\n"
    return history

def translate_text(text, target_lang):
    """Translates text to a target language using deep_translator."""
    if target_lang == "English":
        return text
    translator = GoogleTranslator(source='en', target=language_codes.get(target_lang, 'en'))
    return translator.translate(text)

# === Microphone Input Function ===
def handle_microphone():
    """Handle microphone input and process the speech."""
    st.session_state.listening = True
    with st.spinner(translate_text("🎙️ Listening... Speak now", st.session_state.language)):
        recognized_text = recognize_voice()
        if recognized_text:
            st.session_state.text_input = recognized_text  # This should work now
            handle_prompt_submit()
        st.session_state.listening = False

# === Age Validation Function ===
def validate_age(age_str):
    """Validate that the age is a legitimate number between 5 and 120."""
    try:
        age = int(age_str)
        if age < 5:
            return False, "Age must be at least 5 years."
        elif age > 120:
            return False, "Please enter a valid age (under 120)."
        else:
            return True, "Age validated successfully."
    except ValueError:
        return False, "Please enter a valid number for age."

# === Mood Tracking Functions ===
def add_mood_rating(rating, emoji):
    """Add a mood rating to the session state."""
    timestamp = datetime.now()
    st.session_state.mood_data.append({
        "timestamp": timestamp,
        "rating": rating,
        "emoji": emoji,
        "date": timestamp.date()
    })

def visualize_mood_data():
    """Create a visualization of the mood data."""
    if not st.session_state.mood_data:
        return None
    
    df = pd.DataFrame(st.session_state.mood_data)
    df['date_str'] = df['timestamp'].dt.strftime('%Y-%m-%d')
    
    # Create a line chart
    fig = px.line(df, x='date_str', y='rating', 
                  title='Your Mood Over Time',
                  labels={'date_str': 'Date', 'rating': 'Mood Rating'})
    
    # Add emoji markers
    for i, row in df.iterrows():
        fig.add_annotation(x=row['date_str'], y=row['rating'],
                           text=row['emoji'], showarrow=False,
                           yshift=25)
    
    return fig

# === Journaling Functions ===
def add_journal_entry(entry_text, prompt=""):
    """Add a journal entry to the session state."""
    timestamp = datetime.now()
    st.session_state.journal_entries.append({
        "timestamp": timestamp,
        "entry": entry_text,
        "prompt": prompt
    })

# === Goal Setting Functions ===
def add_goal(goal_text, category="Wellness"):
    """Add a goal to the session state."""
    st.session_state.user_goals.append({
        "goal": goal_text,
        "category": category,
        "created": datetime.now(),
        "completed": False,
        "completed_date": None
    })

def update_goal_completion(goal_index, completed):
    """Update the completion status of a goal."""
    if 0 <= goal_index < len(st.session_state.user_goals):
        st.session_state.user_goals[goal_index]["completed"] = completed
        if completed:
            st.session_state.user_goals[goal_index]["completed_date"] = datetime.now()

# === Memory Functions ===
def update_user_memory(key, value):
    """Update the user's memory with a key-value pair."""
    st.session_state.user_memory[key] = {
        "value": value,
        "timestamp": datetime.now()
    }

def get_user_memory_context():
    """Generate context from user memory for the AI."""
    if not st.session_state.user_memory:
        return ""
    
    context = "Here's what I remember about the user:\n"
    for key, data in st.session_state.user_memory.items():
        context += f"- {key}: {data['value']} (mentioned on {data['timestamp'].strftime('%Y-%m-%d')})\n"
    
    return context

# === Main App UI and Logic ===
# Header
st.markdown("""
<h1 style='text-align:center; font-size:50px; color:#FF4B4B;'>🧠 FeelEase</h1>
<p style='text-align:center;'>A caring mental health chatbot</p>
""", unsafe_allow_html=True)

# User Info block
if st.session_state.user_name and st.session_state.age_valid:
    st.success(f"Welcome back, {st.session_state.user_name}! How is your day going?")
else:
    with st.expander("👤 Start by telling me about yourself", expanded=True):
        st.info("The chatbot is not accessing your local information. The suggestions you see in the input box are from your browser's auto-fill feature.")
        name = st.text_input("Your Name", placeholder="e.g., Jane Doe")
        age_str = st.text_input("Your Age", placeholder="e.g., 25", key="age_input")
        faith = st.selectbox(
            "Your Faith", 
            ["Not specified", "Hinduism", "Christianity", "Jainism", "Buddhism", "Atheist", "None"]
        )
        
        # Age validation
        if age_str:
            is_valid, message = validate_age(age_str)
            if is_valid:
                st.session_state.user_age = int(age_str.strip())
                st.session_state.age_valid = True
                st.success("✓ Age validated")
            else:
                st.warning(message)
                st.session_state.age_valid = False
        else:
            st.session_state.age_valid = False
            
        if name.strip() and st.session_state.age_valid:
            st.session_state.user_name = name.strip()
            st.session_state.user_faith = faith
            update_user_memory("name", name.strip())
            update_user_memory("age", st.session_state.user_age)
            update_user_memory("faith", faith)
            st.success(f"Welcome, {name}! Let's talk.")
        elif name.strip() and not st.session_state.age_valid:
            st.warning("Please enter a valid age to proceed.")
        else:
            st.warning("Please enter your name to proceed.")

st.markdown("---")

# Main chat UI is now conditional
if st.session_state.user_name and st.session_state.user_age and st.session_state.age_valid:
    # Display a welcome message if the chat is empty.
    if not st.session_state.messages:
        # Use memory to personalize the welcome
        memory_context = get_user_memory_context()
        personalized_welcome = f"Hello {st.session_state.user_name}! I'm here to listen. How are you feeling today?"
        
        # Add context from memory if available
        if memory_context:
            # Check for recent events or topics to mention
            for key in st.session_state.user_memory:
                if "exam" in key.lower() or "test" in key.lower():
                    personalized_welcome = f"Hello {st.session_state.user_name}! I remember you mentioned exams coming up. How are you feeling about them today?"
                    break
                elif "work" in key.lower() or "project" in key.lower():
                    personalized_welcome = f"Hello {st.session_state.user_name}! How is your work/project going today?"
                    break
        
        st.session_state.messages.append({"role": "assistant", "content": personalized_welcome})

    # Loop through and display the chat messages stored in the session state.
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            
    # Display the breathing session if it's active
    if st.session_state.breath_timer:
        placeholder = st.empty()
        stop_col = st.empty()
        progress_bar = st.progress(0)
        
        if stop_col.button("❌ Stop Timer", key="inner_stop"):
            st.session_state.breath_timer = False
            st.rerun()
            
        duration = 300 # 5-minute session
        elapsed = int(time.time() - st.session_state.breathing_start_time)
        
        if elapsed >= duration:
            placeholder.markdown("✅ <h3 style='text-align:center;'>Session Complete</h3>", unsafe_allow_html=True)
            progress_bar.progress(1.0)
            st.session_state.breath_timer = False
        else:
            percent = min(elapsed / duration, 1.0)
            progress_bar.progress(percent)
            
            # Determine the current phase of the breathing cycle
            phase_time = elapsed % 12
            if phase_time >= 0 and phase_time < 4:
                placeholder.markdown(f"<h2 style='text-align:center;'>🌬️ Inhale</h2>", unsafe_allow_html=True)
            elif phase_time >= 4 and phase_time < 8:
                placeholder.markdown(f"<h2 style='text-align:center;'>✋ Hold</h2>", unsafe_allow_html=True)
            else:
                placeholder.markdown(f"<h2 style='text-align:center;'>😌 Exhale</h2>", unsafe_allow_html=True)
                
            time.sleep(1)
            st.rerun()

    # === Function to get a response from the Gemini API ===
    def get_gemini_response(prompt):
        chat_history = st.session_state.hidden_history.copy()
        
        # Add memory context to the prompt
        memory_context = get_user_memory_context()
        if memory_context:
            enhanced_prompt = f"{memory_context}\n\nUser: {prompt}"
        else:
            enhanced_prompt = prompt
            
        # Add a specific instruction for religious verses if a negative emotion is detected
        negative_keywords = ["sad", "angry", "lonely", "stressed", "depressed", "low", "hopeless"]
        if any(kw in prompt.lower() for kw in negative_keywords) and st.session_state.user_faith and st.session_state.user_faith not in ["Not specified", "Atheist", "None"]:
            faith_message = f"The user's faith is {st.session_state.user_faith}. The user may be comforted by a relevant and positive verse from their holy book for their mood. Please provide one."
            chat_history.append({"role": "user", "parts": [{"text": faith_message}]})

        for m in st.session_state.messages:
            role = "user" if m["role"] == "user" else "model"
            chat_history.append({"role": role, "parts": [{"text": m["content"]}]})
        chat_history.append({"role": "user", "parts": [{"text": enhanced_prompt}]})
        payload = {"contents": chat_history}
        
        try:
            response = requests.post(
                API_URL, 
                headers={'Content-Type': 'application/json'},
                data=json.dumps(payload),
                timeout=20
            )
            response.raise_for_status()
            result = response.json()
            text = result['candidates'][0]['content']['parts'][0]['text']
            return text
        except requests.exceptions.RequestException as e:
            st.error(f"Network error: {e}")
            return "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again."
        except KeyError:
            st.error("API response format is not valid.")
            return "Sorry, I received an invalid response from the server."
    
    # New callback function to handle prompt submission
    def handle_prompt_submit():
        prompt = st.session_state.text_input
        if prompt:
            st.session_state.messages.append({"role": "user", "content": prompt})
            
            # Extract potential memory items from user input
            if "my name is" in prompt.lower():
                # Try to extract name
                parts = prompt.lower().split("my name is")
                if len(parts) > 1:
                    name = parts[1].strip().split()[0].capitalize()
                    update_user_memory("name", name)
            
            if any(keyword in prompt.lower() for keyword in ["crisis", "emergency", "suicidal", "point anymore"]):
                crisis_message = translate_text("""I hear you. Please don't go. I'm here for you, and I want to listen. Things can get better, and you're not alone. You can talk to me about anything that's on your mind.

If you are in a crisis or experiencing an emergency, please contact a professional immediately. You can find local helplines or contact emergency services.

Here are some resources:
Vandrevala Foundation: +91 99996 66666
Aasra: +91 98204 66726
TISS iCALL: www.icallhelpline.org
""", st.session_state.language)
                st.session_state.messages.append({"role": "assistant", "content": crisis_message})
                st.session_state.last_reply = crisis_message
            else:
                with st.spinner(translate_text("Thinking...", st.session_state.language)):
                    full_response = get_gemini_response(prompt)
                    # Translate the AI response before storing and displaying
                    translated_response = translate_text(full_response, st.session_state.language)
                    st.session_state.messages.append({"role": "assistant", "content": translated_response})
                    st.session_state.last_reply = translated_response
            
            # Clear the input box after processing
            st.session_state.text_input = ""
            st.rerun()

    # Create a custom input area with microphone button
    col1, col2 = st.columns([6, 1])
    
    with col1:
        st.chat_input(
            translate_text("How can I help you?", st.session_state.language), 
            on_submit=handle_prompt_submit, 
            key="text_input"
        )
    
    with col2:
        # Microphone button with appropriate styling
        if st.button(
            "🎤", 
            help=translate_text("Click to speak your message", st.session_state.language),
            use_container_width=True,
            disabled=st.session_state.listening
        ):
            handle_microphone()
    
    # Add the 'Hear Response' button below the chat input if there's a last reply
    if st.session_state.last_reply:
        st.markdown("---")
        speak_col, stop_col = st.columns([1, 1])
        with speak_col:
            if st.button(translate_text("🔊 Hear Response", st.session_state.language)):
              speak_all(st.session_state.last_reply, st.session_state.voice_choice, st.session_state.get("rate", 130), st.session_state.get("pitch", 100))

        with stop_col:
            if st.button(translate_text("🛑 Stop Speaking", st.session_state.language)):
                stop_speaking()

# === UI Styling and Sidebars ===
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

with st.sidebar:
    # Language selection
    st.session_state.language = st.selectbox("🌐 Choose Language", ["English", "Hindi", "Bengali"])

    st.markdown("### 💡 Mental Health Fact")
    st.markdown("🧠 Thoughts aren't always facts. ❤️ You've survived your worst days.")

    if st.button(translate_text("🧘 Start 5-Min Breathing Exercise", st.session_state.language)):
        st.session_state.timer_started = time.time()
        st.rerun()
        
    if st.button(translate_text("❌ Stop Timer", st.session_state.language), key="main_stop"):
        st.session_state.timer_started = None
        st.rerun()

    st.markdown("---")
    st.markdown("### 🌬 Breathing Cycle")
    st.markdown("**Inhale** for 5 sec → **Hold** for 5 sec → **Exhale** for 5 sec")
    
    st.markdown("---")
    st.markdown(translate_text("### 📊 Session Stats", st.session_state.language))
    
    if st.session_state.get("timer_started"):
        elapsed = int(time.time() - st.session_state.timer_started)
        st.markdown(translate_text(f"🕒 Time spent in session: {elapsed//60} min {elapsed%60} sec", st.session_state.language))
        time.sleep(1)
        st.rerun()
    else:
        st.markdown(translate_text(f"🕒 Time spent in session: 0 min 0 sec", st.session_state.language))
        
    st.markdown(translate_text(f"🔥 **Daily Streak:** {st.session_state.streak_counter} days", st.session_state.language))

    st.markdown("---")
    
    # === New Features Section ===
    st.markdown("### 🌟 Mood Tracker")
    
    # Mood rating after conversations
    if st.session_state.messages and len(st.session_state.messages) > 2:
        st.markdown("How are you feeling after our conversation?")
        mood_cols = st.columns(5)
        moods = [
            ("😢", 1, "Very Sad"),
            ("😞", 2, "Sad"),
            ("😐", 3, "Neutral"),
            ("😊", 4, "Happy"),
            ("😁", 5, "Very Happy")
        ]
        
        for i, (emoji, rating, label) in enumerate(moods):
            with mood_cols[i]:
                if st.button(emoji, help=label, key=f"mood_{rating}"):
                    add_mood_rating(rating, emoji)
                    st.success(f"Recorded: {label}")
        
        # Show mood visualization if we have data
        if st.session_state.mood_data:
            st.markdown("---")
            st.markdown("### 📈 Your Mood History")
            fig = visualize_mood_data()
            if fig:
                st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    st.markdown("### 📔 Journaling")
    
    journal_prompts = [
        "What are you grateful for today?",
        "What challenged you today?",
        "What made you smile today?",
        "What did you learn about yourself today?",
        "What would you like to let go of?"
    ]
    
    selected_prompt = st.selectbox("Choose a journal prompt", [""] + journal_prompts)
    journal_entry = st.text_area("Write your thoughts here", height=100, key="journal_entry")
    
    if st.button("Save Journal Entry", key="save_journal"):
        if journal_entry:
            add_journal_entry(journal_entry, selected_prompt)
            st.success("Journal entry saved!")
            st.session_state.journal_entry = ""  # Clear the input
        else:
            st.warning("Please write something before saving.")
    
    st.markdown("---")
    st.markdown("### 🎯 Goal Setting")
    
    goal_categories = ["Wellness", "Social", "Productivity", "Mindfulness", "Personal Growth"]
    goal_category = st.selectbox("Goal Category", goal_categories)
    new_goal = st.text_input("Set a new goal", key="new_goal")
    
    if st.button("Add Goal", key="add_goal"):
        if new_goal:
            add_goal(new_goal, goal_category)
            st.success("Goal added!")
        else:
            st.warning("Please enter a goal.")
    
    # Display current goals
    if st.session_state.user_goals:
        st.markdown("#### Your Current Goals")
        for i, goal in enumerate(st.session_state.user_goals):
            col1, col2 = st.columns([4, 1])
            with col1:
                status = "✅" if goal["completed"] else "⏳"
                st.write(f"{status} {goal['goal']} ({goal['category']})")
            with col2:
                if not goal["completed"]:
                    if st.button("Complete", key=f"complete_{i}"):
                        update_goal_completion(i, True)
                        st.rerun()
    
    st.markdown("---")
    st.markdown("### 🎵 Meditation & Soundscapes")
    
    sound_options = {
        "Rain Sounds": "https://www.youtube.com/results?search_query=rain+sounds+relaxation",
        "Ocean Waves": "https://www.youtube.com/results?search_query=ocean+waves+relaxation",
        "Forest Ambience": "https://www.youtube.com/results?search_query=forest+sounds+relaxation",
        "Guided Meditation": "https://www.youtube.com/results?search_query=guided+meditation+for+anxiety",
        "Calming Music": "https://www.youtube.com/results?search_query=calming+music+for+stress+relief"
    }
    
    for sound_name, sound_link in sound_options.items():
        st.link_button(sound_name, sound_link)
    
    st.markdown("---")
    st.markdown("### 💬 Community Support")
    st.markdown("""
    **Messages from others:**
    - "You're stronger than you think. Keep going! 💪"
    - "It's okay to not be okay. Tomorrow is a new day. 🌅"
    - "Small steps still move you forward. Celebrate them! 🎉"
    - "Your feelings are valid. You matter. ❤️"
    """)
    
    # Conditionally display helpful resources in the sidebar
    if st.session_state.user_name and st.session_state.user_age and st.session_state.age_valid:
        st.markdown(translate_text("### 🔍 Helpful Resources", st.session_state.language))
        # Use user's faith to customize the video search
        faith_query = st.session_state.user_faith if st.session_state.user_faith and st.session_state.user_faith not in ["Not specified", "Atheist", "None"] else "mental health"
        
        suggestion = st.text_input(translate_text("🌐 Rephrase how you're feeling for video suggestions:", st.session_state.language))
        query = suggestion if suggestion else f"{faith_query} support"
        search_link = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
        st.markdown(translate_text(f"🔗 [Search YouTube for '{query}']({search_link})", st.session_state.language))
        
        st.markdown("---")
        st.markdown(translate_text("### Mood Boosters", st.session_state.language))
        st.link_button(translate_text("😂 Stand-up Comedy", st.session_state.language), "https://www.youtube.com/results?search_query=stand+up+comedy")
        st.link_button(translate_text("🎮 Online Games", st.session_state.language), "https://poki.com")

        st.markdown("---")
        st.markdown(translate_text("### Audio Stories", st.session_state.language))
        # Age-specific and faith-specific logic for audio stories
        if st.session_state.user_age < 18:
            st.link_button(translate_text("😴 Bedtime Stories for Kids", st.session_state.language), f"https://www.youtube.com/results?search_query={urllib.parse.quote(st.session_state.user_faith + ' bedtime stories for kids')}")
        else:
            st.link_button(translate_text("😴 Calm Sleep Stories", st.session_state.language), f"https://www.youtube.com/results?search_query={urllib.parse.quote(st.session_state.user_faith + ' calm audio stories')}")
    
        st.markdown("---")
        voice_choice = st.selectbox(translate_text("🔊 Choose a Voice", st.session_state.language), ["Female", "Male"])
        st.session_state.voice_choice = voice_choice
        
        # New: Sliders for voice customization
        st.markdown("---")
        st.markdown(translate_text("### 🎤 Customize Voice", st.session_state.language))
        pitch = st.slider(translate_text("Voice Pitch", st.session_state.language), min_value=50, max_value=200, value=100, step=10, key="pitch_slider")
        rate = st.slider(translate_text("Voice Rate", st.session_state.language), min_value=50, max_value=200, value=130, step=10, key="rate_slider")
        st.session_state.pitch = pitch
        st.session_state.rate = rate
        
        # New: Download conversation history button
        st.markdown("---")
        st.download_button(
            label=translate_text("Download Conversation", st.session_state.language),
            data=get_conversation_history_as_text(),
            file_name="MindfulBot_Conversation.txt",
            mime="text/plain",
        )

st.markdown("---")

# Footer
st.markdown("""
<p style='text-align:center;'>🚀 Made for the Hack Odisha 2025 </p>
""", unsafe_allow_html=True)