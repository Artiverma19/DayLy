document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    const navContent = document.getElementById('nav-content');
    const navTracker = document.getElementById('nav-tracker');
    const contentView = document.getElementById('content-view');
    const trackerView = document.getElementById('tracker-view');

    navContent.addEventListener('click', () => {
        navContent.classList.add('active');
        navTracker.classList.remove('active');
        contentView.classList.remove('hidden');
        trackerView.classList.add('hidden');
    });

    navTracker.addEventListener('click', () => {
        navTracker.classList.add('active');
        navContent.classList.remove('active');
        trackerView.classList.remove('hidden');
        contentView.classList.add('hidden');
        loadTasks();
    });

    // Content Studio Logic
    const generateBtn = document.querySelector('.generate-btn');
    const textarea = contentView.querySelector('textarea');
    const platformBtns = document.querySelectorAll('.platform-btn');
    const hashtagsCheckbox = document.getElementById('hashtags');
    const variationsCheckbox = document.getElementById('variations');

    const apiBase = (() => {
        if (window.location.protocol === 'file:') return 'http://localhost:3000';
        if (window.location.port && window.location.port !== '3000') return 'http://localhost:3000';
        return '';
    })();

    let selectedPlatform = 'linkedin';

    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platformBtns.forEach(b => b.style.transform = 'scale(1)');
            btn.style.transform = 'scale(1.1)';
            
            if (btn.classList.contains('linkedin')) selectedPlatform = 'linkedin';
            if (btn.classList.contains('twitter')) selectedPlatform = 'twitter';
            if (btn.classList.contains('instagram')) selectedPlatform = 'instagram';
            if (btn.classList.contains('email')) selectedPlatform = 'email';
        });
    });

    // Generated content toolbar removed per user request.

    generateBtn.addEventListener('click', async () => {
        const topic = textarea.value.trim();
        if (!topic) {
            alert('Please enter a topic first!');
            return;
        }

        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        try {
            const response = await fetch(`${apiBase}/api/content/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    topic: topic,
                    includeHashtags: hashtagsCheckbox.checked,
                    count: variationsCheckbox.checked ? 3 : 1
                })
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result?.error || 'Failed to generate content');
            }

            let outputBox = document.querySelector('.output-box');
            if (!outputBox) {
                outputBox = document.createElement('div');
                outputBox.className = 'output-box';
                contentView.querySelector('.main-card').appendChild(outputBox);
            }
            outputBox.innerHTML = '<h3>✨ Generated Output:</h3><div id="content-output"></div>';
            displayGeneratedContent(result.text || 'No content returned.');
        } catch (error) {
            console.error('Error:', error);
            alert(`Something went wrong connecting to the AI: ${error.message}`);
        } finally {
            generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate magic';
            generateBtn.disabled = false;
        }
    });

    // Task Tracker Logic
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskEnergy = document.getElementById('task-energy');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');

    async function loadTasks() {
        try {
            const res = await fetch(`${apiBase}/api/tracker/list`);
            const tasks = await res.json();
            
            taskList.innerHTML = '';
            if (tasks.length === 0) {
                taskList.innerHTML = '<li style="text-align: center; color: #b2bec3; padding: 15px;">No tasks yet. Add one above!</li>';
                return;
            }

            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item status-${task.status}`;

                let subtasksHtml = '';
                if (task.subtasks && task.subtasks.length > 0) {
                    subtasksHtml = `<div class="subtasks-container"><ul>${task.subtasks.map(st => `<li>${st}</li>`).join('')}</ul></div>`;
                }

                li.innerHTML = `
                    <div class="task-header-row">
                        <span class="task-title" style="${task.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.text}</span>
                        <div class="task-actions">
                            <select class="status-picker ${task.status}" onchange="updateStatus(${task.id}, this.value)">
                                <option value="not-started" ${task.status === 'not-started' ? 'selected' : ''}>Not Started</option>
                                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                            </select>
                            <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="task-sub-meta">
                        <span><i class="fa-solid fa-calendar"></i> ${task.date || 'No Date'}</span>
                        <span><i class="fa-solid fa-clock"></i> ${task.time || '--:--'}</span>
                        <span>⚡ ${task.energy}</span>
                    </div>
                    <button class="ai-breakdown-btn" onclick="breakdownTask(${task.id})"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Breakdown</button>
                    ${subtasksHtml}
                `;
                taskList.appendChild(li);
            });
        } catch (err) {
            console.error('Failed to load tasks', err);
        }
    }

    async function handleAddTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        try {
            await fetch(`${apiBase}/api/tracker/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    date: taskDate.value,
                    time: taskTime.value,
                    energy: taskEnergy.value,
                    status: 'not-started'
                })
            });

            taskInput.value = '';
            taskDate.value = '';
            taskTime.value = '';
            loadTasks();
        } catch (err) {
            console.error('Failed to add task', err);
        }
    }

    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    // Global helper functions for inline buttons
    window.deleteTask = async function(id) {
        await fetch(`${apiBase}/api/tracker/delete/${id}`, { method: 'DELETE' });
        loadTasks();
    };

    window.updateStatus = async function(id, status) {
        await fetch(`${apiBase}/api/tracker/status/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadTasks();
    };

    window.breakdownTask = async function(id) {
        const btn = event.target;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Breaking down...';
        await fetch(`${apiBase}/api/tracker/breakdown/${id}`, { method: 'POST' });
        loadTasks();
    };

    // Pomodoro Timer Logic
    // --- Upgraded Lofi Timer Logic ---
    let pomoSeconds = 25 * 60; // Default to 25 mins
    let pomoInterval = null;
    let isRunning = false;
    
    // Connect our JS to the HTML elements
    const pomoDisplay = document.getElementById('pomo-time');
    const pomoStartBtn = document.getElementById('pomo-start');
    const pomoResetBtn = document.getElementById('pomo-reset');
    const pomoInput = document.getElementById('pomo-input');
    const lofiAudio = document.getElementById('lofi-audio');
    lofiAudio.volume = 0.75;
    // Math function to format seconds into MM:SS
    function updatePomoDisplay() {
        const mins = Math.floor(pomoSeconds / 60);
        const secs = pomoSeconds % 60;
        pomoDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Listen for the user typing a custom time
    pomoInput.addEventListener('input', () => {
        if (!isRunning) { 
            let customMins = parseInt(pomoInput.value);
            // Prevent users from typing negative numbers or letters
            if (isNaN(customMins) || customMins < 1) customMins = 1; 
            pomoSeconds = customMins * 60;
            updatePomoDisplay();
        }
    });
    // Play/Pause Button Logic
    pomoStartBtn.addEventListener('click', () => {
        if (isRunning) {
            // ACTION: User clicked PAUSE
            clearInterval(pomoInterval);
            isRunning = false;
            pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            pomoStartBtn.classList.remove('active');
            lofiAudio.pause(); // Stop the music
        } else {
            // ACTION: User clicked PLAY
            isRunning = true;
            pomoStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            pomoStartBtn.classList.add('active');
            lofiAudio.play(); // Start the music
            
            // Start subtracting 1 second every 1000 milliseconds
            pomoInterval = setInterval(() => {
                if (pomoSeconds > 0) {
                    pomoSeconds--;
                    updatePomoDisplay();
                } else {
                    // ACTION: Timer reached ZERO
                    clearInterval(pomoInterval);
                    isRunning = false;
                    lofiAudio.pause(); // Stop music when done
                    
                    alert('Focus session complete! Time to stretch and hydrate.');
                    
                    // Automatically reset the timer to the user's input time
                    pomoSeconds = parseInt(pomoInput.value) * 60;
                    updatePomoDisplay();
                    pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }, 1000);
        }
    });

    // Reset Button Logic
    pomoResetBtn.addEventListener('click', () => {
        clearInterval(pomoInterval);
        isRunning = false;
        
        // Reset timer based on what is typed in the input box
        let customMins = parseInt(pomoInput.value);
        if (isNaN(customMins) || customMins < 1) customMins = 25;
        pomoSeconds = customMins * 60;
        
        updatePomoDisplay();
        pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        pomoStartBtn.classList.remove('active');
        
        // Stop and rewind the music
            lofiAudio.pause();
            lofiAudio.currentTime = 0; 
        });

        // --- Dynamic Streak Tracker Logic ---
    function updateStreak() {
        const streakCountElement = document.getElementById('streak-count');
        const streakBadgeElement = document.getElementById('streak-badge');

        // Get today's date and set the time exactly to midnight for accurate day-to-day comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch stored data from the browser (defaults to 0 if none exists)
        let streak = parseInt(localStorage.getItem('dayly_streak')) || 0;
        let lastActive = localStorage.getItem('dayly_last_active');

        if (lastActive) {
            // Convert the stored timestamp back into a Date object
            const lastDate = new Date(parseInt(lastActive));
            lastDate.setHours(0, 0, 0, 0);

            // Calculate the difference in days
            const diffTime = today - lastDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // User logged in exactly the next day: Increase streak!
                streak++;
            } else if (diffDays > 1) {
                // User missed a day: Reset streak to 1
                streak = 1;
            }
            // If diffDays === 0, they already opened the app today, streak remains unchanged.
        } else {
            // First time ever opening the app
            streak = 1;
        }

        // Save the updated streak and today's timestamp back into the browser's local storage
        localStorage.setItem('dayly_streak', streak);
        localStorage.setItem('dayly_last_active', today.getTime());

        // Update the UI text
        if (streakCountElement) {
            streakCountElement.textContent = streak;
        }

        // Visual flair: Make the badge glow harder if the streak is greater than 3!
        if (streak >= 3 && streakBadgeElement) {
            streakBadgeElement.style.background = 'rgba(255, 118, 117, 0.2)';
            streakBadgeElement.style.color = '#d63031';
            streakBadgeElement.title = "You are on fire! 🔥";
        }
    }

    // Run the streak check immediately when the app loads
    updateStreak();

    // --- Native Browser Push Notification Logic ---
    const notifBtn = document.getElementById('notif-btn');

    // Check existing permission state on app load
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            notifBtn.classList.add('enabled');
            notifBtn.innerHTML = '<i class="fa-solid fa-bell"></i> Enabled';
        }
    }

    // Click handler to request permission from the browser
    notifBtn.addEventListener('click', () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications.");
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                notifBtn.classList.add('enabled');
                notifBtn.innerHTML = '<i class="fa-solid fa-bell"></i> Enabled';
                new Notification("DayLy Notifications Active! 🚀", {
                    body: "You will now receive desktop alerts when your study tasks are due.",
                    icon: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png"
                });
            } else {
                alert("Permission denied. You can enable notifications in your browser settings.");
            }
        });
    });

    // Background Interval: Check tasks against system clock every 10 seconds
    setInterval(() => {
        // Only run if notifications are permitted and tasks array exists
        if (Notification.permission !== "granted") return;
        if (typeof tasks === 'undefined' || !Array.isArray(tasks)) return;

        const now = new Date();
        const currentDateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`; // Format: HH:MM

        tasks.forEach(task => {
            // Check if task is scheduled for right now, isn't completed, and hasn't triggered yet
            if (task.date === currentDateStr && task.time === currentTimeStr && task.status !== 'Completed' && !task.notified) {
                
                // Trigger the native OS desktop notification
                new Notification("Task Due Now! ⏰", {
                    body: `Your task "${task.text}" requires your attention.`,
                    icon: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png"
                });

                // Mark as notified so it doesn't spam every 10 seconds during that minute
                task.notified = true;
            }
        });
    }, 10000); // 10,000 milliseconds = 10 seconds


    // Function to render the AI output with social share action buttons
    function displayGeneratedContent(aiText) {
        const outputContainer = document.getElementById('content-output');
        if (!outputContainer) return;

        function initAutoResize(textarea) {
            function resize() {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
            textarea.addEventListener('input', resize);
            setTimeout(resize, 0);
        }

        outputContainer.innerHTML = `
            <textarea id="editable-content-box" class="generated-textarea" rows="8"></textarea>
            <div class="social-share-container">
                <button onclick="shareToTwitter()" class="share-btn btn-twitter">
                    <i class="fa-brands fa-x-twitter"></i> Post to X
                </button>
                <button onclick="shareToLinkedIn()" class="share-btn btn-linkedin">
                    <i class="fa-brands fa-linkedin"></i> Share to LinkedIn
                </button>
                <button onclick="copyEditedContent()" class="share-btn btn-copy">
                    <i class="fa-regular fa-copy"></i> Copy Text
                </button>
            </div>
        `;

        const textBox = document.getElementById('editable-content-box');
        if (textBox) {
            textBox.value = aiText;
            initAutoResize(textBox);
        }
    }

    function getEditedText() {
        const textBox = document.getElementById('editable-content-box');
        return textBox ? textBox.value : '';
    }

    function shareToTwitter() {
        const text = getEditedText();
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }

    function shareToLinkedIn() {
        const text = getEditedText();
        const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
        window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    }

    function copyEditedContent() {
        const text = getEditedText();
        navigator.clipboard.writeText(text).then(() => {
            alert('Edited content copied to clipboard! Ready to paste.');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }


    window.displayGeneratedContent = displayGeneratedContent;
    window.getEditedText = getEditedText;
    window.shareToTwitter = shareToTwitter;
    window.shareToLinkedIn = shareToLinkedIn;
    window.copyEditedContent = copyEditedContent;

// Global helper function for copying text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Content copied to clipboard! Ready to paste.');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

window.copyToClipboard = copyToClipboard;

    });