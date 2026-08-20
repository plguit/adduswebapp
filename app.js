/* ==========================================================================
   ADDUS — Modern AI Operating System for Business Creativity
   Application Logic & Conversational AI Engine connected to Groq AI
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Persistent User Session ID ---
  let userId = localStorage.getItem('addus_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('addus_user_id', userId);
  }

  // --- State Management ---
  const state = {
    isOnboarding: false,
    onboardingStep: 0,
    onboardingData: {
      businessName: '',
      industry: '',
      products: '',
      websiteUrl: '',
      targetAudience: '',
      businessGoal: ''
    },
    currentWorkspace: 'Cooper 4.0',
    attachments: [],
    isVoiceRecording: false,
    isGenerating: false
  };

  // Onboarding Question Sequence
  const onboardingQuestions = [
    {
      key: 'businessName',
      question: "Awesome! Let's build your creative workspace. First, what is your **Business Name**?",
      placeholder: "e.g. Lumina AI, Apex Coffee, Zenith Apparel..."
    },
    {
      key: 'industry',
      question: "Great name! What **Industry** or market sector do you operate in?",
      placeholder: "e.g. SaaS, E-commerce, Health & Wellness, FinTech..."
    },
    {
      key: 'products',
      question: "Got it! What primary **Products or Services** do you offer?",
      placeholder: "e.g. B2B software, organic skincare line, design consultancy..."
    },
    {
      key: 'websiteUrl',
      question: "What is your **Website URL** (or landing page link)?",
      placeholder: "e.g. https://yourcompany.com or type 'None'"
    },
    {
      key: 'targetAudience',
      question: "Who is your primary **Target Audience** or ideal customer profile?",
      placeholder: "e.g. Tech-savvy founders, eco-conscious shoppers, marketing directors..."
    },
    {
      key: 'businessGoal',
      question: "Finally, what is your main **Business Goal** right now?",
      placeholder: "e.g. Launch product video, redesign website, scale ad campaign..."
    }
  ];

  // --- DOM Elements ---
  const chatThread = document.getElementById('chat-thread');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const getStartedBtn = document.getElementById('get-started-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  
  // Navigation & Popovers
  const workspaceDropdownBtn = document.getElementById('workspace-dropdown-btn');
  const workspacePopover = document.getElementById('workspace-popover');
  const currentWorkspaceName = document.getElementById('current-workspace-name');
  
  const notificationsTrigger = document.getElementById('notifications-trigger');
  const notificationsPopover = document.getElementById('notifications-popover');
  const markAllReadBtn = document.getElementById('mark-all-read');
  const notificationBadge = document.querySelector('.notification-badge');

  const profileTrigger = document.getElementById('profile-trigger');
  const profilePopover = document.getElementById('profile-popover');

  const mobileMenuTrigger = document.getElementById('mobile-menu-trigger');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeMobileDrawer = document.getElementById('close-mobile-drawer');

  // Search Modal
  const searchModalTrigger = document.getElementById('search-modal-trigger');
  const searchModal = document.getElementById('search-modal');
  const globalSearchInput = document.getElementById('global-search-input');
  const searchClear = document.getElementById('search-clear');

  // Input Tools & Attachments
  const attachBtn = document.getElementById('attach-btn');
  const attachmentPopover = document.getElementById('attachment-popover');
  const optAddUrl = document.getElementById('opt-add-url');
  const optUploadImage = document.getElementById('opt-upload-image');
  const fileInputHidden = document.getElementById('file-input-hidden');
  const urlToolBtn = document.getElementById('url-tool-btn');
  const imageToolBtn = document.getElementById('image-tool-btn');

  const voiceBtn = document.getElementById('voice-btn');
  const voiceWaves = document.getElementById('voice-waves');
  const attachmentsPreviewBar = document.getElementById('attachments-preview-bar');

  // URL Modal
  const urlModal = document.getElementById('url-modal');
  const websiteUrlInput = document.getElementById('website-url-input');
  const cancelUrlBtn = document.getElementById('cancel-url-btn');
  const confirmUrlBtn = document.getElementById('confirm-url-btn');

  // --- Auto-Resize Textarea ---
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  // --- Keyboard Shortcuts & Send Trigger ---
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmit();
    }
  });

  sendBtn.addEventListener('click', handleUserSubmit);

  // Global ⌘K shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleSearchModal(true);
    }
  });

  // --- Suggestion Cards Handling ---
  const suggestionCards = document.querySelectorAll('.suggestion-card');
  suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const action = card.getAttribute('data-action');
      handleSuggestionClick(action);
    });
  });

  function handleSuggestionClick(action) {
    let promptText = '';
    if (action === 'video') {
      promptText = "Create a high-converting 30-second product video storyboard and script.";
    } else if (action === 'website') {
      promptText = "Build a modern responsive website blueprint with landing page copy.";
    } else if (action === 'marketing') {
      promptText = "Design a 30-day marketing campaign strategy to double brand leads.";
    } else if (action === 'branding') {
      promptText = "Develop a luxury brand identity guide, color tokens, and tagline concepts.";
    }

    appendUserMessage(promptText);
    streamAIResponse(promptText);
  }

  // --- Conversational Onboarding Flow ---
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      startOnboarding();
    });
  }

  function startOnboarding() {
    state.isOnboarding = true;
    state.onboardingStep = 0;
    
    // Hide CTA button
    const ctaWrap = document.querySelector('.cta-action-wrap');
    if (ctaWrap) ctaWrap.style.display = 'none';

    const firstQ = onboardingQuestions[0];
    userInput.placeholder = firstQ.placeholder;
    userInput.focus();

    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      appendAssistantMessage(firstQ.question);
    }, 600);
  }

  function handleOnboardingStep(userResponseText) {
    const currentQ = onboardingQuestions[state.onboardingStep];
    state.onboardingData[currentQ.key] = userResponseText;
    state.onboardingStep++;

    if (state.onboardingStep < onboardingQuestions.length) {
      const nextQ = onboardingQuestions[state.onboardingStep];
      userInput.placeholder = nextQ.placeholder;

      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendAssistantMessage(nextQ.question);
      }, 500);
    } else {
      state.isOnboarding = false;
      userInput.placeholder = "Describe your business or ask ADDI any creative request...";

      const summaryPrompt = `I have completed onboarding for my business. Business Name: ${state.onboardingData.businessName}, Industry: ${state.onboardingData.industry}, Products: ${state.onboardingData.products}, Website: ${state.onboardingData.websiteUrl}, Target Audience: ${state.onboardingData.targetAudience}, Main Goal: ${state.onboardingData.businessGoal}. Please confirm our creative workspace is active and provide initial strategic guidance.`;
      
      streamAIResponse(summaryPrompt);
    }
  }

  // --- User Submission Handler ---
  function handleUserSubmit() {
    const text = userInput.value.trim();
    if (!text && state.attachments.length === 0) return;

    appendUserMessage(text);
    userInput.value = '';
    userInput.style.height = 'auto';

    clearAttachments();

    if (state.isOnboarding) {
      handleOnboardingStep(text);
      return;
    }

    // Call Backend Groq AI Service via Streaming Response
    streamAIResponse(text);
  }

  // --- Real-Time Streaming AI Response Handler ---
  async function streamAIResponse(userPrompt) {
    showTypingIndicator();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message assistant-message';
    msgDiv.innerHTML = `
      <div class="message-avatar">
        <div class="avatar-gradient">✦</div>
      </div>
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">ADDI</span>
          <span class="time-stamp">Just now</span>
        </div>
        <div class="glass-card">
          <div class="message-body-text"></div>
        </div>
      </div>
    `;

    let bodyTextElem = null;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          userId: userId,
          stream: true
        })
      });

      hideTypingIndicator();
      chatThread.appendChild(msgDiv);
      bodyTextElem = msgDiv.querySelector('.message-body-text');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.content || 'Unable to connect to AI service. Please check your backend connection.';
        bodyTextElem.innerHTML = escapeHTML(errMsg);
        scrollToBottom();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              if (data.vault) {
                updateBusinessVaultUI(msgDiv, data.vault);
              }
              break;
            }

            if (data.token) {
              fullText += data.token;
              bodyTextElem.innerHTML = formatMarkdownText(fullText);
              scrollToBottom();
            }
          } catch (e) {
            console.error('SSE parse error:', e);
          }
        }
      }

      if (!fullText.trim()) {
        bodyTextElem.innerHTML = 'ADDI completed the request.';
      }

    } catch (err) {
      hideTypingIndicator();
      console.error('[AI Stream Error]', err);

      if (!chatThread.contains(msgDiv)) {
        chatThread.appendChild(msgDiv);
      }
      bodyTextElem = msgDiv.querySelector('.message-body-text');
      bodyTextElem.innerHTML = 'Network Error: Unable to connect to ADDI AI service. Please check if the server is running.';
      scrollToBottom();
    }
  }

  // --- DOM Helpers for Chat Messages ---
  function appendUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user-message';
    
    let attachmentHTML = '';
    if (state.attachments.length > 0) {
      attachmentHTML = `<div class="attached-pills-wrap" style="display:flex; gap:6px; margin-bottom:6px;">` +
        state.attachments.map(att => `<span class="attach-chip"><i class="${att.icon}"></i> ${att.label}</span>`).join('') +
        `</div>`;
    }

    msgDiv.innerHTML = `
      <div class="user-avatar-circle">YOU</div>
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">You</span>
          <span class="time-stamp">Just now</span>
        </div>
        <div class="user-glass-bubble">
          ${attachmentHTML}
          <p>${escapeHTML(text)}</p>
        </div>
      </div>
    `;

    chatThread.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendAssistantMessage(text, extraHTML = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message assistant-message';

    const formattedText = formatMarkdownText(text);

    msgDiv.innerHTML = `
      <div class="message-avatar">
        <div class="avatar-gradient">✦</div>
      </div>
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">ADDI</span>
          <span class="time-stamp">Just now</span>
        </div>
        <div class="glass-card">
          <div class="message-body-text">${formattedText}</div>
          ${extraHTML}
        </div>
      </div>
    `;

    chatThread.appendChild(msgDiv);
    scrollToBottom();
  }

  // Global Quick Action Trigger for Chips
  window.triggerQuickAction = function(promptText) {
    userInput.value = promptText;
    handleUserSubmit();
  };

  // --- Typing Indicator Functions ---
  function showTypingIndicator() {
    state.isGenerating = true;
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
  }

  function hideTypingIndicator() {
    state.isGenerating = false;
    typingIndicator.classList.add('hidden');
  }

  function scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

  // --- Attachments & Modals Logic ---
  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachmentPopover.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!attachmentPopover.contains(e.target) && e.target !== attachBtn) {
      attachmentPopover.classList.remove('open');
    }
  });

  optAddUrl.addEventListener('click', () => {
    attachmentPopover.classList.remove('open');
    urlModal.classList.add('open');
    websiteUrlInput.focus();
  });

  cancelUrlBtn.addEventListener('click', () => {
    urlModal.classList.remove('open');
    websiteUrlInput.value = '';
  });

  confirmUrlBtn.addEventListener('click', () => {
    const url = websiteUrlInput.value.trim();
    if (url) {
      addAttachment({
        type: 'url',
        label: url.replace(/^https?:\/\//, ''),
        icon: 'ri-global-line'
      });
      websiteUrlInput.value = '';
      urlModal.classList.remove('open');
    }
  });

  optUploadImage.addEventListener('click', () => {
    attachmentPopover.classList.remove('open');
    fileInputHidden.click();
  });

  imageToolBtn.addEventListener('click', () => {
    fileInputHidden.click();
  });

  fileInputHidden.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      addAttachment({
        type: 'image',
        label: file.name,
        icon: 'ri-image-line'
      });
      fileInputHidden.value = '';
    }
  });

  function addAttachment(att) {
    state.attachments.push(att);
    renderAttachmentPills();
  }

  function renderAttachmentPills() {
    if (state.attachments.length === 0) {
      attachmentsPreviewBar.classList.add('hidden');
      return;
    }

    attachmentsPreviewBar.classList.remove('hidden');
    attachmentsPreviewBar.innerHTML = state.attachments.map((att, index) => `
      <span class="attach-chip">
        <i class="${att.icon}"></i> ${escapeHTML(att.label)}
        <i class="ri-close-line attach-chip-remove" onclick="removeAttachment(${index})"></i>
      </span>
    `).join('');
  }

  window.removeAttachment = function(index) {
    state.attachments.splice(index, 1);
    renderAttachmentPills();
  };

  function clearAttachments() {
    state.attachments = [];
    renderAttachmentPills();
  }

  // Voice Mic Toggle Simulation
  voiceBtn.addEventListener('click', () => {
    state.isVoiceRecording = !state.isVoiceRecording;
    if (state.isVoiceRecording) {
      voiceBtn.classList.add('active');
      voiceWaves.classList.remove('hidden');
      userInput.placeholder = "Listening... Speak your idea for ADDI";
    } else {
      voiceBtn.classList.remove('active');
      voiceWaves.classList.add('hidden');
      userInput.placeholder = "Describe your business or ask ADDI any creative request...";
      userInput.value = "Create an AI-driven video marketing campaign for my product";
    }
  });

  // Workspace Selector Dropdown
  workspaceDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllPopovers();
    workspacePopover.classList.toggle('open');
    workspaceDropdownBtn.classList.toggle('active');
  });

  const workspaceItems = document.querySelectorAll('.popover-item[data-workspace]');
  workspaceItems.forEach(item => {
    item.addEventListener('click', () => {
      const wsName = item.getAttribute('data-workspace');
      state.currentWorkspace = wsName;
      currentWorkspaceName.textContent = wsName;
      workspaceItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      workspacePopover.classList.remove('open');
    });
  });

  // Notifications Popover Toggle
  notificationsTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllPopovers();
    notificationsPopover.classList.toggle('open');
  });

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(i => i.classList.remove('unread'));
      if (notificationBadge) notificationBadge.style.display = 'none';
    });
  }

  // Profile Popover Toggle
  profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllPopovers();
    profilePopover.classList.toggle('open');
  });

  function closeAllPopovers() {
    workspacePopover.classList.remove('open');
    workspaceDropdownBtn.classList.remove('active');
    notificationsPopover.classList.remove('open');
    profilePopover.classList.remove('open');
  }

  document.addEventListener('click', () => {
    closeAllPopovers();
  });

  // Search Modal Toggle
  searchModalTrigger.addEventListener('click', () => {
    toggleSearchModal(true);
  });

  searchClear.addEventListener('click', () => {
    globalSearchInput.value = '';
    globalSearchInput.focus();
  });

  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) toggleSearchModal(false);
  });

  function toggleSearchModal(show) {
    if (show) {
      searchModal.classList.add('open');
      globalSearchInput.focus();
    } else {
      searchModal.classList.remove('open');
    }
  }

  // Search Result Item Clicks
  const searchResultItems = document.querySelectorAll('.search-result-item');
  searchResultItems.forEach(item => {
    item.addEventListener('click', () => {
      const prompt = item.getAttribute('data-prompt');
      toggleSearchModal(false);
      userInput.value = prompt;
      handleUserSubmit();
    });
  });

  // Mobile Drawer
  mobileMenuTrigger.addEventListener('click', () => {
    mobileDrawer.classList.add('open');
  });

  closeMobileDrawer.addEventListener('click', () => {
    mobileDrawer.classList.remove('open');
  });

  mobileDrawer.addEventListener('click', (e) => {
    if (e.target === mobileDrawer) mobileDrawer.classList.remove('open');
  });

  // Markdown formatting helper
  function formatMarkdownText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // --- Business Vault Dynamic UI Component ---
  function updateBusinessVaultUI(msgDiv, vault) {
    if (!vault) return;
    state.businessVault = vault;

    const filledFields = Object.entries(vault).filter(([k, v]) => v && k !== 'lastUpdated');
    if (filledFields.length === 0) return;

    const existing = msgDiv.querySelector('.vault-update-card');
    if (existing) existing.remove();

    const vaultCardHTML = document.createElement('div');
    vaultCardHTML.className = 'vault-update-card';
    vaultCardHTML.style.cssText = 'margin-top:12px; padding:10px 14px; background:rgba(124,92,255,0.06); border:1px solid rgba(124,92,255,0.2); border-radius:10px; font-size:12px; color:#333;';
    
    vaultCardHTML.innerHTML = `
      <div style="font-weight:600; color:#7C5CFF; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
        <i class="ri-database-2-line"></i> Business Vault Profile Active
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:6px;">
        ${filledFields.map(([k, v]) => `<div><strong style="color:#555;">${formatVaultKey(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
      </div>
    `;

    const glassCard = msgDiv.querySelector('.glass-card');
    if (glassCard) {
      glassCard.appendChild(vaultCardHTML);
    }
  }

  function formatVaultKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

});
