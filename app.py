import webview
import threading
import uvicorn
import os
import sys
import time
import socket
import shutil
import multiprocessing

# --- THE "STANDALONE APP" FIX ---
# 1. Find the internal hidden folder where PyInstaller stores bundled files
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    bundled_dir = sys._MEIPASS
else:
    bundled_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Find the Mac's safe background application folder
app_data_dir = os.path.expanduser("~/Library/Application Support/NexusEngine")
os.makedirs(app_data_dir, exist_ok=True)

# 3. Copy our config files from the hidden bundle into the safe folder
files_to_copy = ['.env', 'credentials.json', 'token.json']
for file_name in files_to_copy:
    src = os.path.join(bundled_dir, file_name)
    dst = os.path.join(app_data_dir, file_name)
    # We overwrite to ensure friends get your latest API keys
    if os.path.exists(src):
        try:
            shutil.copy2(src, dst)
        except Exception:
            pass

# 4. Change the Current Working Directory to the safe folder.
# Now, whenever Python saves pipelines.json or temp_processing, it goes safely here!
os.chdir(app_data_dir)
# --------------------------------

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from main import app as backend_app

def setup_app():
    # The frontend UI is static, so we load it directly from the bundled hidden folder
    FRONTEND_DIST_DIR = os.path.join(bundled_dir, "nexus-frontend", "dist")

    if os.path.exists(FRONTEND_DIST_DIR):
        backend_app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="static")
    else:
        print(f"Frontend dist folder not found at {FRONTEND_DIST_DIR}")
        
def start_server():
    uvicorn.run(backend_app, host="127.0.0.1", port=8000, log_level="warning")

def wait_for_server():
    """Wait until port 8000 is open to ensure Uvicorn has fully started."""
    for _ in range(50):
        try:
            with socket.create_connection(('127.0.0.1', 8000), timeout=0.1):
                return True
        except OSError:
            time.sleep(0.1)
    return False

if __name__ == '__main__':
    multiprocessing.freeze_support()
    setup_app()
    
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    wait_for_server()

    # Disable pywebview's default behavior that traps external links inside the app window
    webview.settings['OPEN_EXTERNAL_LINKS_IN_BROWSER'] = True

    window = webview.create_window(
        'Nexus Engine', 
        'http://127.0.0.1:8000', 
        width=1280, 
        height=800,
        min_size=(1000, 600)
    )
    
    webview.start(debug=False, private_mode=False)