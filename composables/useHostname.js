// composables/useHostname.js
export function useHostname() {
  const hostname = process.client ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  function parseSubdomain() {
    if (isLocalhost) return null;
    
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    
    return null;
  }
  
  return {
    hostname,
    isLocalhost,
    parseSubdomain
  };
}