Nexus Engine - Windows Installation Guide

Welcome! This guide will walk you through setting up and building the Nexus Engine application on a brand new Windows computer.

Step 1: Install Prerequisites

Before you start, you must install these two programs on your PC:

Python: Download from python.org.

 CRITICAL: When the installer opens, you MUST check the box at the very bottom that says "Add Python to PATH" before clicking Install.

Node.js: Download the LTS version from nodejs.org.

Step 2: Download the Code

If you were given a GitHub link, open your Command Prompt and run:

git clone <URL_TO_REPOSITORY>
cd <FOLDER_NAME>


(If you were given a ZIP file instead, simply extract the folder and open your Command Prompt inside that extracted folder).

Step 3: Add the Secret Credentials

Because this app connects to Google Drive, the security keys are kept private. You must get these 3 files from the developer and place them directly in the main project folder (next to app.py):

.env

credentials.json

token.json

Step 4: Install Python Libraries

In your Command Prompt (make sure you are in the main project folder), run this exact command to install all required backend engines:

pip install pywebview uvicorn fastapi pyinstaller google-api-python-client google-auth-httplib2 google-auth-oauthlib pydantic python-multipart google-genai openai openpyxl python-dotenv tenacity pillow


Step 5: Build the React User Interface

Next, we need to compile the frontend visuals. Run these commands one by one:

cd nexus-frontend
npm install
npm run build
cd ..


(Make sure to run cd .. at the end so your terminal goes back to the main folder!)

Step 6: Package the Windows Application

Finally, package the entire project into a single .exe file by running these two commands:

rmdir /s /q build dist

pyinstaller --windowed --name "NexusEngine" --collect-all google --add-data "nexus-frontend/dist;nexus-frontend/dist" --add-data ".env;." --add-data "credentials.json;." --add-data "token.json;." app.py


You're Done!

Once the build finishes, open the newly created dist folder inside your project. Double-click NexusEngine.exe to launch the app!
