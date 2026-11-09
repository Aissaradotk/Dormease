import paramiko
import time
import sys
import os

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend_daemon.log")

def log(msg):
    timestamp = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{timestamp} {msg}\n"
    try:
        with open(LOG_FILE, "a", encoding="utf-8", errors="replace") as f:
            f.write(line)
    except:
        pass
    if sys.stdout:
        try:
            sys.stdout.write(line)
            sys.stdout.flush()
        except:
            try:
                sys.stdout.write(line.encode("ascii", "replace").decode("ascii"))
                sys.stdout.flush()
            except:
                pass

def run_daemon():
    log("Starting DormEase + CPU SHOP backend daemon...")
    while True:
        client = None
        try:
            log("Connecting to SSH server 119.59.102.161:2222...")
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect("119.59.102.161", port=2222, username="std6730202041", password="s8*RgL1Z", timeout=15)
            
            transport = client.get_transport()
            if transport:
                transport.set_keepalive(15)
                
            channel = client.invoke_shell()
            time.sleep(2)
            while channel.recv_ready():
                channel.recv(4096)
                
            log("Sending auto-restart loop command for unified server...")
            cmd = "while true; do fuser -k 3007/tcp 2>/dev/null; pkill -9 -f 'node server.js' 2>/dev/null; sleep 1; cd /app && node server.js; echo 'NODE EXITED - RESTARTING IN 2S...'; sleep 2; done\n"
            channel.send(cmd)
            log("Backend daemon active! Serving DormEase & CPU SHOP on port 3007.")
            log("KEEP THIS WINDOW OPEN while using the website.")
            
            while True:
                if channel.recv_ready():
                    raw = channel.recv(4096).decode("utf-8", errors="replace")
                    try:
                        with open(LOG_FILE, "a", encoding="utf-8", errors="replace") as f:
                            f.write(raw)
                    except:
                        pass
                if channel.exit_status_ready():
                    log(f"Channel exited with status: {channel.recv_exit_status()}")
                    break
                if not transport.is_active():
                    log("Transport connection dropped.")
                    break
                time.sleep(0.3)
        except Exception as e:
            log(f"Connection error: {repr(e)}")
        finally:
            if client:
                try:
                    client.close()
                except:
                    pass
        log("Reconnecting to remote server in 3 seconds...")
        time.sleep(3)

if __name__ == "__main__":
    run_daemon()
