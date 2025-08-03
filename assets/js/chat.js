// Chat Widget JavaScript
class ChatWidget {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isOpen = false;
    this.unreadCount = 0;
    this.typingTimeout = null;
    this.userName = localStorage.getItem('userName') || 'Anonymous';
    this.userEmail = localStorage.getItem('userEmail') || '';
    
    this.init();
  }

  init() {
    this.createChatWidget();
    this.connectWebSocket();
    this.bindEvents();
  }

  createChatWidget() {
    // Create chat widget HTML
    const chatHTML = `
      <div class="chat-widget">
        <div class="chat-bubble" id="chatBubble">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          <div class="notification" id="notification" style="display: none;">0</div>
        </div>
        
        <div class="chat-window" id="chatWindow">
          <div class="chat-header">
            <h3>Chat với Admin</h3>
            <button class="close-btn" id="closeChat">&times;</button>
          </div>
          
          <div class="chat-messages" id="chatMessages">
            <div class="chat-message system">
              <div class="message-bubble">
                Kết nối với admin...
              </div>
            </div>
          </div>
          
          <div class="typing-indicator" id="typingIndicator" style="display: none;">
            Admin đang nhập tin nhắn...
          </div>
          
          <div class="chat-input">
            <input type="text" id="messageInput" placeholder="Nhập tin nhắn..." maxlength="500">
            <button id="sendMessage">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  connectWebSocket() {
    // Connect to WebSocket server
    this.socket = io('http://localhost:5000');
    
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.updateConnectionStatus();
      
      // Join chat with user info
      this.socket.emit('join-chat', {
        name: this.userName,
        email: this.userEmail,
        isAdmin: false
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
      this.updateConnectionStatus();
    });

    this.socket.on('chat-message', (message) => {
      this.addMessage(message);
      
      // Show notification if chat is closed
      if (!this.isOpen && !message.isSystem) {
        this.showNotification();
      }
    });

    this.socket.on('chat-history', (messages) => {
      this.loadChatHistory(messages);
    });

    this.socket.on('user-typing', (data) => {
      this.showTypingIndicator(data);
    });

    this.socket.on('user-joined', (data) => {
      this.addSystemMessage(data.message);
    });

    this.socket.on('user-left', (data) => {
      this.addSystemMessage(data.message);
    });
  }

  bindEvents() {
    // Chat bubble click
    document.getElementById('chatBubble').addEventListener('click', () => {
      this.toggleChat();
    });

    // Close button
    document.getElementById('closeChat').addEventListener('click', () => {
      this.closeChat();
    });

    // Send message
    document.getElementById('sendMessage').addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key to send message
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Typing indicator
    document.getElementById('messageInput').addEventListener('input', () => {
      this.handleTyping();
    });
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.add('active');
    this.isOpen = true;
    this.hideNotification();
    this.scrollToBottom();
  }

  closeChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.remove('active');
    this.isOpen = false;
  }

  sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message && this.isConnected) {
      this.socket.emit('send-message', { message });
      input.value = '';
      
      // Stop typing indicator
      this.socket.emit('typing', false);
    }
  }

  addMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    const messageClass = message.isSystem ? 'system' : 
                        message.isAdmin ? 'admin' : 'user';
    
    const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageDiv.className = `chat-message ${messageClass}`;
    messageDiv.innerHTML = `
      <div class="message-bubble">
        ${this.escapeHtml(message.message)}
      </div>
      <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addSystemMessage(message) {
    const systemMessage = {
      id: Date.now().toString(),
      sender: 'System',
      message: message,
      timestamp: new Date(),
      isSystem: true
    };
    this.addMessage(systemMessage);
  }

  loadChatHistory(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    messages.forEach(message => {
      this.addMessage(message);
    });
  }

  showTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    if (data.isTyping) {
      indicator.style.display = 'block';
      indicator.textContent = `${data.user} đang nhập tin nhắn...`;
    } else {
      indicator.style.display = 'none';
    }
  }

  handleTyping() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.socket.emit('typing', true);
    
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('typing', false);
    }, 1000);
  }

  showNotification() {
    this.unreadCount++;
    const notification = document.getElementById('notification');
    notification.textContent = this.unreadCount;
    notification.style.display = 'flex';
  }

  hideNotification() {
    this.unreadCount = 0;
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
  }

  updateConnectionStatus() {
    const messagesContainer = document.getElementById('chatMessages');
    const statusMessage = this.isConnected ? 
      'Đã kết nối với admin' : 
      'Mất kết nối. Đang thử kết nối lại...';
    
    // Update or add status message
    let statusDiv = messagesContainer.querySelector('.connection-status');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.className = 'chat-message system connection-status';
      messagesContainer.insertBefore(statusDiv, messagesContainer.firstChild);
    }
    
    statusDiv.innerHTML = `
      <div class="message-bubble">
        ${statusMessage}
      </div>
    `;
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public method to set user info
  setUserInfo(name, email) {
    this.userName = name || 'Anonymous';
    this.userEmail = email || '';
    localStorage.setItem('userName', this.userName);
    localStorage.setItem('userEmail', this.userEmail);
  }
}

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load Socket.IO client
  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
  script.onload = () => {
    window.chatWidget = new ChatWidget();
  };
  document.head.appendChild(script);
}); 