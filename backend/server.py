from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_socketio import SocketIO, emit
import os
import psutil
import subprocess
import time
from datetime import datetime
from datetime import timedelta
from collections import deque

# Initialize Flask app
app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend")
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for last 10 web-based logins
LAST_LOGINS = deque(maxlen=10)

# In-memory storage for active sessions
ACTIVE_USERS = {}
# Dynamic mapping of OS usernames to actual usernames
USER_MAPPING = {}

# In-memory credentials for login (replace with secure database in production)
VALID_CREDENTIALS = {"admin": "password123",
                     "admin2": "password123",
                     "admin3": "password123"}
# Routes
@app.route('/')
def home():
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    actual_username = data.get('username')
    password = data.get('password')
    client_ip = request.remote_addr  # Get the client's IP address

    if actual_username in VALID_CREDENTIALS and VALID_CREDENTIALS[actual_username] == password:
        # Store the login time, username, and IP address
        login_entry = {
            "actual_username": actual_username,
            "login_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "ip_address": client_ip
        }
        LAST_LOGINS.appendleft(login_entry)  # Add to the front of the deque

        # Mark user as active
        ACTIVE_USERS[actual_username] = login_entry

        return jsonify({"status": "success", "message": "Login successful"}), 200

    return jsonify({"status": "failure", "message": "Invalid credentials"}), 401



@app.route('/api/system_stats', methods=['GET'])
def system_stats():
    try:
        stats = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_info": psutil.virtual_memory()._asdict(),
            "disk_usage": {
                "used": psutil.disk_usage('/').used,   # Send raw bytes
                "total": psutil.disk_usage('/').total  # Send raw bytes
            },
            "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else os.getloadavg(),
            "cpu_cores": psutil.cpu_count(logical=True)
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/processes', methods=['GET'])
def processes():
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        processes.append({
            "pid": proc.info['pid'],
            "name": proc.info['name'],
            "cpu": proc.info['cpu_percent'],
            "memory": proc.info['memory_info'].rss // (1024 * 1024)  # Memory in MB
        })
    # Remove this line: processes = sorted(processes, key=lambda x: x[sort_by])
    # Just return in the order fetched:
    return jsonify(processes)

@app.route('/api/current_logged_users', methods=['GET'])
def current_logged_users():
    try:
        # Return active users
        current_users = [
            {
                "username": user_data["actual_username"],
                "login_time": user_data["login_time"]
            }
            for user_data in ACTIVE_USERS.values()
        ]
        return jsonify(current_users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/os_username', methods=['GET'])
def os_username():
    import getpass
    return jsonify({"username": getpass.getuser()})

@app.route('/api/system_uptime', methods=['GET'])
def system_uptime():
    uptime_seconds = time.time() - psutil.boot_time()
    uptime_str = str(timedelta(seconds=int(uptime_seconds)))  # Fix timedelta usage
    return jsonify({"uptime": uptime_str})

@app.route('/api/system_logs', methods=['GET'])
def system_logs():
    try:
        logs = subprocess.check_output("tail -n 50 /var/log/syslog", shell=True).decode()
        reversed_logs = logs.splitlines()[::-1]  # Reverse the order of the logs
        return jsonify(reversed_logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/last_logged_users', methods=['GET'])
def last_logged_users():
    try:
        # Return the last 10 web logins with IP addresses
        return jsonify(list(LAST_LOGINS))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/dashboard', methods=['GET'])
def dashboard():
    return render_template('dashboard.html')

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

# WebSocket for real-time stats
@socketio.on('connect')
def handle_connect():
    print("Client connected")
    emit('message', {"data": "Connected to WebSocket"})

@socketio.on('request_stats')
def send_real_time_stats():
    while True:
        stats = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_info": psutil.virtual_memory().percent
        }
        emit('stats_update', stats)
        socketio.sleep(2)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8765, debug=True)