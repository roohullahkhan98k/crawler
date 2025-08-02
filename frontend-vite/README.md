# Smart IPTV Stream Crawler - Vite React App

A modern React.js application built with Vite that intelligently crawls and categorizes IPTV streams from any URL.

## 🚀 Features

- **🎯 Smart Categorization** - Automatically detects categories from stream data
- **🔍 Intelligent Pattern Matching** - Analyzes stream names and URLs to group content
- **📁 M3U Download** - Download categorized streams as .m3u files
- **🔧 Filter Support** - Optional filtering by keywords
- **📊 Real-time Statistics** - View total streams and auto-detected categories
- **🎨 Modern UI** - Beautiful, responsive design with gradients
- **👁️ Stream Preview** - View stream URLs directly

## 🧠 Smart Categorization

The app automatically detects categories based on stream content:

- **Sports** - Football, Basketball, Tennis, etc.
- **News** - CNN, BBC, Fox News, etc.
- **Movies** - Netflix, HBO, Disney, etc.
- **Kids** - Cartoons, Disney, Nickelodeon, etc.
- **Music** - MTV, VH1, Concerts, etc.
- **Documentary** - Discovery, National Geographic, etc.
- **Entertainment** - Comedy, Reality Shows, etc.
- **Regional** - Arabic, Hindi, Spanish, etc.
- **Religious** - Christian, Islamic, etc.
- **Educational** - Tutorials, Academic, etc.
- **Live TV** - Live streams, Broadcast channels
- **Gaming** - Esports, Twitch, Gaming content
- **Business** - Finance, Economy, Trading
- **Technology** - Tech, Digital, Innovation
- **Lifestyle** - Fashion, Health, Travel

## 🛠️ Setup

1. **Install Dependencies:**
   ```bash
   cd frontend-vite
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```

3. **Make sure the API is running:**
   ```bash
   # In the main directory
   python api_crawler.py
   ```

## 📖 Usage

1. **Enter a URL** - Paste any URL containing IPTV streams
2. **Add Filter (Optional)** - Enter keywords to filter streams
3. **Click "Start Crawling"** - The app will extract and intelligently categorize streams
4. **Download Streams** - Download individual streams or entire categories as .m3u files

## 🔗 API Connection

The frontend connects to the Flask API running on `http://localhost:5000`. Make sure the API server is running before using the frontend.

## 🧪 Example URLs to Test

- `https://iptv-org.github.io/iptv/index.m3u`
- `https://iptv-org.github.io/iptv/categories/sport.m3u`
- `https://iptv-org.github.io/iptv/categories/news.m3u`

## 🛠️ Technologies Used

- **Vite** - Fast build tool and dev server
- **React.js 18** - Modern React with hooks
- **Axios** - HTTP client for API calls
- **React Icons** - Beautiful icons
- **CSS3** - Modern styling with gradients and animations

## 🎯 Smart Features

- **Auto-Detection**: No predefined categories - the app learns from your data
- **Pattern Matching**: Uses regex patterns to identify content types
- **URL Analysis**: Extracts category hints from stream URLs
- **Fallback Logic**: Groups uncategorized streams as "General"
- **Real-time Stats**: Shows auto-detected categories and stream counts

## 📱 Responsive Design

The app works perfectly on desktop, tablet, and mobile devices with adaptive layouts and touch-friendly controls.
