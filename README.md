🧠 FeelEase – AI Mental Health Chatbot
FeelEase is an empathetic AI mental health chatbot designed to provide a supportive and personalized space for users to manage stress, anxiety, and difficult emotions. Unlike conventional bots, FeelEase focuses on providing human-like empathy, active coping tools, and tailored support to create a truly comforting experience.

✨ Key Features
Personalized & Empathetic AI: The bot uses the Google Gemini API with a custom prompt to deliver responses that are compassionate, non-judgmental, and tailored to the user's name and faith.

Empathetic Crisis Response: When a user expresses thoughts of self-harm, the bot provides immediate, human-like emotional validation before giving out clinical resources, showing a deep understanding of user needs.

Multilingual Support: Communicate seamlessly in English, Hindi, and Bengali. The bot's responses are automatically translated based on the user's selection, making it accessible to a wider audience.

Voice Customization: Users can choose between a male or female voice and adjust the pitch and speaking rate to create a companion that is most comfortable for them.

Interactive Coping Tools:

Breathing Exercise: A guided, 5-minute breathing timer with real-time updates to help users practice mindfulness.

Mood Boosters: Links to stand-up comedy and online games to provide a quick distraction.

Audio Stories: Age and faith-specific audio stories to help users relax or fall asleep.

User Data & Gamification: The bot remembers the user's profile and tracks their daily usage with a daily streak counter to encourage consistent mental wellness check-ins.

Downloadable History: Save and download your full conversation as a text file for personal journaling or reflection.

🛠️ Tech Stack
Framework: Streamlit

AI: Python (Google Gemini API)

Libraries: requests, pyttsx3, SpeechRecognition, deep-translator

🚀 Installation & Usage
1️⃣ Clone the Repository
Open your terminal and clone the repository.

git clone https://github.com/arywk40-hue/FEEL-EASE-CHAT-BOT.git
cd FEEL-EASE-CHAT-BOT

2️⃣ Get Your Gemini API Key
Sign up at Google AI Studio.

Create a new API key and copy it.

3️⃣ Set Up Your Environment
Create a Python virtual environment:

python3 -m venv venv
source venv/bin/activate

Install the required libraries:

pip install streamlit pyttsx3 requests SpeechRecognition deep-translator

Set your API key as an environment variable:

macOS/Linux: export GOOGLE_API_KEY="YOUR_API_KEY_HERE"

Windows: set GOOGLE_API_KEY="YOUR_API_KEY_HERE"

4️⃣ Run the App
Launch the Streamlit application:

streamlit run app.py

👨‍💻 Contributing
Contributions are welcome! Please open an issue or submit a pull request if you have ideas for new features or bug fixes.
