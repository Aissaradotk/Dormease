import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('119.59.102.161', port=2222, username='std6730202041', password='s8*RgL1Z', timeout=10)
stdin, stdout, stderr = client.exec_command('ps aux | grep node; ls -la /app')
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
client.close()
