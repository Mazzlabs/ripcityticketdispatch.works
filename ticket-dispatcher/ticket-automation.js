// Rip City Ticket Dispatch - Automation Engine
// Trail Blazers themed ticket monitoring and dispatch system

class TicketDispatchSystem {
    constructor() {
        this.isActive = false;
        this.deals = [];
        this.alerts = [];
        this.venues = this.initializePortlandVenues();
        this.priceHistory = new Map();
        this.apiKeys = {
            ticketmaster: process.env.TICKETMASTER_API_KEY || 'demo_key',
            stubhub: process.env.STUBHUB_API_KEY || 'demo_key',
            seatgeek: process.env.SEATGEEK_API_KEY || 'demo_key'
        };
        
        this.init();
    }

    init() {
        console.log('🏀 Rip City Ticket Dispatch System Starting...');
        this.startMonitoring();
        this.loadSampleData();
        this.setupEventListeners();
        this.updateDashboard();
        
        // Start periodic monitoring
        setInterval(() => this.scanForDeals(), 30000); // Every 30 seconds
        setInterval(() => this.updateAnalytics(), 60000); // Every minute
    }

    initializePortlandVenues() {
        return {
            sports: [
                {
                    id: 'moda-center',
                    name: 'Moda Center',
                    type: 'sports',
                    capacity: 19393,
                    teams: ['Portland Trail Blazers'],
                    address: '1 N Center Ct St, Portland, OR 97227',
                    coordinates: { lat: 45.5316, lng: -122.6668 }
                },
                {
                    id: 'providence-park',
                    name: 'Providence Park',
                    type: 'sports',
                    capacity: 25218,
                    teams: ['Portland Timbers', 'Portland Thorns FC'],
                    address: '1844 SW Morrison St, Portland, OR 97205',
                    coordinates: { lat: 45.5214, lng: -122.6918 }
                }
            ],
            music: [
                {
                    id: 'arlene-schnitzer',
                    name: 'Arlene Schnitzer Concert Hall',
                    type: 'music',
                    capacity: 2776,
                    address: '1037 SW Broadway, Portland, OR 97205',
                    coordinates: { lat: 45.5152, lng: -122.6784 }
                },
                {
                    id: 'roseland-theater',
                    name: 'Roseland Theater',
                    type: 'music',
                    capacity: 1400,
                    address: '8 NW 6th Ave, Portland, OR 97209',
                    coordinates: { lat: 45.5234, lng: -122.6758 }
                },
                {
                    id: 'crystal-ballroom',
                    name: 'Crystal Ballroom',
                    type: 'music',
                    capacity: 1500,
                    address: '1332 W Burnside St, Portland, OR 97209',
                    coordinates: { lat: 45.5227, lng: -122.6847 }
                },
                {
                    id: 'keller-auditorium',
                    name: 'Keller Auditorium',
                    type: 'music',
                    capacity: 2992,
                    address: '222 SW Clay St, Portland, OR 97201',
                    coordinates: { lat: 45.5122, lng: -122.6795 }
                }
            ]
        };
    }

    async scanForDeals() {
        if (!this.isActive) return;

        console.log('🔍 Scanning for deals...');
        
        try {
            // Scan multiple platforms
            const platforms = ['ticketmaster', 'stubhub', 'seatgeek', 'vivid'];
            const scanPromises = platforms.map(platform => this.scanPlatform(platform));
            
            const results = await Promise.all(scanPromises);
            const newDeals = results.flat().filter(deal => this.isGoodDeal(deal));
            
            // Process new deals
            for (const deal of newDeals) {
                await this.processDeal(deal);
            }
            
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error scanning for deals:', error);
            this.showToast('Error scanning for deals', 'error');
        }
    }

    async scanPlatform(platform) {
        // Simulate API calls with demo data for now
        return this.generateSampleDeals(platform);
    }

    generateSampleDeals(platform) {
        const sampleEvents = [
            {
                title: 'Portland Trail Blazers vs Lakers',
                venue: 'Moda Center',
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                type: 'sports',
                team: 'Portland Trail Blazers'
            },
            {
                title: 'Portland Timbers vs Seattle Sounders',
                venue: 'Providence Park',
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                type: 'sports',
                team: 'Portland Timbers'
            },
            {
                title: 'Indie Rock Concert',
                venue: 'Crystal Ballroom',
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                type: 'music',
                genre: 'Rock'
            },
            {
                title: 'Classical Symphony',
                venue: 'Arlene Schnitzer Concert Hall',
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                type: 'music',
                genre: 'Classical'
            }
        ];

        return sampleEvents.map(event => ({
            id: `${platform}-${Date.now()}-${Math.random()}`,
            platform,
            ...event,
            originalPrice: Math.floor(Math.random() * 200) + 50,
            currentPrice: Math.floor(Math.random() * 150) + 30,
            savingsPercent: Math.floor(Math.random() * 40) + 10,
            quantity: Math.floor(Math.random() * 8) + 1,
            section: this.generateRandomSection(),
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            scrapedAt: new Date()
        }));
    }

    generateRandomSection() {
        const sections = ['100 Level', '200 Level', '300 Level', 'Club', 'Suite', 'Floor', 'Courtside'];
        return sections[Math.floor(Math.random() * sections.length)];
    }

    isGoodDeal(deal) {
        // Algorithm to determine if a deal is worth dispatching
        const minSavingsPercent = 15;
        const maxPrice = 300;
        const minConfidence = 0.7;
        
        return deal.savingsPercent >= minSavingsPercent && 
               deal.currentPrice <= maxPrice && 
               deal.confidence >= minConfidence;
    }

    async processDeal(deal) {
        // Check if we already have this deal
        const exists = this.deals.find(d => 
            d.title === deal.title && 
            d.venue === deal.venue && 
            Math.abs(d.currentPrice - deal.currentPrice) < 5
        );
        
        if (exists) return;

        // Add to deals array
        this.deals.unshift(deal);
        
        // Keep only last 50 deals
        if (this.deals.length > 50) {
            this.deals = this.deals.slice(0, 50);
        }

        // Update price history
        this.updatePriceHistory(deal);

        // Check if deal matches any user alerts
        this.checkAlerts(deal);

        // Log the deal
        console.log(`🎫 New deal found: ${deal.title} - $${deal.currentPrice} (${deal.savingsPercent}% off)`);
        
        // Show notification
        this.showToast(`New deal: ${deal.title} - ${deal.savingsPercent}% off!`, 'success');
    }

    updatePriceHistory(deal) {
        const key = `${deal.title}-${deal.venue}`;
        if (!this.priceHistory.has(key)) {
            this.priceHistory.set(key, []);
        }
        
        const history = this.priceHistory.get(key);
        history.push({
            price: deal.currentPrice,
            timestamp: deal.scrapedAt,
            platform: deal.platform
        });
        
        // Keep only last 100 price points
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }

    checkAlerts(deal) {
        const matchingAlerts = this.alerts.filter(alert => {
            const titleMatch = !alert.event || deal.title.toLowerCase().includes(alert.event.toLowerCase());
            const venueMatch = !alert.venue || deal.venue.toLowerCase().includes(alert.venue.toLowerCase());
            const priceMatch = !alert.maxPrice || deal.currentPrice <= alert.maxPrice;
            const typeMatch = !alert.type || deal.type === alert.type;
            
            return titleMatch && venueMatch && priceMatch && typeMatch;
        });

        matchingAlerts.forEach(alert => {
            this.dispatchAlert(alert, deal);
        });
    }

    dispatchAlert(alert, deal) {
        console.log(`🚨 Alert triggered: ${alert.name} for ${deal.title}`);
        
        // In real implementation, this would send emails, SMS, webhooks, etc.
        this.showToast(`🚨 Price Alert: ${deal.title} - $${deal.currentPrice}`, 'warning');
        
        // Update alert last triggered time
        alert.lastTriggered = new Date();
        alert.timesTriggered = (alert.timesTriggered || 0) + 1;
        
        this.saveAlertsToStorage();
    }

    addPriceAlert(alertData) {
        const alert = {
            id: Date.now().toString(),
            name: alertData.name,
            event: alertData.event,
            venue: alertData.venue,
            maxPrice: parseFloat(alertData.maxPrice),
            type: alertData.type,
            createdAt: new Date(),
            isActive: true,
            timesTriggered: 0
        };
        
        this.alerts.push(alert);
        this.saveAlertsToStorage();
        this.updateAlertsDisplay();
        
        this.showToast(`Alert created: ${alert.name}`, 'success');
        
        return alert;
    }

    removeAlert(alertId) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.saveAlertsToStorage();
        this.updateAlertsDisplay();
        this.showToast('Alert removed', 'success');
    }

    saveAlertsToStorage() {
        localStorage.setItem('ticket-alerts', JSON.stringify(this.alerts));
    }

    loadAlertsFromStorage() {
        const stored = localStorage.getItem('ticket-alerts');
        if (stored) {
            this.alerts = JSON.parse(stored);
        }
    }

    startMonitoring() {
        this.isActive = true;
        this.updateStatusIndicator();
        console.log('✅ Monitoring started');
    }

    stopMonitoring() {
        this.isActive = false;
        this.updateStatusIndicator();
        console.log('⏹️ Monitoring stopped');
    }

    updateStatusIndicator() {
        const indicator = document.querySelector('.status-indicator');
        const dot = document.querySelector('.pulse-dot');
        const text = indicator.querySelector('span');
        
        if (this.isActive) {
            indicator.style.background = 'rgba(39, 174, 96, 0.2)';
            indicator.style.borderColor = 'var(--success-color)';
            dot.style.background = 'var(--success-color)';
            text.textContent = 'Live Monitoring';
        } else {
            indicator.style.background = 'rgba(231, 76, 60, 0.2)';
            indicator.style.borderColor = 'var(--danger-color)';
            dot.style.background = 'var(--danger-color)';
            text.textContent = 'Monitoring Paused';
        }
    }

    updateDashboard() {
        this.updateStats();
        this.updateDealsDisplay();
        this.updateAlertsDisplay();
    }

    updateStats() {
        // Update stat cards
        document.getElementById('sports-deals').textContent = 
            this.deals.filter(d => d.type === 'sports').length;
        document.getElementById('music-deals').textContent = 
            this.deals.filter(d => d.type === 'music').length;
        document.getElementById('total-savings').textContent = 
            '$' + this.calculateTotalSavings().toLocaleString();
        document.getElementById('active-alerts').textContent = 
            this.alerts.filter(a => a.isActive).length;
    }

    calculateTotalSavings() {
        return this.deals.reduce((total, deal) => {
            return total + (deal.originalPrice - deal.currentPrice);
        }, 0);
    }

    updateDealsDisplay() {
        const grid = document.getElementById('deals-grid');
        if (!grid) return;

        const filteredDeals = this.getFilteredDeals();
        
        grid.innerHTML = filteredDeals.map(deal => this.createDealCard(deal)).join('');
    }

    getFilteredDeals() {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        
        if (activeFilter === 'all') return this.deals;
        return this.deals.filter(deal => deal.type === activeFilter);
    }

    createDealCard(deal) {
        const savings = deal.originalPrice - deal.currentPrice;
        const timeAgo = this.getTimeAgo(deal.scrapedAt);
        
        return `
            <div class="deal-card" data-deal-id="${deal.id}">
                <div class="deal-header">
                    <span class="deal-type ${deal.type}">${deal.type}</span>
                    <span class="deal-savings">-${deal.savingsPercent}%</span>
                </div>
                <h3 class="deal-title">${deal.title}</h3>
                <p class="deal-venue">📍 ${deal.venue}</p>
                <div class="deal-details">
                    <p class="deal-date">📅 ${deal.date.toLocaleDateString()}</p>
                    <p class="deal-section">🎫 ${deal.section}</p>
                    <p class="deal-platform">🌐 ${deal.platform}</p>
                </div>
                <div class="deal-price">
                    <span class="current-price">$${deal.currentPrice}</span>
                    <span class="original-price">$${deal.originalPrice}</span>
                </div>
                <div class="deal-meta">
                    <span class="deal-confidence">🎯 ${Math.round(deal.confidence * 100)}% confidence</span>
                    <span class="deal-time">⏰ ${timeAgo}</span>
                </div>
                <div class="deal-actions">
                    <a href="#" class="btn btn-primary" onclick="ticketSystem.purchaseDeal('${deal.id}')">
                        <i class="fas fa-ticket-alt"></i>
                        Buy Now
                    </a>
                    <button class="btn btn-secondary" onclick="ticketSystem.saveDeal('${deal.id}')">
                        <i class="fas fa-bookmark"></i>
                        Save
                    </button>
                </div>
            </div>
        `;
    }

    updateAlertsDisplay() {
        const container = document.querySelector('.active-alerts');
        if (!container) return;

        const alertsList = container.querySelector('.alerts-list') || 
                          this.createAlertsListElement(container);
        
        alertsList.innerHTML = this.alerts.map(alert => this.createAlertItem(alert)).join('');
    }

    createAlertsListElement(container) {
        const alertsList = document.createElement('div');
        alertsList.className = 'alerts-list';
        container.appendChild(alertsList);
        return alertsList;
    }

    createAlertItem(alert) {
        return `
            <div class="alert-item">
                <div class="alert-details">
                    <div class="alert-event">${alert.name}</div>
                    <div class="alert-price">Max: $${alert.maxPrice} • ${alert.type || 'All types'}</div>
                    <div class="alert-stats">
                        Created: ${alert.createdAt.toLocaleDateString()} • 
                        Triggered: ${alert.timesTriggered || 0} times
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-secondary" onclick="ticketSystem.toggleAlert('${alert.id}')">
                        ${alert.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="ticketSystem.removeAlert('${alert.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.updateDealsDisplay();
            }
        });

        // Alert form submission
        const alertForm = document.getElementById('alert-form');
        if (alertForm) {
            alertForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const alertData = Object.fromEntries(formData);
                this.addPriceAlert(alertData);
                e.target.reset();
            });
        }

        // FAB menu
        const fab = document.querySelector('.fab');
        const fabMenu = document.querySelector('.fab-menu');
        
        if (fab && fabMenu) {
            fab.addEventListener('click', () => {
                fabMenu.classList.toggle('active');
            });
        }
    }

    loadSampleData() {
        // Load some sample alerts and deals for demo
        this.loadAlertsFromStorage();
        
        if (this.alerts.length === 0) {
            // Create sample alerts
            this.addPriceAlert({
                name: 'Blazers vs Lakers Alert',
                event: 'Trail Blazers',
                venue: 'Moda Center',
                maxPrice: '150',
                type: 'sports'
            });
            
            this.addPriceAlert({
                name: 'Crystal Ballroom Concerts',
                event: '',
                venue: 'Crystal Ballroom',
                maxPrice: '80',
                type: 'music'
            });
        }
    }

    purchaseDeal(dealId) {
        const deal = this.deals.find(d => d.id === dealId);
        if (!deal) return;

        // In real implementation, this would redirect to purchase page
        this.showToast(`Redirecting to purchase ${deal.title}...`, 'success');
        
        // Simulate external link
        console.log(`Would redirect to: ${deal.platform}/buy/${dealId}`);
    }

    saveDeal(dealId) {
        const deal = this.deals.find(d => d.id === dealId);
        if (!deal) return;

        // Save to localStorage
        const savedDeals = JSON.parse(localStorage.getItem('saved-deals') || '[]');
        if (!savedDeals.find(d => d.id === dealId)) {
            savedDeals.push(deal);
            localStorage.setItem('saved-deals', JSON.stringify(savedDeals));
            this.showToast('Deal saved!', 'success');
        } else {
            this.showToast('Deal already saved', 'warning');
        }
    }

    toggleAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.isActive = !alert.isActive;
            this.saveAlertsToStorage();
            this.updateAlertsDisplay();
            this.updateStats();
            
            const status = alert.isActive ? 'activated' : 'paused';
            this.showToast(`Alert ${status}`, 'success');
        }
    }

    updateAnalytics() {
        // Update analytics charts and venue rankings
        this.updateVenueRankings();
        this.updatePriceCharts();
    }

    updateVenueRankings() {
        const venueStats = this.calculateVenueStats();
        const container = document.querySelector('.venue-rankings');
        
        if (!container) return;

        const rankings = Object.entries(venueStats)
            .sort(([,a], [,b]) => b.dealCount - a.dealCount)
            .slice(0, 8);

        container.innerHTML = rankings.map(([venue, stats]) => `
            <div class="venue-item">
                <div class="venue-name">${venue}</div>
                <div class="venue-bar">
                    <div class="venue-fill" style="width: ${(stats.dealCount / rankings[0][1].dealCount) * 100}%"></div>
                </div>
                <div class="venue-score">${stats.dealCount}</div>
            </div>
        `).join('');
    }

    calculateVenueStats() {
        const stats = {};
        
        this.deals.forEach(deal => {
            if (!stats[deal.venue]) {
                stats[deal.venue] = { dealCount: 0, avgSavings: 0, totalSavings: 0 };
            }
            stats[deal.venue].dealCount++;
            stats[deal.venue].totalSavings += (deal.originalPrice - deal.currentPrice);
        });

        // Calculate averages
        Object.values(stats).forEach(stat => {
            stat.avgSavings = stat.totalSavings / stat.dealCount;
        });

        return stats;
    }

    updatePriceCharts() {
        // In a real implementation, this would update Chart.js or similar
        console.log('📊 Updating price charts...');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container') || 
                              this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Analytics and reporting methods
    generateReport() {
        const report = {
            totalDeals: this.deals.length,
            totalSavings: this.calculateTotalSavings(),
            avgSavingsPercent: this.deals.reduce((sum, deal) => sum + deal.savingsPercent, 0) / this.deals.length,
            topVenues: this.getTopVenues(),
            alertEffectiveness: this.calculateAlertEffectiveness(),
            generatedAt: new Date()
        };
        
        console.log('📈 Deal Report:', report);
        return report;
    }

    getTopVenues() {
        const venueStats = this.calculateVenueStats();
        return Object.entries(venueStats)
            .sort(([,a], [,b]) => b.dealCount - a.dealCount)
            .slice(0, 5)
            .map(([venue, stats]) => ({ venue, ...stats }));
    }

    calculateAlertEffectiveness() {
        const totalAlerts = this.alerts.length;
        const triggeredAlerts = this.alerts.filter(a => a.timesTriggered > 0).length;
        return totalAlerts > 0 ? (triggeredAlerts / totalAlerts) * 100 : 0;
    }
}

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏀 Initializing Rip City Ticket Dispatch System...');
    window.ticketSystem = new TicketDispatchSystem();
});

// Export for potential Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TicketDispatchSystem;
}
