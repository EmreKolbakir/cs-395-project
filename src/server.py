import os
import asyncio
import json
import pathlib
import ssl
import time
import psutil
from aiohttp import web
from collections import deque

# Fixed Credentials for 5 Users
VALID_CREDENTIALS = {
    "user1": "pass1",
    "user2": "pass2",
    "user3": "pass3",
    "user4": "pass4",
    "user5": "pass5",
}

# In-Memory Storage for Sessions
CURRENT_LOGGED_USERS = {}
LAST_LOGINS = deque(maxlen=10)

# Serve Static Files
async def serve_static(request):
    filename = request.match_info.get("filename", "login.html")
    subdir = request.match_info.get("subdir", "")
    base_path = pathlib.Path(__file__).parent.joinpath("../frontend")
    file_path = base_path.joinpath(subdir, filename)

    if file_path.exists():
        return web.FileResponse(file_path)
    else:
        raise web.HTTPNotFound()

# Login Endpoint
async def api_login(request):
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
        client_ip = request.remote or "127.0.0.1"

        if username in VALID_CREDENTIALS and VALID_CREDENTIALS[username] == password:
            login_time = time.strftime("%Y-%m-%d %H:%M:%S")

            # Add to LAST_LOGINS, avoiding duplicates
            login_entry = {"username": username, "login_time": login_time, "ip_address": client_ip}
            if not any(user["username"] == username for user in LAST_LOGINS):
                LAST_LOGINS.appendleft(login_entry)

            # Add to CURRENT_LOGGED_USERS
            CURRENT_LOGGED_USERS[username] = login_entry

            return web.json_response({"status": "success", "message": "Login successful"})
        return web.json_response({"status": "failure", "message": "Invalid credentials"}, status=401)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

# Fetch Current Logged-In Users
async def api_current_users(request):
    return web.json_response(list(CURRENT_LOGGED_USERS.values()))

# Fetch Last Logged Users
async def api_last_logged_users(request):
    return web.json_response(list(LAST_LOGINS))

# System Stats
async def api_system_stats(request):
    stats = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_info": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/')._asdict(),
    }
    return web.json_response(stats)

# Processes
async def api_processes(request):
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu": proc.info['cpu_percent'],
                "memory": proc.info['memory_info'].rss // (1024 * 1024),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return web.json_response(processes)

# System Logs
async def api_system_logs(request):
    try:
        log_file = "/var/log/syslog" if os.path.exists("/var/log/syslog") else "/var/log/messages"
        if os.path.exists(log_file):
            logs = os.popen(f"tail -n 50 {log_file}").read().splitlines()
            return web.json_response(logs)

        # Return mock logs if no real logs
        return web.json_response([f"Log line {i}: Sample log entry" for i in range(1, 51)])
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

# System Uptime
async def api_system_uptime(request):
    uptime_seconds = time.time() - psutil.boot_time()
    formatted_uptime = time.strftime("%H:%M:%S", time.gmtime(uptime_seconds))
    return web.json_response({"uptime": formatted_uptime})

# Logout Endpoint
async def api_logout(request):
    try:
        data = await request.json()
        username = data.get("username")
        if username in CURRENT_LOGGED_USERS:
            del CURRENT_LOGGED_USERS[username]
            return web.json_response({"status": "success", "message": "Logout successful"})
        return web.json_response({"status": "failure", "message": "User not logged in"}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

# SSL Setup
def create_ssl_context():
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    cert_file = pathlib.Path("/app/cert/localhost.crt")
    key_file = pathlib.Path("/app/cert/localhost.key")
    ssl_context.load_cert_chain(cert_file, key_file)
    return ssl_context

# App Setup and Routes
def run():
    ssl_context = create_ssl_context()
    app = web.Application()
    app.add_routes([
        web.get("/", lambda _: web.HTTPFound("/frontend/login.html")),
        web.get("/frontend/{subdir}/{filename}", serve_static),
        web.get("/frontend/{filename}", serve_static),
        web.post("/api/login", api_login),
        web.post("/api/logout", api_logout),
        web.get("/api/current_users", api_current_users),
        web.get("/api/last_logged_users", api_last_logged_users),
        web.get("/api/system_stats", api_system_stats),
        web.get("/api/processes", api_processes),
        web.get("/api/system_logs", api_system_logs),
        web.get("/api/system_uptime", api_system_uptime),
    ])
    web.run_app(app, port=8765, ssl_context=ssl_context)

if __name__ == "__main__":
    print("Server started at https://localhost:8765")
    run()
