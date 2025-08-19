export async function generateSegments(data) {
  console.log('[API Client] Calling /api/generate with:', data);
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('[API Client] Response status:', response.status);
  console.log('[API Client] Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    // Get response text first to see if it's HTML or JSON
    const responseText = await response.text();
    console.error('[API Client] Error response text:', responseText);
    
    try {
      const error = JSON.parse(responseText);
      throw new Error(error.message || 'Failed to generate segments');
    } catch (parseError) {
      // If it's not JSON, it's likely an HTML error page
      console.error('[API Client] Response is not JSON, likely HTML error page');
      if (responseText.includes('<!DOCTYPE')) {
        throw new Error(`Server returned HTML error page instead of JSON. Status: ${response.status}. This usually indicates a server configuration issue or the API endpoint is not available.`);
      }
      throw new Error(`API Error (${response.status}): ${responseText.substring(0, 200)}...`);
    }
  }
  
  // Also check for successful responses that might not be JSON
  const responseText = await response.text();
  console.log('[API Client] Response text:', responseText.substring(0, 200));
  
  try {
    const result = JSON.parse(responseText);
    console.log('[API Client] Success response:', result);
    return result;
  } catch (parseError) {
    console.error('[API Client] Failed to parse successful response as JSON:', parseError);
    throw new Error('Server returned invalid JSON response. Check server logs for details.');
  }
}

export async function downloadSegments(segments) {
  console.log('[API Client] Downloading segments:', segments.length);
  
  const response = await fetch('/api/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments }),
  });
  
  if (!response.ok) {
    console.error('[API Client] Download failed:', response.status);
    throw new Error('Failed to download segments');
  }
  
  console.log('[API Client] Download successful');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'veo3-segments.zip';
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function generateVideos(segments) {
  console.log('[API Client] Generating videos for segments:', segments.length);
  
  const response = await fetch('/api/generate-videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments }),
  });
  
  console.log('[API Client] Video generation response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('[API Client] Video generation error:', error);
    throw new Error(error.message || 'Failed to generate videos');
  }
  
  const result = await response.json();
  console.log('[API Client] Video generation success:', result);
  return result;
}

export async function generateContinuation(data) {
  console.log('[API Client] Calling /api/generate-continuation with:', data);
  
  const response = await fetch('/api/generate-continuation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('[API Client] Response status:', response.status);
  console.log('[API Client] Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    // Get response text first to see if it's HTML or JSON
    const responseText = await response.text();
    console.error('[API Client] Error response text:', responseText);
    
    try {
      const error = JSON.parse(responseText);
      throw new Error(error.message || 'Failed to generate continuation');
    } catch (parseError) {
      // If it's not JSON, it's likely an HTML error page
      console.error('[API Client] Response is not JSON, likely HTML error page');
      if (responseText.includes('<!DOCTYPE')) {
        throw new Error(`Server returned HTML error page instead of JSON. Status: ${response.status}. This usually indicates a server configuration issue or the API endpoint is not available.`);
      }
      throw new Error(`API Error (${response.status}): ${responseText.substring(0, 200)}...`);
    }
  }
  
  // Also check for successful responses that might not be JSON
  const responseText = await response.text();
  console.log('[API Client] Response text:', responseText.substring(0, 200));
  
  try {
    const result = JSON.parse(responseText);
    console.log('[API Client] Success response:', result);
    return result;
  } catch (parseError) {
    console.error('[API Client] Failed to parse successful response as JSON:', parseError);
    throw new Error('Server returned invalid JSON response. Check server logs for details.');
  }
}

