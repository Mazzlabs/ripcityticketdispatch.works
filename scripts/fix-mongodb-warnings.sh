#!/bin/bash

# Fix MongoDB Warnings on DigitalOcean Droplet
# Run this script on your DigitalOcean droplet to resolve MongoDB startup warnings

echo "🔧 Fixing MongoDB Warnings on DigitalOcean Droplet"
echo "=================================================="

# Check current system info
echo "📊 Current System Status:"
echo "Filesystem type:"
df -T | head -5

echo ""
echo "Current vm.max_map_count:"
cat /proc/sys/vm/max_map_count

echo ""
echo "🔧 Applying Fixes..."

# Fix 1: Set vm.max_map_count (MongoDB recommended minimum is 262144)
echo "Setting vm.max_map_count to 262144..."
sudo sysctl vm.max_map_count=262144

# Make the change permanent
echo "Making vm.max_map_count permanent..."
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf

# Fix 2: XFS Filesystem warning information
echo ""
echo "📁 Filesystem Analysis:"
echo "Current filesystem type:"
df -T /

echo ""
echo "💡 XFS Filesystem Note:"
echo "The XFS warning is informational. While XFS is recommended for optimal"
echo "performance, ext4 (commonly used on DigitalOcean) works fine for most"
echo "applications. If you need maximum performance, consider:"
echo "- Creating a new droplet with XFS filesystem"
echo "- Or reformatting (requires data backup/restore)"

# Verify fixes
echo ""
echo "✅ Verification:"
echo "New vm.max_map_count:"
cat /proc/sys/vm/max_map_count

# Restart MongoDB to clear warnings
echo ""
echo "🔄 Restarting MongoDB service..."
if systemctl is-active --quiet mongod; then
    sudo systemctl restart mongod
    echo "MongoDB restarted successfully"
elif systemctl is-active --quiet mongodb; then
    sudo systemctl restart mongodb  
    echo "MongoDB restarted successfully"
else
    echo "MongoDB service not found or not running"
    echo "You may need to restart MongoDB manually"
fi

echo ""
echo "✅ MongoDB warning fixes applied!"
echo "The startup warnings should be resolved on next MongoDB restart."
echo ""
echo "🎯 Summary of changes:"
echo "- Set vm.max_map_count to 262144 (MongoDB recommended)"
echo "- Made vm.max_map_count permanent in /etc/sysctl.conf"
echo "- Restarted MongoDB service"
echo ""
echo "Note: The XFS filesystem warning is informational only."
echo "Your current filesystem will work fine for most applications."
