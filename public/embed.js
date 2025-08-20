(function() {
  'use strict';

  // Configuration
  const config = {
    agentId: null,
    deploymentId: null,
    apiUrl: window.location.origin,
    wakeWord: 'Hey Assistant',
    isListening: false,
    audioContext: null,
    mediaRecorder: null,
    audioChunks: []
  };

  // Initialize the agent
  function initAgent() {
    const script = document.currentScript;
    if (script) {
      config.agentId = script.getAttribute('data-agent');
      config.deploymentId = script.getAttribute('data-deployment');
    }

    if (!config.agentId) {
      console.error('Agent ID is required');
      return;
    }

    createVoiceButton();
    setupVoiceRecognition();
  }

  // Create the floating voice button
  function createVoiceButton() {
    const button = document.createElement('div');
    button.id = 'voice-agent-button';
    button.innerHTML = `
      <div class="voice-agent-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.1 2 14 2.9 14 4V6C14 7.1 13.1 8 12 8C10.9 8 10 7.1 10 6V4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
          <path d="M19 10V9C19 5.13 15.87 2 12 2C8.13 2 5 5.13 5 9V10C5 13.87 8.13 17 12 17C15.87 17 19 13.87 19 10Z" fill="currentColor"/>
          <path d="M12 20C13.1 20 14 20.9 14 22C14 23.1 13.1 24 12 24C10.9 24 10 23.1 10 22C10 20.9 10.9 20 12 20Z" fill="currentColor"/>
        </svg>
      </div>
      <div class="voice-agent-status">Ready</div>
    `;

    // Add styles
    const styles = `
      <style>
        #voice-agent-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: all 0.3s ease;
        }
        
        #voice-agent-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(0,0,0,0.4);
        }
        
        #voice-agent-button.listening {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          animation: pulse 1.5s infinite;
        }
        
        .voice-agent-icon {
          margin-bottom: 4px;
        }
        
        .voice-agent-status {
          font-size: 10px;
          font-weight: 500;
          text-align: center;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .voice-agent-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          z-index: 10001;
          display: none;
          align-items: center;
          justify-content: center;
        }
        
        .voice-agent-modal.active {
          display: flex;
        }
        
        .voice-agent-content {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .voice-agent-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }
        
        .voice-agent-message {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 24px;
        }
        
        .voice-agent-close {
          background: #f3f4f6;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
    document.body.appendChild(button);

    // Add click event
    button.addEventListener('click', toggleVoiceRecognition);
  }

  // Setup voice recognition
  function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = function() {
        config.isListening = true;
        updateButtonState('listening', 'Listening...');
      };

      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        processVoiceCommand(transcript);
      };

      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        updateButtonState('ready', 'Error');
        setTimeout(() => updateButtonState('ready', 'Ready'), 2000);
      };

      recognition.onend = function() {
        config.isListening = false;
        updateButtonState('ready', 'Ready');
      };

      config.recognition = recognition;
    } else {
      console.warn('Speech recognition not supported');
      updateButtonState('ready', 'No Voice');
    }
  }

  // Toggle voice recognition
  function toggleVoiceRecognition() {
    if (!config.recognition) {
      showModal('Voice recognition is not supported in this browser');
      return;
    }

    if (config.isListening) {
      config.recognition.stop();
    } else {
      config.recognition.start();
    }
  }

  // Update button state
  function updateButtonState(state, text) {
    const button = document.getElementById('voice-agent-button');
    if (button) {
      button.className = state === 'listening' ? 'voice-agent-button listening' : 'voice-agent-button';
      const status = button.querySelector('.voice-agent-status');
      if (status) status.textContent = text;
    }
  }

  // Process voice command
  async function processVoiceCommand(transcript) {
    try {
      updateButtonState('ready', 'Processing...');
      
      // Send to agent API
      const response = await fetch(`${config.apiUrl}/api/agent-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: config.agentId,
          deploymentId: config.deploymentId,
          message: transcript,
          type: 'voice'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Speak the response if speech synthesis is available
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.response);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }
        
        showModal(`Response: ${result.response}`);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      showModal('Sorry, I encountered an error. Please try again.');
    } finally {
      updateButtonState('ready', 'Ready');
    }
  }

  // Show modal with message
  function showModal(message) {
    let modal = document.getElementById('voice-agent-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'voice-agent-modal';
      modal.className = 'voice-agent-modal';
      modal.innerHTML = `
        <div class="voice-agent-content">
          <div class="voice-agent-title">Voice Agent</div>
          <div class="voice-agent-message">${message}</div>
          <button class="voice-agent-close" onclick="this.closest('.voice-agent-modal').classList.remove('active')">
            Close
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      const messageEl = modal.querySelector('.voice-agent-message');
      if (messageEl) messageEl.textContent = message;
    }

    modal.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      modal.classList.remove('active');
    }, 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAgent);
  } else {
    initAgent();
  }

  // Expose functions globally for debugging
  window.voiceAgent = {
    config,
    showModal,
    processVoiceCommand
  };

})();
