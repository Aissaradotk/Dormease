import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('119.59.102.161', port=2222, username='std6730202041', password='s8*RgL1Z', timeout=10)
chan = ssh.invoke_shell()
time.sleep(1)
while chan.recv_ready():
    chan.recv(4096)

sql = "SELECT b.id, r.room_number, b.total_amount, b.status FROM dorm_bills b LEFT JOIN dorm_rooms r ON b.room_id = r.id WHERE r.room_number IN ('101', '102');"
chan.send(f"mysql -h 127.0.0.1 -u std6730202041 -p's8*RgL1Z' ip_std6730202041 -e \"{sql}\"\n")
time.sleep(2)

out = ""
while chan.recv_ready():
    out += chan.recv(4096).decode('utf-8', errors='replace')

print("RESULT:\n", out)
ssh.close()
