// Smart categorization function that analyzes stream names and groups them intelligently
export const categorizeStreams = (streams) => {
  const categories = {}
  
  streams.forEach(stream => {
    const streamName = stream.name.toLowerCase()
    
    // Extract potential category from stream name
    let category = extractCategoryFromName(streamName)
    
    // If no category found, try to extract from URL
    if (!category) {
      category = extractCategoryFromUrl(stream.url)
    }
    
    // If still no category, use a default
    if (!category) {
      category = 'General'
    }
    
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(stream)
  })
  
  return categories
}

// Extract category from stream name using intelligent pattern matching
export const extractCategoryFromName = (streamName) => {
  // Common patterns for different content types
  const patterns = {
    'Sports': /(sport|football|soccer|basketball|tennis|cricket|hockey|baseball|golf|boxing|mma|ufc|wrestling|bein|espn|sky sports|premier league|champions league|epl|mls|nfl|nba|nhl|olympics|world cup|championship)/i,
    'News': /(news|cnn|bbc|fox news|msnbc|al jazeera|reuters|bloomberg|cnbc|fox business|breaking|headlines|current affairs)/i,
    'Movies': /(movie|film|cinema|hollywood|netflix|hbo|disney|marvel|dc|action|comedy|drama|horror|thriller|romance|sci-fi)/i,
    'Kids': /(kids|children|cartoon|disney|nickelodeon|cartoon network|pbs kids|baby|toddler|animated|family)/i,
    'Music': /(music|mtv|vh1|bet|fuse|concert|live music|radio|top 40|rock|pop|hip hop|country|jazz|classical)/i,
    'Documentary': /(documentary|discovery|national geographic|history|science|nature|wildlife|travel|exploration|educational)/i,
    'Entertainment': /(entertainment|comedy|talk show|reality|variety|game show|quiz|talent|show|program)/i,
    'Regional': /(arabic|hindi|spanish|french|german|italian|chinese|japanese|korean|russian|portuguese|turkish)/i,
    'Religious': /(religious|christian|islamic|catholic|evangelical|church|mosque|prayer|gospel|spiritual)/i,
    'Educational': /(educational|learning|tutorial|how to|instruction|academic|university|college|course|lesson)/i,
    'Live TV': /(live|live tv|live stream|broadcast|channel|station|network|television)/i,
    'Gaming': /(gaming|game|esports|twitch|streamer|gamer|playstation|xbox|nintendo)/i,
    'Business': /(business|finance|economy|stock|market|trading|investment|corporate|entrepreneur)/i,
    'Technology': /(tech|technology|digital|innovation|startup|software|hardware|ai|artificial intelligence)/i,
    'Lifestyle': /(lifestyle|fashion|beauty|health|fitness|cooking|food|travel|home|garden)/i
  }
  
  for (const [category, pattern] of Object.entries(patterns)) {
    if (pattern.test(streamName)) {
      return category
    }
  }
  
  return null
}

// Extract category from URL patterns
export const extractCategoryFromUrl = (url) => {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('sport') || urlLower.includes('football') || urlLower.includes('soccer')) {
    return 'Sports'
  }
  if (urlLower.includes('news') || urlLower.includes('cnn') || urlLower.includes('bbc')) {
    return 'News'
  }
  if (urlLower.includes('movie') || urlLower.includes('film') || urlLower.includes('netflix')) {
    return 'Movies'
  }
  if (urlLower.includes('music') || urlLower.includes('mtv') || urlLower.includes('concert')) {
    return 'Music'
  }
  if (urlLower.includes('live') || urlLower.includes('tv') || urlLower.includes('channel')) {
    return 'Live TV'
  }
  
  return null
}

// Generate M3U content in the correct format
export const generateM3UContent = (streams) => {
  let content = '#EXTM3U\n'
  streams.forEach(stream => {
    content += `#EXTINF:-1,${stream.name}\n${stream.url}\n`
  })
  return content
}

// Download M3U file
export const downloadM3U = (streams, categoryName) => {
  const content = generateM3UContent(streams)
  const blob = new Blob([content], { type: 'application/x-mpegurl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_streams.m3u`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Filter streams by status
export const filterStreamsByStatus = (streams, streamStatus, status) => {
  if (status === 'all') return streams
  return streams.filter(stream => streamStatus[stream.url] === status)
}

// Get status indicator for stream
export const getStatusIndicator = (streamUrl, streamStatus) => {
  const status = streamStatus[streamUrl]
  
  switch (status) {
    case 'working':
      return { icon: 'check', className: 'working', title: 'Stream is working' }
    case 'broken':
      return { icon: 'times-circle', className: 'broken', title: 'Stream is broken' }
    case 'checking':
      return { icon: 'spinner', className: 'checking', title: 'Checking stream...' }
    default:
      return { icon: 'wifi', className: 'unknown', title: 'Stream not tested' }
  }
}

// Get status text for stream
export const getStatusText = (streamUrl, streamStatus) => {
  const status = streamStatus[streamUrl]
  
  switch (status) {
    case 'working':
      return 'Working'
    case 'broken':
      return 'Broken'
    case 'checking':
      return 'Checking...'
    default:
      return 'Not tested'
  }
} 