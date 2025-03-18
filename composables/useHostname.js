// composables/useHostname.js
export function useHostname() {
  const hostname = process.client ? window.location.hostname : '';
  
  // Detailed logging
  console.log('Full URL:', process.client ? window.location.href : 'server side');
  console.log('Hostname detected:', hostname);
  
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const baseDomain = 'medsgh.com';
  
  function parseSubdomain() {
    if (isLocalhost) return null;
    
    console.log('Parsing subdomain from:', hostname);
    
    // For development domains that might not match the production pattern
    if (hostname.endsWith('.vercel.app')) {
      console.log('Vercel preview deployment detected');
      // Return subdomain from query param for preview deployments
      return process.client ? new URLSearchParams(window.location.search).get('subdomain') : null;
    }
    
    // For the actual domain
    if (hostname.endsWith(baseDomain)) {
      const parts = hostname.split('.');
      console.log('Domain parts:', parts);
      
      // Check for subdomain
      if (parts.length > 2 && parts[0] !== 'www') {
        console.log('Subdomain detected:', parts[0]);
        return parts[0];
      }
    }
    
    console.log('No subdomain detected');
    return null;
  }
  
  return {
    hostname,
    isLocalhost,
    baseDomain,
    parseSubdomain
  };
}