"""
Test script for IPTV Crawler
============================

This script tests the IPTV crawler functionality.
"""

import requests
import json

def test_crawler():
    """Test the IPTV crawler API"""
    
    # Test URL - the AndroidTechVilla website
    test_url = "https://androidtechvilla.com/list-of-working-1000-iptv-portal-urls-logins-and-mac-address-2021-3/"
    
    print("🧪 Testing IPTV Crawler API")
    print("=" * 50)
    
    # Test data
    test_data = {
        "url": test_url,
        "filter": ""  # No filter for testing
    }
    
    try:
        print(f"📡 Sending request to: http://localhost:5000/crawl")
        print(f"🌐 URL: {test_url}")
        
        # Send POST request to the crawler API
        response = requests.post(
            'http://localhost:5000/crawl',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=120  # 2 minutes timeout
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"📺 Total streams found: {result.get('total_streams', 0)}")
            print(f"🔗 Source URL: {result.get('source_url', 'N/A')}")
            
            # Show first few streams
            streams = result.get('streams', [])
            if streams:
                print(f"\n📋 First 5 streams:")
                for i, stream in enumerate(streams[:5]):
                    print(f"  {i+1}. {stream.get('name', 'Unknown')} - {stream.get('url', 'N/A')}")
                
                if len(streams) > 5:
                    print(f"  ... and {len(streams) - 5} more streams")
            else:
                print("❌ No streams found")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the API server is running on http://localhost:5000")
        print("💡 Run: python iptv_crawler.py")
    except requests.exceptions.Timeout:
        print("⏰ Timeout: The request took too long")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

def test_health_check():
    """Test the health check endpoint"""
    try:
        print("\n🏥 Testing health check...")
        response = requests.get('http://localhost:5000/health')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Health check passed: {result}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server")

if __name__ == '__main__':
    print("🚀 IPTV Crawler Test")
    print("=" * 50)
    
    # Test health check first
    test_health_check()
    
    # Test the main crawler functionality
    test_crawler()
    
    print("\n" + "=" * 50)
    print("✅ Test completed!") 