import os  # Import os to fetch environment variables
import asyncio
import json
import pathlib
import ssl
import time

import psutil
from aiohttp import web


async def serve_static(request):
    """Serve static files (CSS, JS, HTML)."""
    filename = request.match_info.get("filename", "login.html")
    subdir = request.match_info.get("subdir", "")
    base_path = pathlib.Path(__file__).parent.joinpath("../frontend")

    # Build the file path
    file_path = base_path.joinpath(subdir, filename)

    if file_path.exists():
        return web.FileResponse(file_path)
    else:
        raise web.HTTPNotFound()


async def get_system_stats():
    """Collect system statistics."""
    stats = {
        "cpu": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage("/")._asdict(),
        "load_avg": psutil.getloadavg(),
    }
    return stats


async def send_stats(request):
    """Send system stats to WebSocket client."""
    print("Client connected")
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.text and msg.data == "stats":
            data = await get_system_stats()
            response = ["stats", data]
            await ws.send_str(json.dumps(response))
        elif msg.type == web.WSMsgType.binary:
            # Ignore binary messages
            continue
        elif msg.type == web.WSMsgType.close:
            break

    return ws


async def serve_mock_data(request):
    """Serve the mock_data.json file."""
    mock_data_path = pathlib.Path(__file__).parent.joinpath("../frontend/js/mock_data.json")
    if mock_data_path.exists():
        return web.FileResponse(mock_data_path)
    else:
        raise web.HTTPNotFound()


async def get_uptime(request):
    """API route to get system uptime."""
    boot_time = psutil.boot_time()
    current_time = time.time()
    uptime_seconds = current_time - boot_time
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    formatted_uptime = f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"
    return web.json_response({"uptime": formatted_uptime})


def create_ssl_context():
    """Create SSL context for secure WebSocket connection."""
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    cert_file = pathlib.Path("/app/cert/localhost.crt")
    key_file = pathlib.Path("/app/cert/localhost.key")
    ssl_context.load_cert_chain(cert_file, key_file)
    return ssl_context


def run():
    """Start the application."""
    ssl_context = create_ssl_context()
    app = web.Application()
    app.add_routes([
        web.get("/", lambda _: web.HTTPFound(f"/frontend/login.html")),
        web.get("/frontend/{subdir}/{filename}", serve_static),
        web.get("/frontend/{filename}", serve_static),
        web.get("/frontend/js/mock_data.json", serve_mock_data),
        web.get("/api/uptime", get_uptime),
    ])

    # Fetch user ID from environment and use as the port
    user_id = os.getenv("USER_ID", "8765")  # Default to 8765 if USER_ID is not provided
    web.run_app(app, port=int(user_id), ssl_context=ssl_context)


if __name__ == "__main__":
    print("Server starting...")
    run()
