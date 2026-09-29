# CoachRAG — AI-Powered Study Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Ollama-Local%20AI-black?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama">
  <img src="https://img.shields.io/badge/Flask-Backend-lightgrey?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status">
</p>

<p align="center">
  <strong>A local-first AI study assistant designed to make learning smarter, faster, and more accessible.</strong>
</p>

<p align="center">
  Upload study materials, ask questions, explore topics, research the web, and organize your learning in one workspace.
</p>

---

## Overview

**CoachRAG** is an AI-powered study assistant that helps students understand concepts, explore subjects, and work with their study materials.

It combines a modern web interface, a Python backend, and locally running AI models through Ollama.

Unlike a document-only chatbot, CoachRAG supports both document-based questions and general AI conversations. It also provides web search, source citations, and study session management.

The project is designed with a local-first approach, allowing users to run AI models on their own computers.

---

## Features

### 1. AI Study Assistant
- Ask questions about programming, computer science, and other subjects.
- Get explanations in student-friendly language.
- Explore topics beyond uploaded documents.
- Maintain conversation context during a chat.
- Receive structured answers with examples and code where appropriate.

### 2. Document-Based Question Answering
- Upload PDF, DOCX, TXT, and Markdown files.
- Extract readable text from study materials.
- Search uploaded documents for relevant information.
- Ask questions about your notes and learning materials.
- Generate answers grounded in relevant document content.

### 3. Local AI Integration
- Powered by Ollama.
- Supports locally installed language models.
- Uses the Qwen 2.5 3B model by default.
- Run AI inference locally without requiring a paid AI API.
- Keep document-based AI processing on your computer.

### 4. Web Search
- Search the web for information.
- Retrieve search results through the Python backend.
- Use search evidence to generate research answers.
- Display source links and citations.

### 5. Source Citations
- Collect sources from web research.
- View saved citations in a dedicated section.
- Open source links directly.
- Manage and delete saved citations.

### 6. Study Sessions
- Create personalized study sessions.
- Add learning goals and descriptions.
- Track completed and pending sessions.
- Organize your learning activities.

### 7. Knowledge Library
- Upload and organize study materials.
- Search uploaded documents.
- Preview extracted document text.
- Delete documents you no longer need.
- Export a JSON backup of your workspace.

### 8. Modern User Interface
- Dark-themed dashboard.
- Responsive layout.
- Dedicated knowledge library.
- Interactive AI chat interface.
- Markdown-formatted AI responses.
- Code blocks and readable explanations.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, Flask |
| AI Model Runtime | Ollama |
| Language Model | Qwen 2.5 3B |
| PDF Processing | PDF.js, pypdf |
| DOCX Processing | Mammoth.js, python-docx |
| Web Search | DuckDuckGo |
| Data Storage | Browser Local Storage |
| Development Tools | VS Code, Git, GitHub |

---

## Project Architecture

```text
CoachRAG/
│
├── app.js
│   └── Frontend application logic
│
├── index.html
│   └── Main application interface
│
├── style.css
│   └── Dashboard styling and responsive design
│
├── server.py
│   └── Python backend and API services
│
├── README.md
│   └── Project documentation
│
├── .gitignore
│   └── Excludes unnecessary and private files
│
├── data/
│   └── Local application data
│
└── uploads/
    └── Local uploaded documents
```

---

## Getting Started

Follow these instructions to run CoachRAG locally.

### Prerequisites

Install the following software:

- Python 3.11 or later
- Git
- Ollama
- A modern web browser

### 1. Clone the Repository

```bash
git clone https://github.com/prashanthreddy-134/CoachRAG-AI-Study-Assistant.git
```

Navigate to the project directory:

```bash
cd CoachRAG-AI-Study-Assistant
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install flask flask-cors requests werkzeug pypdf python-docx beautifulsoup4
```

### 4. Install and Run Ollama

Download and install Ollama from its official website:

https://ollama.com/

Pull the default model:

```bash
ollama pull qwen2.5:3b
```

Make sure Ollama is running before using the AI assistant.

### 5. Start the Backend

Run the following command from the project directory:

```bash
python server.py
```

The backend should be available at:

```text
http://127.0.0.1:5500
```

Keep the terminal running while using CoachRAG.

### 6. Open the Application

Open the following address in your browser:

```text
http://127.0.0.1:5500
```

If the server does not serve the frontend automatically, use a local static server to serve `index.html` and configure the frontend API address accordingly.

---

## How to Use

1. Start Ollama and ensure your selected model is available.
2. Start the CoachRAG Python backend.
3. Open the application in your browser.
4. Upload your study materials through the Knowledge Library.
5. Open **Ask CoachRAG**.
6. Choose Auto, My Documents, Local AI, or Web Search.
7. Enter your question and receive an answer.
8. Explore citations and organize your study sessions.

### Answer Modes

| Mode | Description |
|---|---|
| Auto | Selects a suitable source based on the question |
| My Documents | Answers using uploaded study materials |
| Local AI | Uses the locally running Ollama model |
| Web Search | Searches the web and uses retrieved results |

---

## Privacy and Data

CoachRAG is designed around local-first usage.

- Uploaded document text is stored in browser Local Storage.
- Local AI requests are sent to the Ollama service running on your computer.
- Web search requires an internet connection.
- Web search queries are sent to the configured search backend.

Avoid uploading confidential documents or sensitive personal information.

---

## Screenshots

Add screenshots of your application here.

| Knowledge Library | AI Assistant |
|---|---|
| Add your library screenshot here | Add your chat screenshot here |

---

## Future Improvements

- [ ] Improved retrieval using vector embeddings
- [ ] Semantic document search
- [ ] More advanced RAG pipelines
- [ ] Conversation history management
- [ ] AI-generated flashcards
- [ ] Automatic quiz generation
- [ ] Improved document summarization
- [ ] More language model options
- [ ] Enhanced mobile interface
- [ ] User authentication and profiles

---

## Limitations

- AI response quality depends on the selected local model.
- Local model performance depends on available hardware.
- Web search requires an internet connection.
- Document answers depend on successful text extraction and retrieval.
- The current application uses browser-based storage for workspace data.

---

## Developer

**Prashanth Reddy S**

Information Science and Engineering Student  
Frontend Developer | Aspiring Full-Stack Developer | AI/ML Enthusiast

- GitHub: [@prashanthreddy-134](https://github.com/prashanthreddy-134)
- Project: [CoachRAG — AI Study Assistant](https://github.com/prashanthreddy-134/CoachRAG-AI-Study-Assistant)

---

## License

This project is available under the MIT License.

You can add a `LICENSE` file to the repository if you choose to distribute the project under this license.

---

<p align="center">
  Built with Python, JavaScript, and local AI.
</p>

<p align="center">
  <strong>CoachRAG — Learn Smarter. Study Better.</strong>
</p>