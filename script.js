import { BellaAI } from './core.js';
import { ChatInterface } from './chatInterface.js';

document.addEventListener('DOMContentLoaded', async function() {
    // --- Get all necessary DOM elements first ---
    const transcriptDiv = document.getElementById('transcript');
    const loadingScreen = document.getElementById('loading-screen');
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');


    // --- AI Core Initialization ---
    let bellaAI;
    let chatInterface;
    
    try {
        chatInterface = new ChatInterface();
        console.log('Chat interface initialized successfully');
        console.log('ChatInterface instance created:', chatInterface);
        console.log('Chat container element:', chatInterface.chatContainer);
        console.log('Chat container in DOM:', document.body.contains(chatInterface.chatContainer));
        
        setTimeout(() => {
            console.log('Attempting to auto-show chat interface...');
            chatInterface.show();
            console.log('Chat interface auto-shown');
            console.log('Chat interface visibility:', chatInterface.getVisibility());
            console.log('Chat container class name:', chatInterface.chatContainer.className);
        }, 2000);
    } catch (error) {
        console.error('Chat interface initialization failed:', error);
    }
    
    micButton.disabled = true;
    transcriptDiv.textContent = 'Waking up Bella\'s core...';
    try {
        bellaAI = await BellaAI.getInstance();
        console.log('Bella AI initialized successfully');
        
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                try {
                    chatInterface.showTypingIndicator();
                    const response = await bellaAI.think(message);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', response);
                } catch (error) {
                    console.error('AI processing error:', error);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', 'Sorry, I\'m a bit confused right now. Please try again later...');
                }
            };
        }
        
        micButton.disabled = false;
        transcriptDiv.textContent = 'Bella is ready. Click the microphone to start talking.';
    } catch (error) {
        console.error('Failed to initialize Bella AI:', error);
        transcriptDiv.textContent = 'AI model failed to load, but the chat interface is still available.';
        
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                chatInterface.showTypingIndicator();
                setTimeout(() => {
                    chatInterface.hideTypingIndicator();
                    const fallbackResponses = [
                        'My AI core is still loading. Please try again later...',
                        'Sorry, I cannot think clearly right now, but I\'m learning!',
                        'My brain is still starting up. Please give me a moment...',
                        'The system is updating. Intelligent replies are temporarily unavailable.'
                    ];
                    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                    chatInterface.addMessage('assistant', randomResponse);
                }, 1000);
            };
        }
        
        // Disable voice features but keep the interface usable
        micButton.disabled = true;
    }

    // --- Loading screen handling ---
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        // Hide it after the animation to prevent it from blocking interactions
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Show chat control panel
            const chatControlPanel = document.querySelector('.chat-control-panel');
            if (chatControlPanel) {
                chatControlPanel.classList.add('visible');
            }
        }, 500); // This time should match the transition time in CSS
    }, 1500); // Start fading out after 1.5 seconds

    let activeVideo = video1;
    let inactiveVideo = video2;

    // Video list
    const videoList = [
        'videos/3D2.mp4',
    ];

    // --- Crossfade video playback ---
    function switchVideo() {
        // 1. Choose next video
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        let nextVideoSrc = currentVideoSrc;
        while (nextVideoSrc === currentVideoSrc) {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            nextVideoSrc = videoList[randomIndex];
        }

        // 2. Set source on inactive video element
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        // 3. When inactive video can play, perform switch
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            // Ensure the event fires only once
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);

            // 4. Play new video
            inactiveVideo.play().catch(error => {
                console.error("Video play failed:", error);
            });

            // 5. Toggle active class to trigger CSS transition
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');

            // 6. Swap roles
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];

            // Bind ended event to new activeVideo
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true }); // Use { once: true } to ensure one-time handler
    }

    // Initial start
    activeVideo.addEventListener('ended', switchVideo, { once: true });
    
    // Chat control button events
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatTestBtn = document.getElementById('chat-test-btn');
    
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            if (chatInterface) {
                console.log('Chat button clicked');
                console.log('Before click chat visibility:', chatInterface.getVisibility());
                console.log('Before click chat container class name:', chatInterface.chatContainer.className);
                
                chatInterface.toggle();
                
                console.log('After click chat visibility:', chatInterface.getVisibility());
                console.log('After click chat container class name:', chatInterface.chatContainer.className);
                console.log('Chat interface toggled, current state:', chatInterface.getVisibility());
                
                const isVisible = chatInterface.getVisibility();
                chatToggleBtn.innerHTML = isVisible ? 
                    '<i class="fas fa-times"></i><span>Close</span>' : 
                    '<i class="fas fa-comments"></i><span>Chat</span>';
                console.log('Button label updated to:', chatToggleBtn.innerHTML);
            }
        });
    }
    
    if (chatTestBtn) {
        chatTestBtn.addEventListener('click', () => {
            if (chatInterface) {
                const testMessages = [
                    'Hello! I\'m Bella, nice to meet you!',
                    'The chat interface is working properly and all features are ready.',
                    'This is a test message to verify the interface.'
                ];
                const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
                chatInterface.addMessage('assistant', randomMessage);
                
                // If the chat interface is not visible, show it automatically
                if (!chatInterface.getVisibility()) {
                    chatInterface.show();
                    chatToggleBtn.innerHTML = '<i class="fas fa-times"></i><span>Close</span>';
                }
                
                console.log('Test message added:', randomMessage);
            }
        });
    }


    // --- Speech recognition core ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    // Check if the browser supports speech recognition
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Continuous recognition
        recognition.lang = 'zh-CN'; // Keep Chinese recognition language by default
        recognition.interimResults = true; // Get interim results

        recognition.onresult = async (event) => {
            const transcriptContainer = document.getElementById('transcript');
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            // Update interim results
            transcriptContainer.textContent = `You: ${final_transcript || interim_transcript}`;

            // Once we have a final result, process it with the AI
            if (final_transcript && bellaAI) {
                const userText = final_transcript.trim();
                transcriptContainer.textContent = `You: ${userText}`;

                if (chatInterface && chatInterface.getVisibility()) {
                    chatInterface.addMessage('user', userText);
                }

                try {
                    // Let Bella think
                    const thinkingText = document.createElement('p');
                    thinkingText.textContent = 'Bella is thinking...';
                    thinkingText.style.color = '#888';
                    thinkingText.style.fontStyle = 'italic';
                    transcriptContainer.appendChild(thinkingText);
                    
                    const response = await bellaAI.think(userText);
                    
                    transcriptContainer.removeChild(thinkingText);
                    const bellaText = document.createElement('p');
                    bellaText.textContent = `Bella: ${response}`;
                    bellaText.style.color = '#ff6b9d';
                    bellaText.style.fontWeight = 'bold';
                    bellaText.style.marginTop = '10px';
                    transcriptContainer.appendChild(bellaText);

                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', response);
                    }
                } catch (error) {
                    console.error('Bella AI processing error:', error);
                    const errorText = document.createElement('p');
                    const errorMsg = 'Bella ran into a problem, but she is still learning...';
                    errorText.textContent = errorMsg;
                    errorText.style.color = '#ff9999';
                    transcriptContainer.appendChild(errorText);
                    
                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', errorMsg);
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

    } else {
        console.log('Your browser does not support speech recognition.');
    }

    let isListening = false;

    micButton.addEventListener('click', function() {
        if (!SpeechRecognition) return; // If unsupported, do nothing

        isListening = !isListening;
        micButton.classList.toggle('is-listening', isListening);
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');

        if (isListening) {
            transcriptText.textContent = 'Listening...'; // Show hint immediately
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; 
        }
    });

});
