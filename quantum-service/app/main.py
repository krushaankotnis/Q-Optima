import logging
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from ibm_service import get_ibm_devices
from mock_service import get_mock_devices

logging.basicConfig(level=logging.INFO)
snapshot_lock = threading.Lock()
refresh_lock = threading.Lock()
device_snapshot = {
    "devices": get_mock_devices(),
    "warning": "IBM data is loading; simulated devices are available.",
}


def collect_devices():
    ibm_devices, warning = get_ibm_devices()
    devices = ibm_devices + get_mock_devices()
    return {"devices": devices, "warning": warning}


def refresh_snapshot():
    with refresh_lock:
        payload = collect_devices()
        with snapshot_lock:
            device_snapshot.update(payload)
        return payload


def get_snapshot():
    with snapshot_lock:
        return {**device_snapshot, "devices": list(device_snapshot["devices"])}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ("/", "/devices", "/health"):
            self.send_error(404, "Route not found")
            return
        if self.path == "/health":
            payload = {"status": "ok"}
        else:
            payload = get_snapshot()
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/refresh":
            self.send_error(404, "Route not found")
            return
        body = json.dumps(refresh_snapshot()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        logging.info("%s - %s", self.address_string(), format % args)


if __name__ == "__main__":
    port = 8000
    logging.info("Quantum service listening on port %s", port)
    threading.Thread(target=refresh_snapshot, daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
