# 🚨 DigitalOcean Alert Policies Setup

## **Recommended Alert Policies for Rip City API**

### **1. App Down Alert**
- **Metric**: App availability
- **Condition**: App is down for more than 2 minutes
- **Action**: Email notification
- **Why**: Get immediate notification if your API goes offline

### **2. High CPU Usage**
- **Metric**: CPU usage
- **Condition**: > 80% for 5 minutes
- **Action**: Email notification
- **Why**: Detect performance issues before they cause crashes

### **3. High Memory Usage**
- **Metric**: Memory usage
- **Condition**: > 90% for 3 minutes
- **Action**: Email notification
- **Why**: Prevent container termination due to memory limits

### **4. Failed Deployment Alert**
- **Metric**: Deployment status
- **Condition**: Deployment fails
- **Action**: Email + Slack notification (if configured)
- **Why**: Know immediately when deployments fail

### **5. Response Time Alert**
- **Metric**: Average response time
- **Condition**: > 5 seconds for 2 minutes
- **Action**: Email notification
- **Why**: Detect API performance degradation

## **How to Set Up in DigitalOcean:**

1. **Go to your App Platform dashboard**
2. **Click on your rip-city-api app**
3. **Go to "Insights" tab**
4. **Click "Create Alert Policy"**
5. **Configure each alert above**

## **Additional Monitoring Setup:**

### **Health Check Monitoring**
```bash
# Add this to your crontab to monitor health endpoint
*/5 * * * * curl -f https://api.ripcityticketdispatch.works/health || echo "API health check failed" | mail -s "Rip City API Down" your-email@example.com
```

### **External Monitoring (Free Options)**
- **UptimeRobot**: Free monitoring for up to 50 monitors
- **StatusCake**: Free tier with basic monitoring
- **Pingdom**: Limited free tier

## **Log Monitoring**
Since we removed file logging, monitor via DigitalOcean:
1. **Runtime Logs** → Check for errors
2. **Build Logs** → Monitor deployment issues
3. **Set up log alerts** for error patterns

## **Performance Monitoring**
Monitor these key metrics:
- ✅ Response time < 2 seconds
- ✅ Memory usage < 80%
- ✅ CPU usage < 70%
- ✅ 99%+ uptime

## **Quick Test Commands for Monitoring**
```bash
# Health check
curl -w "@curl-format.txt" -s -o /dev/null https://api.ripcityticketdispatch.works/health

# Load test (basic)
for i in {1..10}; do curl -s https://api.ripcityticketdispatch.works/api/deals > /dev/null & done

# Response time check
time curl -s https://api.ripcityticketdispatch.works/api/blazers
```

---
**🎯 Priority Setup Order:**
1. App Down Alert (CRITICAL)
2. High Memory Usage (CRITICAL) 
3. Failed Deployment (HIGH)
4. High CPU Usage (MEDIUM)
5. Response Time (MEDIUM)
