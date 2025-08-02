"""
IPTV Crawler Bot
================

This crawler can extract IPTV playlists from any URL by:
1. Fetching the webpage content
2. Extracting IPTV URLs (get.php URLs with username/password)
3. Fetching the actual M3U playlists from those URLs
4. Returning the streams to the frontend

How to run:
    python iptv_crawler.py

The API will be available at http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import time
import urllib.parse
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

class IPTVCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def fetch_webpage(self, url):
        """Fetch webpage content from any URL"""
        try:
            print(f"Fetching webpage: {url}")
            
            # Clean the URL - remove any extra text after the URL (like dates, timestamps, etc.)
            # Look for common patterns that indicate the URL ends
            url_patterns = [
                r'(https?://[^\s]+?get\.php\?[^\s]+?username=[^\s]+?password=[^\s]+?type=m3u[^\s]*)',  # Complete get.php URLs
                r'(https?://[^\s]+?get\.php\?[^\s]+?password=[^\s]+?username=[^\s]+?type=m3u[^\s]*)',  # Complete get.php URLs (password first)
                r'(https?://[^\s]+?get\.php\?[^\s]+?type=m3u[^\s]*)',  # get.php URLs with type=m3u
                r'(https?://[^\s]+?get\.php\?[^\s]+?username=[^\s]+?password=[^\s]+)',  # get.php URLs with username/password
                r'(https?://[^\s]+?get\.php\?[^\s]+?password=[^\s]+?username=[^\s]+)',  # get.php URLs with password/username
                r'(https?://[^\s]+?\.(?:php|m3u|m3u8|mp4|ts))',  # URLs ending with common extensions
            ]
            
            cleaned_url = url
            for pattern in url_patterns:
                match = re.search(pattern, url, re.IGNORECASE)
                if match:
                    cleaned_url = match.group(1)
                    print(f"Cleaned URL from: {url}")
                    print(f"Cleaned URL to: {cleaned_url}")
                    break
            
            # Handle port issues - if HTTPS on port 80, change to HTTP
            if cleaned_url.startswith('https://') and ':80/' in cleaned_url:
                cleaned_url = cleaned_url.replace('https://', 'http://')
                print(f"Fixed HTTPS on port 80, using: {cleaned_url}")
            
            # Handle URL encoding issues
            if '%' in cleaned_url:
                cleaned_url = urllib.parse.unquote(cleaned_url)
                print(f"Decoded URL: {cleaned_url}")
            
            # Try different approaches to handle various websites
            response = None
            
            # Multiple header strategies to bypass blocking
            header_strategies = [
                {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
            ]
            
            for i, headers in enumerate(header_strategies):
                try:
                    print(f"Trying strategy {i+1}...")
                    response = requests.get(cleaned_url, timeout=30, verify=False, allow_redirects=True, headers=headers)
                    response.raise_for_status()
                    print(f"Success with strategy {i+1}")
                    break
                except requests.exceptions.SSLError:
                    print(f"SSL Error with strategy {i+1}, trying HTTP...")
                    if cleaned_url.startswith('https://'):
                        http_url = cleaned_url.replace('https://', 'http://')
                        response = requests.get(http_url, timeout=30, verify=False, allow_redirects=True, headers=headers)
                        response.raise_for_status()
                        print(f"Success with HTTP and strategy {i+1}")
                        break
                    else:
                        continue
                except requests.exceptions.RequestException as e:
                    print(f"Request error with strategy {i+1}: {str(e)}")
                    continue
            
            if response is None:
                raise Exception("All request strategies failed")
            
            return response.text
            
        except Exception as e:
            print(f"Error fetching webpage: {str(e)}")
            return None

    def extract_iptv_urls(self, content):
        """Extract IPTV URLs from webpage content"""
        iptv_urls = []
        
        # Parse HTML content
        soup = BeautifulSoup(content, 'html.parser')
        
        # Get all text content
        text_content = soup.get_text()
        
        # Patterns to match IPTV URLs (get.php URLs with username/password)
        patterns = [
            r'https?://[^\s<>"]*get\.php\?[^\s<>"]*username=[^\s<>"]*&password=[^\s<>"]*&type=m3u[^\s<>"]*',
            r'https?://[^\s<>"]*get\.php\?[^\s<>"]*password=[^\s<>"]*&username=[^\s<>"]*&type=m3u[^\s<>"]*',
            r'https?://[^\s<>"]*get\.php\?[^\s<>"]*type=m3u[^\s<>"]*',
            r'https?://[^\s<>"]*:8080/get\.php\?[^\s<>"]*',
            r'https?://[^\s<>"]*:80/get\.php\?[^\s<>"]*',
            r'https?://[^\s<>"]*get\.php\?[^\s<>"]*',
            r'https?://[^\s<>"]*:8080/[^\s<>"]*',
            r'https?://[^\s<>"]*:80/[^\s<>"]*',
            r'https?://[^\s<>"]*\?[^\s<>"]*username=[^\s<>"]*&password=[^\s<>"]*[^\s<>"]*',
            r'https?://[^\s<>"]*\?[^\s<>"]*password=[^\s<>"]*&username=[^\s<>"]*[^\s<>"]*',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text_content, re.IGNORECASE)
            iptv_urls.extend(matches)
        
        # Also look for URLs in href attributes
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            if 'get.php' in href or ('username=' in href and 'password=' in href):
                if href.startswith('http'):
                    iptv_urls.append(href)
        
        # Look for URLs in script tags
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                script_text = script.string
                for pattern in patterns:
                    matches = re.findall(pattern, script_text, re.IGNORECASE)
                    iptv_urls.extend(matches)
        
        # Remove duplicates and clean URLs
        unique_urls = []
        for url in iptv_urls:
            url = url.strip()
            # Remove any trailing characters that might be part of the URL
            url = re.sub(r'[^\w\-\.:/?=&%]+$', '', url)
            if url not in unique_urls and url.startswith('http'):
                unique_urls.append(url)
        
        print(f"Found {len(unique_urls)} unique IPTV URLs")
        return unique_urls

    def fetch_m3u_playlist(self, iptv_url):
        """Fetch M3U playlist from an IPTV URL"""
        try:
            print(f"Fetching M3U from: {iptv_url}")
            
            # Clean the URL - remove any extra text after the URL (like dates, timestamps, etc.)
            url_patterns = [
                r'(https?://[^\s]+?get\.php\?[^\s]+?username=[^\s]+?password=[^\s]+?type=m3u[^\s]*)',  # Complete get.php URLs
                r'(https?://[^\s]+?get\.php\?[^\s]+?password=[^\s]+?username=[^\s]+?type=m3u[^\s]*)',  # Complete get.php URLs (password first)
                r'(https?://[^\s]+?get\.php\?[^\s]+?type=m3u[^\s]*)',  # get.php URLs with type=m3u
                r'(https?://[^\s]+?get\.php\?[^\s]+?username=[^\s]+?password=[^\s]+)',  # get.php URLs with username/password
                r'(https?://[^\s]+?get\.php\?[^\s]+?password=[^\s]+?username=[^\s]+)',  # get.php URLs with password/username
                r'(https?://[^\s]+?\.(?:php|m3u|m3u8|mp4|ts))',  # URLs ending with common extensions
            ]
            
            cleaned_url = iptv_url
            for pattern in url_patterns:
                match = re.search(pattern, iptv_url, re.IGNORECASE)
                if match:
                    cleaned_url = match.group(1)
                    print(f"Cleaned IPTV URL from: {iptv_url}")
                    print(f"Cleaned IPTV URL to: {cleaned_url}")
                    break
            
            # Handle URL encoding issues
            if '%' in cleaned_url:
                cleaned_url = urllib.parse.unquote(cleaned_url)
                print(f"Decoded IPTV URL: {cleaned_url}")
            
            # Try different approaches for the IPTV URL
            response = None
            
            # Multiple header strategies
            header_strategies = [
                {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': '*/*',
                }
            ]
            
            for i, headers in enumerate(header_strategies):
                try:
                    print(f"Trying IPTV strategy {i+1}...")
                    response = requests.get(cleaned_url, timeout=15, verify=False, allow_redirects=True, headers=headers)
                    response.raise_for_status()
                    print(f"Success with IPTV strategy {i+1}")
                    break
                except requests.exceptions.SSLError:
                    print(f"SSL Error with IPTV strategy {i+1}, trying HTTP...")
                    if cleaned_url.startswith('https://'):
                        http_url = cleaned_url.replace('https://', 'http://')
                        response = requests.get(http_url, timeout=15, verify=False, allow_redirects=True, headers=headers)
                        response.raise_for_status()
                        print(f"Success with HTTP and IPTV strategy {i+1}")
                        break
                    else:
                        continue
                except requests.exceptions.RequestException as e:
                    print(f"Request error with IPTV strategy {i+1}: {str(e)}")
                    continue
            
            if response is None:
                print("All IPTV request strategies failed")
                return None
            
            content = response.text
            print(f"M3U content length: {len(content)}")
            
            # Verify it's M3U content
            if self.is_m3u_content(content):
                return content
            else:
                print(f"Content from {cleaned_url} is not M3U format")
                return None
                
        except Exception as e:
            print(f"Error fetching M3U from {iptv_url}: {str(e)}")
            return None

    def is_m3u_content(self, content):
        """Check if content is M3U format"""
        lines = content.split('\n')
        for line in lines[:10]:  # Check first 10 lines
            if line.strip().startswith('#EXTM3U') or line.strip().startswith('#EXTINF:'):
                return True
        return False

    def extract_streams_from_m3u(self, content, filter_keyword=None):
        """Extract stream URLs and names from M3U content"""
        streams = []
        lines = content.split('\n')
        
        current_name = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
                
            # Check for channel name (lines starting with #EXTINF)
            if line.startswith('#EXTINF:'):
                # Extract name from #EXTINF line
                name_match = re.search(r'tvg-name="([^"]*)"', line)
                if name_match:
                    current_name = name_match.group(1)
                else:
                    # Try to extract name from the end of the line
                    parts = line.split(',')
                    if len(parts) > 1:
                        current_name = parts[-1].strip()
                    else:
                        current_name = f"Channel {len(streams) + 1}"
                continue
                
            # Check if line contains a URL
            if line.startswith('http'):
                # Apply filter if specified
                if filter_keyword:
                    # Check if any line before this URL contains the filter text
                    check_lines = lines[max(0, i-5):i]
                    if not any(filter_keyword.lower() in check_line.lower() for check_line in check_lines):
                        continue
                
                # Use current name or generate one
                if not current_name:
                    current_name = f"Channel {len(streams) + 1}"
                
                streams.append((current_name, line))
                current_name = None  # Reset for next stream
        
        return streams

    def deduplicate_streams(self, streams):
        """Remove duplicate streams based on URL"""
        seen_urls = set()
        unique_streams = []
        
        for name, url in streams:
            if url not in seen_urls:
                seen_urls.add(url)
                unique_streams.append((name, url))
        
        return unique_streams

    def crawl_iptv_streams(self, url, filter_keyword=None):
        """Main method to crawl IPTV streams from any URL"""
        try:
            print(f"Starting crawl for URL: {url}")
            
            # Check if the input URL is already an IPTV URL (get.php with username/password)
            if 'get.php' in url and ('username=' in url and 'password=' in url):
                print("Input URL appears to be an IPTV URL, fetching directly...")
                m3u_content = self.fetch_m3u_playlist(url)
                if m3u_content:
                    streams = self.extract_streams_from_m3u(m3u_content, filter_keyword)
                    unique_streams = self.deduplicate_streams(streams)
                    print(f"Total unique streams found: {len(unique_streams)}")
                    return unique_streams
                else:
                    print("Failed to fetch M3U content from IPTV URL")
                    return []
            
            # Step 1: Fetch webpage content
            content = self.fetch_webpage(url)
            if not content:
                return []
            
            # Step 2: Extract IPTV URLs from webpage
            iptv_urls = self.extract_iptv_urls(content)
            if not iptv_urls:
                print("No IPTV URLs found on the webpage")
                return []
            
            # Step 3: Fetch M3U playlists from each IPTV URL
            all_streams = []
            
            # Use ThreadPoolExecutor to fetch multiple playlists in parallel
            with ThreadPoolExecutor(max_workers=5) as executor:
                # Submit all fetch tasks
                future_to_url = {executor.submit(self.fetch_m3u_playlist, iptv_url): iptv_url for iptv_url in iptv_urls}
                
                # Collect results as they complete
                for future in as_completed(future_to_url):
                    iptv_url = future_to_url[future]
                    try:
                        m3u_content = future.result()
                        if m3u_content:
                            streams = self.extract_streams_from_m3u(m3u_content, filter_keyword)
                            all_streams.extend(streams)
                            print(f"Added {len(streams)} streams from {iptv_url}")
                    except Exception as e:
                        print(f"Failed to process {iptv_url}: {str(e)}")
                        continue
            
            # Step 4: Remove duplicates
            unique_streams = self.deduplicate_streams(all_streams)
            
            print(f"Total unique streams found: {len(unique_streams)}")
            return unique_streams
            
        except Exception as e:
            print(f"Error during crawl: {str(e)}")
            return []

# Create global crawler instance
crawler = IPTVCrawler()

@app.route('/crawl', methods=['POST'])
def crawl_endpoint():
    """
    POST endpoint to crawl IPTV streams from any URL
    
    Expected JSON body:
    {
        "url": "https://example.com",
        "filter": "sports"  // optional
    }
    
    Returns:
    {
        "success": true,
        "streams": [
            {"name": "Channel Name", "url": "https://stream.m3u8"},
            ...
        ],
        "total_streams": 10,
        "source_url": "https://example.com"
    }
    """
    try:
        # Check content type
        content_type = request.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json. Please set the header: Content-Type: application/json'
            }), 415
        
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: url'
            }), 400
        
        url = data['url']
        filter_keyword = data.get('filter')
        
        print(f"Received crawl request for URL: {url}")
        if filter_keyword:
            print(f"Filter keyword: {filter_keyword}")
        
        # Crawl IPTV streams
        streams = crawler.crawl_iptv_streams(url, filter_keyword)
        
        if not streams:
            return jsonify({
                'success': False,
                'error': 'No IPTV streams found at the provided URL'
            }), 404
        
        # Convert to JSON format
        streams_json = []
        for name, stream_url in streams:
            streams_json.append({
                'name': name,
                'url': stream_url
            })
        
        return jsonify({
            'success': True,
            'streams': streams_json,
            'total_streams': len(streams),
            'source_url': url,
            'filter_applied': filter_keyword
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500



@app.route('/proxy-video', methods=['GET'])
def proxy_video():
    """Proxy video streams to bypass CORS and format issues"""
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try:
        # Decode the URL
        url = urllib.parse.unquote(url)
        
        # Set headers to mimic VLC
        headers = {
            'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Range': 'bytes=0-',
        }
        
        # Check for additional parameters
        if request.args.get('headers') == 'true':
            headers.update({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            })
        
        if request.args.get('vlc') == 'true':
            headers['User-Agent'] = 'VLC/3.0.0 LibVLC/3.0.0'
        
        print(f"Proxying video: {url}")
        
        # Stream the response like VLC does
        response = requests.get(url, headers=headers, stream=True, timeout=30, verify=False)
        
        if response.status_code in [200, 206]:
            # Create a Flask response with streaming
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    yield chunk
            
            flask_response = app.response_class(
                generate(),
                status=200,
                headers={
                    'Content-Type': response.headers.get('Content-Type', 'video/mp4'),
                    'Content-Length': response.headers.get('Content-Length', ''),
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Range',
                }
            )
            
            return flask_response
        else:
            print(f"Proxy failed with status: {response.status_code}")
            return jsonify({'error': f'Failed to proxy video: {response.status_code}'}), response.status_code
            
    except Exception as e:
        print(f"Proxy error: {str(e)}")
        return jsonify({'error': f'Proxy error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'IPTV Crawler API',
        'version': '1.0.0'
    })

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with usage instructions"""
    return jsonify({
        'service': 'IPTV Crawler API',
        'version': '1.0.0',
        'description': 'Crawls IPTV playlists from any URL by extracting IPTV URLs and fetching M3U playlists',
        'endpoints': {
            'POST /crawl': 'Crawl IPTV streams from any URL (JSON)',
            'GET /health': 'Health check',
            'GET /proxy-video': 'Proxy video streams (use ?url=... parameter)',
            'GET /': 'This help message'
        },
        'usage': {
            'method': 'POST',
            'endpoint': '/crawl',
            'body': {
                'url': 'https://example.com (required)',
                'filter': 'sports (optional)'
            }
        }
    })

if __name__ == '__main__':
    print("🚀 Starting IPTV Crawler API")
    print("📍 API will be available at: http://localhost:5000")
    print("📋 Endpoints:")
    print("   POST /crawl - Crawl IPTV streams from any URL")
    print("   GET /health - Health check")
    print("   GET /proxy-video - Proxy video streams")
    print("   GET / - Help and usage")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True) 