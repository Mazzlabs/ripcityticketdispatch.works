# 🏀 Rip City Ticket Dispatch API

> **Production-ready ticket deal monitoring API built for Portland sports & music fans**

[![API Documentation](https://img.shields.io/badge/API-Documentation-blue)](https://bump.sh/doc/rip-city-ticket-dispatch)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ripcityticketdispatch.works)
[![Heroku](https://img.shields.io/badge/Deployed-Heroku-purple)](https://api.ripcityticketdispatch.works)

## 🚀 **What This API Does**

The Rip City Ticket Dispatch API provides **real-time ticket deal discovery** for Portland events with:

- **AI-powered deal scoring** (0-100 scale)
- **Portland venue expertise** (Moda Center, Providence Park, etc.)
- **Trail Blazers specialization** with "Rip City" deals
- **Multi-platform monitoring** (Ticketmaster, StubHub, SeatGeek)
- **Confidence ratings** for deal accuracy

## 📖 **API Documentation**

**[→ Full Interactive API Docs on Bump.sh](https://bump.sh/doc/rip-city-ticket-dispatch)**

The complete API documentation includes:
- Interactive request/response examples
- Authentication details
- Rate limiting information
- Code samples in multiple languages
- Live try-it functionality

## 🔗 **Quick Start**

### Base URL
```
https://api.ripcityticketdispatch.works/v1
```

### Authentication
```bash
curl -H "X-API-Key: your-api-key" \
     "https://api.ripcityticketdispatch.works/v1/deals"
```

### Get Trail Blazers Deals
```bash
curl "https://api.ripcityticketdispatch.works/v1/deals/blazers"
```

### Filter Sports Deals Under $100
```bash
curl "https://api.ripcityticketdispatch.works/v1/deals?category=sports&maxPrice=100"
```

## 🎯 **Key Endpoints**

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /deals` | Get all ticket deals with filtering | `?category=sports&maxPrice=200` |
| `GET /deals/blazers` | Trail Blazers specific deals | Special Rip City metadata |
| `GET /venues` | Portland venue information | Moda Center, Providence Park, etc. |

## 📊 **Deal Scoring Algorithm**

Each deal gets a **score (0-100)** and **confidence rating (0-100%)**:

- **90-100**: 🔥 **HOT** - Incredible deals, act fast!
- **70-89**: ⚡ **WARM** - Great savings, recommended
- **55-69**: ✅ **GOOD** - Solid deals worth considering  
- **0-54**: 📊 **NORMAL** - Regular pricing

### Scoring Factors:
- **Savings percentage** (40% of score)
- **Venue popularity** (20% of score) 
- **Event popularity** (20% of score)
- **Time until event** (10% of score)
- **Price reasonableness** (10% of score)

## 🏟️ **Portland Venue Coverage**

| Venue | Capacity | Home Teams | Popularity Score |
|-------|----------|------------|------------------|
| Moda Center | 19,393 | Trail Blazers | 10/10 |
| Providence Park | 25,218 | Timbers, Thorns | 9/10 |
| Crystal Ballroom | 1,500 | Music venue | 8/10 |
| Veterans Memorial | 11,000 | Multi-purpose | 8/10 |

## 🔥 **Trail Blazers Special Features**

The `/deals/blazers` endpoint includes:

- **Rip City branding** and special tags
- **Game-specific insights** (rivalry games, playoffs)
- **Moda Center insider tips**
- **Special messages** for Portland fans

```json
{
  "deals": [{
    "eventName": "Portland Trail Blazers vs Los Angeles Lakers",
    "venue": "Moda Center",
    "dealScore": 92,
    "tags": ["RIP CITY", "GREAT DEAL", "MODA CENTER"],
    "specialNotes": "🔥 Lakers rivalry game - always exciting!"
  }],
  "specialMessage": "🔥 5 hot Blazers deals available - Rip City!"
}
```

## 📱 **Rate Limits**

| Tier | Requests/Day | Requests/Second |
|------|--------------|-----------------|
| **Free** | 1,000 | 2 |
| **Pro** | 10,000 | 10 |
| **Enterprise** | Unlimited | 50 |

## 🛠️ **Technical Stack**

- **Runtime**: Node.js + Express.js
- **Deployment**: Heroku Premium
- **Documentation**: Bump.sh
- **APIs**: Ticketmaster Discovery API
- **Language**: TypeScript
- **Architecture**: RESTful API with OpenAPI 3.0 spec

## 🚀 **Live Demo & Frontend**

- **API Demo**: [api.ripcityticketdispatch.works](https://api.ripcityticketdispatch.works)
- **Web App**: [ripcityticketdispatch.works](https://ripcityticketdispatch.works)
- **PWA**: Installable mobile app
- **GitHub**: [github.com/J-mazz/rip-city-ticket-dispatch](https://github.com/J-mazz/rip-city-ticket-dispatch)

## 📞 **Get API Access**

Want API access? Contact us:
- **Email**: api@ripcityticketdispatch.works
- **Demo**: Try the live web app first
- **Hackathon**: Currently showcasing at Bolt AI Hackathon

---

**Built with ❤️ for Rip City • Go Blazers!** 🏀🔴⚫

*This API powers the Rip City Ticket Dispatch platform - helping Portland sports and music fans find the best ticket deals with AI-powered monitoring and local expertise.*
