<div align="center">
  
  # 📓 Smart Diary Web App
  
  <p align="center">
    <strong>An intelligent journaling web application that helps you gain deeper insights into your thoughts and emotions.</strong>
  </p>
  
  ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-bard&logoColor=white)
  ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

</div>

<hr />

## ✨ Features (Backend)

Leveraging the power of Google Gemini AI, Smart Diary provides a next-level journaling experience!

*   🔐 **User Authentication**: Secure user login and registration.
*   📝 **Memory Management**: Create, read, update, and delete diary entries (memories) with mood tracking.
*   🧠 **Smart AI Insights**:
    *   📅 **Weekly & Monthly Reflections**: AI-generated summaries and insights based on your recent memories.
    *   🎭 **Mood Analysis**: Track and analyze your emotional trends over time.
    *   🔄 **Habit Detection**: Discover patterns in your writing and journaling habits.
    *   🚀 **Productivity Insights**: Understand how and when you are most productive.
    *   💡 **AI Suggestions**: Get personalized suggestions and motivation to keep journaling.
*   ⚡ **AI Tools**: Quick AI-powered tools like summarize, improve writing, detect mood, and generate tags for individual entries.

## 📁 Project Structure

```text
├── backend/                  # FastAPI Application 🚀
│   ├── app/                  # Main application code (routes, models, services, AI)
│   ├── requirements.txt      # Python dependencies
│   └── smart_diary.db        # SQLite database file
├── frontend/                 # Frontend Web Application (Coming Soon! 🎨)
└── design/                   # UI/UX design assets and planning 🖌️
```

## 🚀 Getting Started

Follow these steps to get the backend running locally.

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    
    # On Windows 🪟:
    .\venv\Scripts\activate
    # On macOS/Linux 🍎/🐧:
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `backend/` directory and add the following keys:
    ```env
    SECRET_KEY=your_super_secret_key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
    > **Note:** Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/).

5.  **Run the application:**
    ```bash
    uvicorn app.main:app --reload
    ```

6.  **Access the API Documentation:**
    Open your browser and navigate to `http://127.0.0.1:8000/docs` to view the interactive Swagger UI and test the API endpoints.

<hr />

## 🔮 Future Plans

*   🖥️ Develop the frontend user interface.
*   ✍️ Implement rich text editing for diary entries.
*   📊 Add data visualization charts for mood and productivity insights.

<div align="center">
  <i>Made with ❤️ by Mehek</i>
</div>
