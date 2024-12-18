from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_socketio import SocketIO, emit
import os
import psutil
import subprocess
import time
from datetime import datetime
from datetime import timedelta

# Initialize Flask app
app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend")
socketio = SocketIO(app, cors_allowed_origins="*")

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
    os_username = data.get('os_username')
    password = data.get('password')

    if actual_username in VALID_CREDENTIALS and VALID_CREDENTIALS[actual_username] == password:
        # Add OS-to-actual username mapping
        if os_username not in USER_MAPPING:
            USER_MAPPING[os_username] = set()
        USER_MAPPING[os_username].add(actual_username)
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
    sort_by = request.args.get('sort_by', 'pid')
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        processes.append({
            "pid": proc.info['pid'],
            "name": proc.info['name'],
            "cpu": proc.info['cpu_percent'],
            "memory": proc.info['memory_info'].rss // (1024 * 1024)  # Memory in MB
        })
    processes = sorted(processes, key=lambda x: x[sort_by])
    return jsonify(processes)

@app.route('/api/current_logged_users', methods=['GET'])
def current_logged_users():
    try:
        users = psutil.users()
        current_users = []

        for user in users:
            actual_names = USER_MAPPING.get(user.name, [user.name])
            for actual_name in actual_names:
                current_users.append({
                    "username": f"{actual_name} ({user.name})",
                    "terminal": f"Graphical Session {user.terminal}" if user.terminal.startswith(":") else f"TTY {user.terminal}",
                    "started": datetime.fromtimestamp(user.started).strftime("%Y-%m-%d %H:%M:%S"),
                })

        return jsonify(current_users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        users = psutil.users()
        current_users = []

        for user in users:
            # Fetch all actual usernames mapped to this OS username
            actual_usernames = USER_MAPPING.get(user.name, [user.name])
            for actual_username in actual_usernames:
                current_users.append({
                    "username": f"{actual_username} ({user.name})",
                    "terminal": user.terminal,
                    "started": datetime.fromtimestamp(user.started).strftime("%Y-%m-%d %H:%M:%S"),
                })

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
    logs = subprocess.check_output("tail -n 50 /var/log/syslog", shell=True).decode()
    return jsonify(logs.splitlines())

@app.route('/api/last_logged_users', methods=['GET'])
def last_logged_users():
    try:
        # Run the 'last' command to fetch the last 10 logins
        result = subprocess.run(['last', '-n', '10'], stdout=subprocess.PIPE, text=True)
        logins = []
        for line in result.stdout.splitlines():
            # Ignore empty lines and "wtmp begins" footer
            if line.strip() and not line.startswith('wtmp begins'):
                parts = line.split()

                # Exclude non-user entries (e.g., "reboot", "shutdown")
                if parts[0] in ['reboot', 'shutdown']:
                    continue

                # Parse the line for user information
                if len(parts) >= 7:
                    # Handle invalid IPs (e.g., ":1") and replace them with "N/A"
                    ip = parts[2] if len(parts) > 8 and not parts[2].startswith(":") else "N/A"
                    logins.append({
                        "username": parts[0],
                        "terminal": parts[1],
                        "ip": ip,
                        "login_time": " ".join(parts[3:7])
                    })
        return jsonify(logins)
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