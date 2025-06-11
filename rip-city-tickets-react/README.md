# 🏀 Rip City Ticket Dispatch

**Automated ticket deal detection and monitoring platform for Portland Trail Blazers fans and resellers.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mazzlabs.works/rip--city--tickets-red?style=for-the-badge)](https://mazzlabs.works/rip-city-tickets)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 🚀 Overview

Rip City Ticket Dispatch is an intelligent ticket monitoring platform that automatically scans multiple ticket marketplaces to find the best deals for Portland Trail Blazers games. Built with React and TypeScript, it provides real-time deal detection, price trend analysis, and automated alert systems.

## ✨ Features

### 🔍 **Smart Deal Detection**
- Multi-platform scanning across StubHub, SeatGeek, Vivid Seats, and more
- Machine learning-powered deal scoring and recommendation
- Real-time price tracking with trend analysis

### 📊 **Comprehensive Dashboard**
- Live deal monitoring with color-coded urgency levels
- Interactive filter system by seat type, price range, and venue section
- Real-time statistics and performance metrics

### 🎯 **Automated Alerts**
- Custom price threshold notifications
- Deal expiration warnings
- Platform-specific availability updates

### 📱 **Modern UI/UX**
- Portland Trail Blazers themed design
- Responsive layout for desktop and mobile
- Smooth animations and transitions

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Build Tool**: Create React App
- **Deployment**: GitHub Pages
- **Icons**: Lucide React

## 🎮 Live Demo

Experience the app live at: **[mazzlabs.works/rip-city-tickets](https://mazzlabs.works/rip-city-tickets)**

*Currently running with demo data showcasing ticket deals for Portland Trail Blazers games.*

## 💻 Local Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rip-city-tickets-react.git
   cd rip-city-tickets-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the app in development mode |
| `npm test` | Launches the test runner |
| `npm run build` | Builds the app for production |
| `npm run deploy` | Deploys to GitHub Pages |

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard/          # Main dashboard component
│   ├── TicketCard/         # Individual deal card display
│   ├── ErrorBoundary/      # Error handling wrapper
│   └── LoadingSpinner/     # Loading state component
├── hooks/
│   └── useTicketAutomation.ts  # Main automation logic
├── types/
│   └── ticket.ts          # TypeScript type definitions
├── App.tsx                # Main application component
├── App.css                # Global styles and theming
└── index.tsx              # Application entry point
```

## 🎨 Design System

### Color Palette
- **Primary Red**: `#C8102E` (Trail Blazers Red)
- **Secondary Black**: `#000000` (Trail Blazers Black)
- **Success Green**: `#10B981`
- **Warning Orange**: `#F59E0B`
- **Error Red**: `#EF4444`

### Typography
- **Primary Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Font Sizes**: 12px - 32px scale
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 🔧 Configuration

### Environment Variables
```bash
# Optional: For production API integration
REACT_APP_API_BASE_URL=https://your-api-endpoint.com
REACT_APP_TICKETMASTER_API_KEY=your_api_key
REACT_APP_STUBHUB_API_KEY=your_api_key
```

### Mock Data
The app currently uses mock data from `/public/api/deals.json` for demonstration purposes. This includes realistic Portland Trail Blazers ticket data with various price points and venues.

## 🚀 Deployment

The app is automatically deployed to GitHub Pages using the `gh-pages` branch. To deploy manually:

```bash
npm run build
npm run deploy
```

## 🔮 Future Enhancements

- **Real API Integration**: Connect to live ticket platform APIs
- **User Authentication**: Personal deal preferences and saved searches
- **Mobile App**: React Native version for iOS/Android
- **Machine Learning**: Enhanced deal scoring algorithms
- **Social Features**: Deal sharing and community recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Portland Trail Blazers for the inspiration
- Create React App team for the boilerplate
- Lucide React for the beautiful icons
- The React community for ongoing support

---

**Built with ❤️ for Rip City fans everywhere!** 🏀
