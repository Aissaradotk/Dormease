import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('119.59.102.161', port=2222, username='std6730202041', password='s8*RgL1Z', timeout=10)

channel = client.invoke_shell()
time.sleep(2)
while channel.recv_ready():
    channel.recv(4096)

channel.send("cat /app/src/db.js\n")
time.sleep(2)

output = ""
while channel.recv_ready():
    output += channel.recv(4096).decode('utf-8', errors='replace')

print("DB.JS:\n" + output)
client.close()
