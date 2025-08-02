# Universal IPTV Crawler Bot

A flexible Python bot that accepts a URL and extracts IPTV streams in M3U format. This bot can handle various types of websites and extract `.m3u`/`.m3u8` links.

## Features

- 🎯 **Universal URL Support**: Works with any URL containing IPTV streams
- 🔍 **Smart Content Detection**: Automatically detects HTML, JSON, or M3U content
- 🏷️ **Intelligent Naming**: Extracts meaningful channel names from URLs
- 🔧 **Flexible Filtering**: Filter streams by keywords (e.g., "sports", "football")
- 🚫 **Duplicate Removal**: Automatically removes duplicate streams
- 📁 **M3U Output**: Generates standard M3U playlist files

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
python universal_iptv_crawler.py --url "https://example.com"
```

### Advanced Usage

```bash
# Specify output file
python universal_iptv_crawler.py --url "https://example.com" --output "my_streams.m3u"

# Filter by keyword
python universal_iptv_crawler.py --url "https://example.com" --filter "sports"

# Combine both
python universal_iptv_crawler.py --url "https://example.com" --output "sports_streams.m3u" --filter "football"
```

### Command Line Arguments

- `--url`: **Required**. The URL to crawl for IPTV streams
- `--output`: Optional. Output M3U file name (default: `extracted_streams.m3u`)
- `--filter`: Optional. Filter streams by keyword (e.g., "sports", "football")

## Examples

### 1. Extract all streams from an IPTV playlist
```bash
python universal_iptv_crawler.py --url "https://iptv-org.github.io/iptv/index.m3u"
```

### 2. Extract only sports streams
```bash
python universal_iptv_crawler.py --url "https://iptv-org.github.io/iptv/categories/sport.m3u" --filter "sports"
```

### 3. Extract football streams with custom output
```bash
python universal_iptv_crawler.py --url "https://example.com" --output "football_streams.m3u" --filter "football"
```

### 4. Extract from a website with embedded streams
```bash
python universal_iptv_crawler.py --url "https://some-iptv-website.com"
```

## Supported Content Types

The bot can handle:

1. **M3U Playlists** (`.m3u`, `.m3u8` files)
2. **HTML Pages** with embedded stream links
3. **JSON APIs** containing stream data
4. **Mixed Content** (automatically detects and processes)

## Output Format

The bot generates standard M3U playlist files:

```m3u
#EXTM3U
#EXTINF:-1,Channel Name 1
https://stream1.example.com/playlist.m3u8
#EXTINF:-1,Channel Name 2
https://stream2.example.com/playlist.m3u8
```

## Testing

Run the test script to see the bot in action:

```bash
python test_crawler.py
```

## Features in Detail

### Smart Content Detection
- Automatically detects if the URL returns HTML, JSON, or M3U content
- Handles different content types appropriately

### Intelligent Naming
- Extracts meaningful channel names from URLs
- Uses common keywords (sports, football, bein, etc.) for naming
- Falls back to domain names when specific names aren't available

### Flexible Filtering
- Filter by single keywords or multiple words
- Case-insensitive matching
- Searches both channel names and URLs

### Duplicate Removal
- Automatically removes duplicate stream URLs
- Preserves the first occurrence of each unique stream

## Error Handling

The bot includes comprehensive error handling:
- Network timeouts and connection errors
- Invalid URLs
- Malformed content
- JSON parsing errors

## Requirements

- Python 3.7+
- requests
- beautifulsoup4
- lxml

## License

This project is open source and available under the MIT License. 