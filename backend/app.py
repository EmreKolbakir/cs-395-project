from flask import Flask, request, jsonify, session, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import psutil
import subprocess
import time

#does not work right now as intended. Cant link and render the html files.
#now it can link but css is not working properly
app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend/templates")

app.secret_key = "your_secret_key"  # Change this to a secure random key.

# Example user database (replace with a real database in production)
users = {"a": generate_password_hash("a")}

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in users and check_password_hash(users[username], password):
        session['user'] = username
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# Logout endpoint
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logged out"}), 200

# Middleware to protect routes
@app.before_request
def require_login():
    if request.endpoint is None or request.endpoint in ['login_page', 'login', 'logout']:
        return  # Allow these routes without login
    if request.endpoint.startswith('static'):
        return  # Allow static files without login
    if 'user' not in session:
        return jsonify({"message": "Login required"}), 401

# Serve login page
@app.route('/')
def login_page():
    return render_template('../frontend/login.html')

# Serve dashboard page
@app.route('/dashboard')
def dashboard_page():
    return render_template('../frontend/dashboard.html')

# System stats endpoint
@app.route('/stats', methods=['GET'])
def get_stats():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()._asdict()
    disk = psutil.disk_usage('/')._asdict()
    load = psutil.getloadavg()

    return jsonify({
        "cpu": cpu,
        "memory": memory,
        "disk": disk,
        "load": load
    }), 200

# Processes endpoint
@app.route('/processes', methods=['GET'])
def get_processes():
    sort_by = request.args.get("sort_by", "cpu")  # Options: cpu, memory, pid
    processes = [
        {
            "pid": proc.pid,
            "name": proc.info['name'],
            "cpu_percent": proc.info['cpu_percent'],
            "memory_percent": proc.info['memory_percent']
        }
        for proc in psutil.process_iter(['name', 'cpu_percent', 'memory_percent'])
    ]

    processes.sort(key=lambda x: x[sort_by], reverse=True)
    return jsonify(processes), 200

# Process summary endpoint
@app.route('/process_summary', methods=['GET'])
def get_process_summary():
    process_states = {}
    for proc in psutil.process_iter():
        state = proc.status()
        process_states[state] = process_states.get(state, 0) + 1

    return jsonify({"process_states": process_states}), 200

# System logs endpoint
@app.route('/system_logs', methods=['GET'])
def get_logs():
    try:
        with open('/var/log/syslog', 'r') as file:
            lines = file.readlines()[-50:]
        return jsonify({"logs": lines}), 200
    except FileNotFoundError:
        return jsonify({"message": "System log file not found"}), 404

# Last logged-in users endpoint
@app.route('/last_users', methods=['GET'])
def get_last_users():
    result = subprocess.run(['last', '-n', '10'], stdout=subprocess.PIPE)
    output = result.stdout.decode('utf-8')
    return jsonify({"last_users": output.split('\n')}), 200

# System uptime endpoint
@app.route('/api/uptime', methods=['GET'])
def get_uptime():
    boot_time = psutil.boot_time()
    current_time = time.time()
    uptime_seconds = current_time - boot_time
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    formatted_uptime = f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"
    return jsonify({"uptime": formatted_uptime}), 200

# Application entry point
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8765, debug=True)