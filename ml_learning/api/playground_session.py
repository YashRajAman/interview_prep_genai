"""
ML Odyssey — Interactive Playground Session & Environment Manager
Each session runs in a dedicated subprocess inside an isolated temporary directory.
Maintains state across cell runs and completely deletes the directory when the session ends.
"""

import os
import sys
import json
import time
import uuid
import shutil
import tempfile
import threading
import subprocess
from typing import Dict, Optional, Any

KERNEL_WORKER_PATH = os.path.join(os.path.dirname(__file__), "kernel_worker.py")


class PlaygroundSession:
    """Manages an isolated interactive Python kernel session."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = time.time()
        self.last_active = time.time()
        self.lock = threading.Lock()

        # Create isolated temporary directory for this notebook session
        self.working_dir = os.path.join(tempfile.gettempdir(), f"ml_odyssey_env_{self.session_id}")
        os.makedirs(self.working_dir, exist_ok=True)

        self.process: Optional[subprocess.Popen] = None
        self._spawn_worker()

    def _spawn_worker(self):
        """Spawn the dedicated kernel_worker.py subprocess in the isolated directory."""
        self.process = subprocess.Popen(
            [sys.executable, "-u", KERNEL_WORKER_PATH],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            cwd=self.working_dir
        )

    def is_alive(self) -> bool:
        """Check if worker process is running."""
        return self.process is not None and self.process.poll() is None

    def execute(self, code: str, timeout: int = 30, theme: Optional[str] = None) -> Dict[str, Any]:
        """Execute Python code in the persistent session kernel."""
        with self.lock:
            self.last_active = time.time()

            # Respawn if worker died
            if not self.is_alive():
                self._spawn_worker()

            req = {"action": "execute", "code": code, "theme": theme}
            try:
                self.process.stdin.write(json.dumps(req) + "\n")
                self.process.stdin.flush()
            except Exception as e:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Failed to send code to kernel: {e}",
                    "result": None,
                    "result_html": None,
                    "plots": []
                }

            # Read JSON response with timeout using thread timer or readline
            response_container = []

            def read_line():
                try:
                    line = self.process.stdout.readline()
                    response_container.append(line)
                except Exception as e:
                    response_container.append(None)

            reader_thread = threading.Thread(target=read_line, daemon=True)
            reader_thread.start()
            reader_thread.join(timeout=timeout)

            if reader_thread.is_alive():
                # Execution timed out
                self.interrupt()
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"TimeoutError: Cell execution exceeded {timeout} seconds limit.",
                    "result": None,
                    "result_html": None,
                    "plots": []
                }

            if not response_container or not response_container[0]:
                worker_stderr = ""
                try:
                    if self.process and self.process.stderr and self.process.poll() is not None:
                        worker_stderr = self.process.stderr.read()
                except Exception:
                    pass
                err_msg = "Kernel process terminated unexpectedly."
                if worker_stderr.strip():
                    err_msg += f"\n{worker_stderr.strip()}"
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": err_msg,
                    "result": None,
                    "result_html": None,
                    "plots": []
                }

            try:
                return json.loads(response_container[0])
            except Exception as e:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Error parsing kernel response: {e}\nRaw output: {response_container[0]}",
                    "result": None,
                    "result_html": None,
                    "plots": []
                }

    def set_theme(self, theme: str) -> bool:
        """Dynamically update the Matplotlib aesthetic theme in the running worker."""
        with self.lock:
            self.last_active = time.time()
            if self.is_alive():
                try:
                    self.process.stdin.write(json.dumps({"action": "theme", "theme": theme}) + "\n")
                    self.process.stdin.flush()
                    line = self.process.stdout.readline()
                    res = json.loads(line)
                    return res.get("status") == "theme_ok"
                except Exception:
                    pass
            return False

    def restart(self) -> bool:
        """Restart the session kernel (clearing memory and variables)."""
        with self.lock:
            self.last_active = time.time()
            if self.is_alive():
                try:
                    self.process.stdin.write(json.dumps({"action": "reset"}) + "\n")
                    self.process.stdin.flush()
                    line = self.process.stdout.readline()
                    res = json.loads(line)
                    if res.get("status") == "reset_ok":
                        return True
                except Exception:
                    pass

                # If soft reset failed, hard restart
                try:
                    self.process.terminate()
                    self.process.wait(timeout=1.0)
                except Exception:
                    self.process.kill()

            self._spawn_worker()
            return True

    def interrupt(self) -> bool:
        """Interrupt active execution."""
        with self.lock:
            if self.is_alive():
                try:
                    self.process.terminate()
                    self.process.wait(timeout=1.0)
                except Exception:
                    self.process.kill()
                self._spawn_worker()
                return True
            return False

    def cleanup(self):
        """Terminate process and delete the isolated temporary directory."""
        with self.lock:
            if self.process:
                try:
                    if self.process.poll() is None:
                        try:
                            self.process.stdin.write(json.dumps({"action": "exit"}) + "\n")
                            self.process.stdin.flush()
                        except Exception:
                            pass
                        self.process.terminate()
                        try:
                            self.process.wait(timeout=1.0)
                        except subprocess.TimeoutExpired:
                            self.process.kill()
                except Exception:
                    pass
                finally:
                    self.process = None

            # Delete the isolated environment directory
            if os.path.exists(self.working_dir):
                try:
                    shutil.rmtree(self.working_dir, ignore_errors=True)
                except Exception as e:
                    print(f"[Session] Error cleaning directory {self.working_dir}: {e}", file=sys.stderr)


class PlaygroundSessionManager:
    """Manages all active notebook sessions with automated lifecycle cleanup."""

    def __init__(self):
        self._sessions: Dict[str, PlaygroundSession] = {}
        self._lock = threading.Lock()

    def start_session(self, session_id: Optional[str] = None) -> PlaygroundSession:
        """Start a new notebook session with an isolated directory."""
        with self._lock:
            sid = session_id or uuid.uuid4().hex
            # Clean up existing if colliding
            if sid in self._sessions:
                self._sessions[sid].cleanup()

            session = PlaygroundSession(sid)
            self._sessions[sid] = session
            return session

    def get_session(self, session_id: str) -> Optional[PlaygroundSession]:
        """Retrieve active session and bump last_active timestamp."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session and session.is_alive():
                session.last_active = time.time()
                return session
            elif session and not session.is_alive():
                # Attempt auto-revive
                session._spawn_worker()
                return session
            return None

    def end_session(self, session_id: str) -> bool:
        """Terminate session kernel and permanently delete environment folder."""
        with self._lock:
            session = self._sessions.pop(session_id, None)
            if session:
                session.cleanup()
                return True
            return False

    def cleanup_expired(self, max_idle_seconds: int = 1800):
        """Clean up sessions that have been idle for longer than max_idle_seconds."""
        now = time.time()
        with self._lock:
            expired_ids = [
                sid for sid, sess in self._sessions.items()
                if now - sess.last_active > max_idle_seconds or not sess.is_alive()
            ]
            for sid in expired_ids:
                sess = self._sessions.pop(sid, None)
                if sess:
                    sess.cleanup()

    def cleanup_all(self):
        """Terminate all sessions and wipe environments upon server exit."""
        with self._lock:
            for sess in self._sessions.values():
                sess.cleanup()
            self._sessions.clear()


session_manager = PlaygroundSessionManager()
