import webview
import threading
import uvicorn
import os
import sys
import time
import socket
import multiprocessing

# --- FIX FOR MAC FINDER ---
if getattr(sys, 'frozen', False):
    if sys.platform == "darwin":
        bundle_dir = os.path.abspath(os.path.join(os.path.dirname(sys.executable), '../../..'))
        os.chdir(bundle_dir)
    else:
        os.chdir(os.path.dirname(sys.executable))
else:
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
# ---------------------------

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from main import app as backend_app

def get_base_path():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.abspath(os.path.dirname(__file__))

def setup_app():
    base_path = get_base_path()
    FRONTEND_DIST_DIR = os.path.join(base_path, "nexus-frontend", "dist")

    if os.path.exists(FRONTEND_DIST_DIR):
        backend_app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="static")
    else:
        print(f"Frontend dist folder not found at {FRONTEND_DIST_DIR}")
        
def start_server():
    uvicorn.run(backend_app, host="127.0.0.1", port=8000, log_level="warning")

def wait_for_server():
    """Wait until port 8000 is open to ensure Uvicorn has fully started."""
    for _ in range(50):  # Wait up to 5 seconds
        try:
            with socket.create_connection(('127.0.0.1', 8000), timeout=0.1):
                return True
        except OSError:
            time.sleep(0.1)
    return False

if __name__ == '__main__':
    multiprocessing.freeze_support()
    setup_app()
    
    # Start the FastAPI server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # WAIT for the server to be ready before showing the window
    wait_for_server()

    # Create and launch the Native Desktop Window
    window = webview.create_window(
        'Nexus Engine', 
        'http://127.0.0.1:8000', 
        width=1280, 
        height=800,
        min_size=(1000, 600)
    )
    
    # Force debug OFF and clear cached WebKit states that keep the inspector open
    webview.start(debug=False, private_mode=False)
