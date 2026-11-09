import paramiko
import time
import base64
import re

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('119.59.102.161', port=2222, username='std6730202041', password='s8*RgL1Z', timeout=10)

channel = client.invoke_shell()
time.sleep(2)
while channel.recv_ready():
    channel.recv(4096)

channel.send("stty -echo\n")
time.sleep(1)
while channel.recv_ready():
    channel.recv(4096)

channel.send("echo 'BEGIN_B64'; base64 -w 0 /app/server.js; echo ''; echo 'FINISH_B64'\n")
time.sleep(2)

output = ""
start = time.time()
while time.time() - start < 10:
    if channel.recv_ready():
        output += channel.recv(16384).decode('utf-8', errors='replace')
        if 'FINISH_B64' in output:
            break
    else:
        time.sleep(0.3)

client.close()

if 'BEGIN_B64' in output and 'FINISH_B64' in output:
    content = output.split('BEGIN_B64')[1].split('FINISH_B64')[0]
    clean_b64 = re.sub(r'[^A-Za-z0-9+/=]', '', content)
    raw = base64.b64decode(clean_b64)
    with open('remote_server_current.js', 'wb') as f:
        f.write(raw)
    print("SUCCESS! File size:", len(raw))
else:
    print("FAILED! Output length:", len(output))
