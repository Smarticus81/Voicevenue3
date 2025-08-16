(function() {
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent');
  
  if (!agentId) {
    console.error('VoxVenue: No agent ID provided');
    return;
  }

  // Create floating button
  const button = document.createElement('div');
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 64px;
    height: 64px;
    background: linear-gradient(45deg, #000, #111);
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    transition: transform 0.2s;
  `;
  
  button.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;
  
  button.onmouseover = () => button.style.transform = 'scale(1.1)';
  button.onmouseout = () => button.style.transform = 'scale(1)';
  
  let isActive = false;
  let session = null;
  
  button.onclick = async () => {
    if (isActive) {
      // Stop session
      if (session) {
        session.stop();
        session = null;
      }
      button.style.background = 'linear-gradient(45deg, #000, #111)';
      isActive = false;
    } else {
      // Start session
      try {
        const response = await fetch(`https://voxvenue.ai/api/agent/${agentId}`);
        const config = await response.json();
        
        // Initialize voice session
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create WebRTC connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        
        button.style.background = 'linear-gradient(45deg, #ff0000, #ff4444)';
        isActive = true;
        
        session = { pc, stream, stop: () => {
          stream.getTracks().forEach(track => track.stop());
          pc.close();
        }};
        
      } catch (error) {
        console.error('VoxVenue: Failed to start session', error);
        alert('Please allow microphone access to use the voice agent');
      }
    }
  };
  
  document.body.appendChild(button);
})();
