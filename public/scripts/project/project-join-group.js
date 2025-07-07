// Get group ID from URL
function getGroupId() {
    const pathParts = window.location.pathname.split('/');
    const groupSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!groupSlug) {
        console.error('No group slug found in URL');
        throw new Error('No group found in URL');
    }
    
    return groupSlug;
}

const API_BASE_URL = 'https://api.crowdbuilding.com';

// Function to get CSRF token
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
        console.warn('CSRF token meta tag not found');
        return '';
    }
    return metaTag.getAttribute('content') || '';
}

// Function to create question form
function createQuestionForm(questions) {
    console.log('Creating form for questions:', questions.map(q => ({
        id: q.id,
        question_id: q.question_id,
        title: q.title,
        question: q.question,
        required: q.required
    })));
    
    const formContainer = document.createElement('div');
    formContainer.className = 'group-questions-form';
    
    if (!Array.isArray(questions) || questions.length === 0) {
        console.log('No questions to display');
        return formContainer;
    }
    
    questions.forEach((question, index) => {
        // Use the question's ID directly
        const questionId = question.id || question.question_id;
        console.log(`Setting up question with ID: ${questionId}`, {
            id: question.id,
            question_id: question.question_id,
            title: question.title,
            question: question.question,
            required: question.required
        });
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const label = document.createElement('label');
        label.textContent = question.title || question.question;
        if (question.required) {
            label.innerHTML += ' <span class="required">*</span>';
        }
        
        const explanation = document.createElement('p');
        explanation.className = 'question-explanation';
        explanation.textContent = question.explanation || '';
        
        let input;
        if (question.type === 'multiple_choice' || question.question_type === 'multiple_choice') {
            input = document.createElement('select');
            input.required = question.required;
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select an option';
            input.appendChild(emptyOption);
            
            // Add question answers as options
            const options = question.options || question.question_answers || [];
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.answer || option;
                optionElement.textContent = option.answer || option;
                input.appendChild(optionElement);
            });
        } else {
            input = document.createElement('textarea');
            input.required = question.required;
            input.rows = 3;
            input.placeholder = 'Antwoord';
        }
        
        // Use the exact question ID from the API
        input.name = questionId;  // Don't prefix with 'question_'
        input.id = questionId;    // Use the same ID
        input.className = 'question-input';
        
        questionDiv.appendChild(label);
        questionDiv.appendChild(explanation);
        questionDiv.appendChild(input);
        formContainer.appendChild(questionDiv);
    });
    
    return formContainer;
}

// Function to show loading state
function setLoading(isLoading) {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Laden...' : 'Verstuur';
    }
}

// Function to show notifications
function showNotification(type, message) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Function to handle joining a group
async function joinGroup(answers = {}) {
    try {
        setLoading(true);
        
        // Get API token from auth module
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            throw new Error('Authenticatie vereist. Log in om verder te gaan.');
        }

        // Get group ID from URL
        const groupId = getGroupId();

        // Format answers into the expected structure
        const formattedAnswers = Object.entries(answers)
            .filter(([name]) => name !== 'email_visibility') // Exclude email visibility from answers
            .reduce((acc, [name, value]) => {
                // Extract the question ID from the input name (e.g., "question_123" -> "123")
                const questionId = name.replace('question_', '');
                acc[questionId] = value || '';
                return acc;
            }, {});

        // Only check for answers if there are questions in the form
        const questionsExist = document.querySelector('.group-questions-form')?.children.length > 0;
        if (questionsExist && Object.keys(formattedAnswers).length === 0) {
            throw new Error('Geen antwoorden gegeven');
        }

        console.log('Raw answers before formatting:', answers);
        console.log('Formatted answers for API:', formattedAnswers);

        const requestBody = {
            answers: formattedAnswers
        };

        console.log('Final request body:', JSON.stringify(requestBody, null, 2));

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        console.log('Making request to:', `${API_BASE_URL}/api/v1/groups/${groupId}/join`);
        console.log('With headers:', headers);
        console.log('With body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${groupId}/join`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Error response:', errorData);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            if (errorData.errors) {
                // Handle validation errors
                const errorMessages = Object.values(errorData.errors).flat();
                throw new Error(errorMessages.join('. '));
            }
            throw new Error(errorData.message || `Failed to join group: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success response:', data);

        // Get modal system and close the join modal
        const modalSystem = await window.waitForModalSystem();
        modalSystem.closeModal('joinGroupModal');

        // Show completion modal
        const completionContent = `
            <div class="cb-modal-body">
                <div class="completion-message">
                    <h3>Dank voor je aanmelding!</h3>
                    <p>We hebben je verzoek verstuurd. Je ontvangt een bericht als je bent toegelaten.</p>
                </div>
            </div>
        `;
        modalSystem.createModal('Aanmelding verstuurd', completionContent, { id: 'completionModal' });
        modalSystem.showModal('completionModal');

        // Update UI to reflect joined status
        updateGroupUI(true);

        return data;
    } catch (error) {
        console.error('Error joining group:', error);
        showNotification('error', error.message || 'Failed to join group');
        throw error;
    } finally {
        setLoading(false);
    }
}

// Function to update UI elements after joining
function updateGroupUI(isJoined) {
    // This function is kept for backward compatibility but now uses the new membership-based logic
    console.log('updateGroupUI called with isJoined:', isJoined);
    
    // Instead of manually setting button state, trigger a refresh of the membership-based state
    initializeButtonState();
}

// Function to fetch group data and questions
async function fetchGroupData() {
    try {
        // Get API token from auth module
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            return null; // Return null instead of throwing error
        }

        // Get group ID from URL
        const groupId = getGroupId();

        console.log('Fetching questions with token:', apiToken);

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        console.log('Making request to:', `${API_BASE_URL}/api/v1/groups/${groupId}/members/questions`);
        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${groupId}/members/questions`, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            console.log('Response content type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                throw new Error(errorData.message || `Failed to fetch group questions: ${response.status}`);
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Failed to fetch group questions: ${response.status} - Server returned non-JSON response`);
            }
        }

        const data = await response.json();
        console.log('Raw response data:', data);
        
        // The questions might be directly in the data array
        const questions = Array.isArray(data) ? data : (data.data || []);
        console.log('Processed questions:', questions.map(q => ({
            id: q.id,
            question_id: q.question_id,
            title: q.title,
            question: q.question,
            required: q.required
        })));
        
        return { questions };
    } catch (error) {
        console.error('Error fetching group questions:', error);
        showNotification('error', error.message || 'Failed to load group questions');
        throw error;
    }
}

// Function to check membership status and update UI
async function checkMembershipStatus() {
    console.log('checkMembershipStatus called - using new membership-based logic');
    
    // This function is kept for backward compatibility but now uses the new membership-based logic
    // The actual membership checking and UI updating is now handled by initializeButtonState()
    await initializeButtonState();
}

// Function to get expected button text based on membership
function getExpectedButtonText(membership) {
    if (membership && membership.id) {
        if (membership.role === 'applicant') {
            return 'In behandeling';
        } else {
            return 'Aangemeld';
        }
    } else {
        return 'Aanmelden interesselijst';
    }
}

// Function to update button state based on membership
function updateButtonState(joinButton, membership) {
    console.log('=== UPDATING BUTTON STATE ===');
    console.log('Membership:', membership);
    console.log('Button before update:', {
        text: joinButton.textContent,
        innerHTML: joinButton.innerHTML,
        classes: joinButton.className
    });
    
    if (membership && membership.id) {
        if (membership.role === 'applicant') {
            joinButton.innerHTML = 'In behandeling';
            joinButton.textContent = 'In behandeling';
            joinButton.classList.add('joined');
            joinButton.style.pointerEvents = 'none';
            joinButton.style.cursor = 'not-allowed';
            joinButton.href = 'javascript:void(0)';
            console.log('Set to applicant state');
        } else {
            joinButton.innerHTML = 'Aangemeld';
            joinButton.textContent = 'Aangemeld';
            joinButton.classList.add('joined');
            joinButton.style.pointerEvents = 'none';
            joinButton.style.cursor = 'not-allowed';
            joinButton.href = 'javascript:void(0)';
            console.log('Set to member state');
        }
    } else {
        joinButton.innerHTML = 'Aanmelden interesselijst';
        joinButton.textContent = 'Aanmelden interesselijst';
        joinButton.classList.remove('joined');
        joinButton.style.pointerEvents = 'auto';
        joinButton.style.cursor = 'pointer';
        joinButton.href = '#';
        console.log('Set to non-member state');
    }
    
    console.log('Button after update:', {
        text: joinButton.textContent,
        innerHTML: joinButton.innerHTML,
        classes: joinButton.className
    });
    
    // Update group chat button visibility based on membership
    updateGroupChatButtonVisibility(membership);
    
    // Update like button visibility based on membership
    updateLikeButtonVisibility(membership);
}

// Function to update group chat button visibility based on membership
function updateGroupChatButtonVisibility(membership) {
    console.log('=== UPDATING GROUP CHAT BUTTON VISIBILITY ===');
    console.log('Membership for group chat button:', membership);
    
    const groupChatButton = document.querySelector('#buttonGroupChat');
    
    if (!groupChatButton) {
        console.log('Group chat button (#buttonGroupChat) not found');
        return;
    }
    
    // Show button if user is a member (not just an applicant)
    if (membership && membership.id && membership.role !== 'applicant') {
        groupChatButton.style.display = 'block';
        groupChatButton.style.visibility = 'visible';
        console.log('Showing group chat button - user is a member');
    } else {
        groupChatButton.style.display = 'none';
        groupChatButton.style.visibility = 'hidden';
        console.log('Hiding group chat button - user is not a member or is an applicant');
    }
}

// Function to update like button visibility based on membership
function updateLikeButtonVisibility(membership) {
    console.log('=== UPDATING LIKE BUTTON VISIBILITY ===');
    console.log('Membership for like button:', membership);
    
    const likeButton = document.querySelector('#buttonLike');
    
    if (!likeButton) {
        console.log('Like button (#buttonLike) not found');
        return;
    }
    
    // Hide button if user is a member (not just an applicant), otherwise show it
    if (membership && membership.id && membership.role !== 'applicant') {
        likeButton.style.display = 'none';
        likeButton.style.visibility = 'hidden';
        console.log('Hiding like button - user is a member');
    } else {
        likeButton.style.display = 'flex';
        likeButton.style.visibility = 'visible';
        console.log('Showing like button - user is not a member or is an applicant');
    }
}

// Function to update join button with membership data
function updateJoinButton(membership) {
    console.log('Updating join button with membership:', membership);
    
    // Try multiple selectors to find the button (now handles both button and a tags)
    let joinButton = document.querySelector('.join-group-button');
    if (!joinButton) {
        joinButton = document.querySelector('[data-ms-content="members"] .join-group-button');
    }
    if (!joinButton) {
        joinButton = document.querySelector('.group-join-section .join-group-button');
    }
    if (!joinButton) {
        joinButton = document.querySelector('a.join-group-button');
    }
    
    console.log('Found join button:', joinButton);
    if (!joinButton) {
        console.log('No join button found, trying again in 500ms...');
        setTimeout(() => updateJoinButton(membership), 500);
        return;
    }
    
    updateButtonState(joinButton, membership);
    
    // Also update group chat button visibility directly in case join button is not found
    updateGroupChatButtonVisibility(membership);
    
    // Also update like button visibility directly in case join button is not found
    updateLikeButtonVisibility(membership);
}

// Function to temporarily set button to pending state after join
function setButtonToPending() {
    console.log('Setting button to pending state after join...');
    
    // Set global flag to prevent monitoring from overriding
    window.isJoiningGroup = true;
    
    const joinButton = document.querySelector('.join-group-button') || 
                      document.querySelector('[data-ms-content="members"] .join-group-button') ||
                      document.querySelector('.group-join-section .join-group-button') ||
                      document.querySelector('a.join-group-button');
    
    if (joinButton) {
        // Set pending state with data attribute to make it more persistent
        joinButton.setAttribute('data-pending-join', 'true');
        updateButtonState(joinButton, { id: 'temp', role: 'applicant' });
    }
}

// Function to set up continuous button monitoring
function setupButtonMonitoring(membership) {
    console.log('Setting up continuous button monitoring for membership:', membership);
    
    // Clear any existing monitoring
    if (window.buttonMonitoringInterval) {
        clearInterval(window.buttonMonitoringInterval);
    }
    
    // Set up continuous checking every 500ms
    const intervalId = setInterval(() => {
        // Skip monitoring if we're in the middle of a join process
        if (window.isJoiningGroup) {
            console.log('Skipping button monitoring during join process');
            return;
        }
        
        const joinButton = document.querySelector('.join-group-button') || 
                          document.querySelector('[data-ms-content="members"] .join-group-button') ||
                          document.querySelector('.group-join-section .join-group-button') ||
                          document.querySelector('a.join-group-button');
        
        if (joinButton) {
            // Don't override if button is in pending join state
            if (joinButton.getAttribute('data-pending-join') === 'true') {
                console.log('Button is in pending join state, skipping monitoring');
                return;
            }
            
            const expectedText = getExpectedButtonText(membership);
            const currentText = joinButton.textContent.trim();
            
            if (currentText !== expectedText) {
                console.log('Button text mismatch detected:', currentText, '->', expectedText);
                console.log('Current button state:', {
                    text: currentText,
                    expected: expectedText,
                    membership: membership
                });
                updateButtonState(joinButton, membership);
            }
        }
    }, 500);
    
    // Store the interval ID so we can clear it later if needed
    window.buttonMonitoringInterval = intervalId;
    
    console.log('Continuous button monitoring set up');
}

// Function to get membership data from project details
async function getProjectMembership() {
    try {
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            return null;
        }

        const groupId = getGroupId();
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${groupId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Project membership data:', data.data?.membership);
            return data.data?.membership || null;
        }
    } catch (error) {
        console.error('Error fetching project membership:', error);
    }
    return null;
}

// Initialize button state management
async function initializeButtonState() {
    console.log('=== INITIALIZING BUTTON STATE ===');
    const membership = await getProjectMembership();
    console.log('Membership data for button:', membership);
    
    if (membership) {
        updateJoinButton(membership);
        setupButtonMonitoring(membership);
    } else {
        updateJoinButton(null);
        setupButtonMonitoring(null);
        // Ensure group chat button is hidden when no membership
        updateGroupChatButtonVisibility(null);
        
        // Ensure like button is shown when no membership
        updateLikeButtonVisibility(null);
    }
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize button state management
    await initializeButtonState();
    
    // Existing membership status check (keep for backward compatibility)
    await checkMembershipStatus();
    
    // Rest of the existing code...
    const joinButton = document.querySelector('.join-group-button');
    if (joinButton) {
        joinButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Disable join button while loading
                joinButton.disabled = true;
                joinButton.textContent = 'Loading...';
                
                // Fetch group data and questions
                const groupData = await fetchGroupData();
                if (!groupData) {
                    throw new Error('Authenticatie vereist. Log in om verder te gaan.');
                }
                console.log('Fetched group data:', groupData);
                
                // Create form
                const form = document.createElement('form');
                
                // Add questions to form if they exist
                if (groupData.questions && groupData.questions.length > 0) {
                    console.log('Creating questions form with questions:', groupData.questions);
                    const questionsForm = createQuestionForm(groupData.questions);
                    form.appendChild(questionsForm);
                } else {
                    console.log('No questions found in group data');
                }

                // Add email visibility container after questions
                const emailVisibilityDiv = document.createElement('div');
                emailVisibilityDiv.className = 'email-visibility-container';
                
                const emailCheckbox = document.createElement('input');
                emailCheckbox.type = 'checkbox';
                emailCheckbox.id = 'email_visibility';
                emailCheckbox.name = 'email_visibility';
                emailCheckbox.required = true;
                emailCheckbox.className = 'email-visibility-checkbox';
                
                const emailLabel = document.createElement('label');
                emailLabel.htmlFor = 'email_visibility';
                emailLabel.textContent = 'Ja, ik meld me aan voor deze groep, de groepschat en updates over dit project. Ik ga ermee akkoord dat initiatiefnemers contact met me kunnen opnemen en mijn contactgegevens en publieke informatie kunnen bekijken.';
                emailLabel.className = 'email-visibility-label';
                
                emailVisibilityDiv.appendChild(emailCheckbox);
                emailVisibilityDiv.appendChild(emailLabel);
                form.appendChild(emailVisibilityDiv);
                
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.textContent = 'Verstuur';
                submitButton.className = 'submit-button';
                submitButton.disabled = true; // Start disabled
                
                form.appendChild(submitButton);

                // Wait for modal system and create modal with form
                const modalSystem = await window.waitForModalSystem();
                const modalContent = `${form.outerHTML}`;
                modalSystem.createModal('Aanmelden interesselijst', modalContent, { id: 'joinGroupModal' });
                modalSystem.showModal('joinGroupModal');

                // Set up form submission handler and checkbox listener after modal is created
                const modalForm = document.querySelector('#joinGroupModal form');
                if (modalForm) {
                    const modalSubmitButton = modalForm.querySelector('.submit-button');
                    const modalCheckbox = modalForm.querySelector('#email_visibility');
                    
                    // Ensure submit button starts disabled
                    if (modalSubmitButton) {
                        modalSubmitButton.disabled = true;
                    }
                    
                    // Add checkbox listener to control submit button
                    modalCheckbox.addEventListener('change', (e) => {
                        if (modalSubmitButton) {
                            modalSubmitButton.disabled = !e.target.checked;
                        }
                    });

                    modalForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        try {
                            // Validate required fields
                            const requiredInputs = modalForm.querySelectorAll('[required]');
                            let isValid = true;
                            requiredInputs.forEach(input => {
                                if (!input.value.trim() && input.type !== 'checkbox') {
                                    isValid = false;
                                    input.classList.add('error');
                                } else if (input.type === 'checkbox' && !input.checked) {
                                    isValid = false;
                                    input.classList.add('error');
                                } else {
                                    input.classList.remove('error');
                                }
                            });
                            if (!isValid) {
                                showNotification('error', 'Please fill in all required fields');
                                return;
                            }
                            // Collect answers
                            const answers = {};
                            const inputs = modalForm.querySelectorAll('input, select, textarea');
                            inputs.forEach(input => {
                                if (input.name) {
                                    if (input.type === 'checkbox') {
                                        answers[input.name] = input.checked ? 'on' : 'off';
                                    } else {
                                        answers[input.name] = input.value.trim();
                                    }
                                }
                            });
                            // Submit join request
                            await joinGroup(answers);
                            
                            // Immediately set button to pending state
                            console.log('Join request successful, setting pending state...');
                            setButtonToPending();
                            
                            // Wait a moment for the API to process the join request
                            console.log('Waiting for API to update...');
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Update button state after successful join
                            console.log('Updating button state after join...');
                            
                            // Clear the joining flag and pending state
                            window.isJoiningGroup = false;
                            const joinButton = document.querySelector('.join-group-button') || 
                                              document.querySelector('[data-ms-content="members"] .join-group-button') ||
                                              document.querySelector('.group-join-section .join-group-button') ||
                                              document.querySelector('a.join-group-button');
                            if (joinButton) {
                                joinButton.removeAttribute('data-pending-join');
                            }
                            
                            await initializeButtonState();
                        } catch (error) {
                            console.error('Form submission error:', error);
                            showNotification('error', error.message || 'Failed to submit form');
                        }
                    });
                }
                
                // Reset join button state
                joinButton.disabled = false;
                joinButton.textContent = 'Aanmelden interesselijst';
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('error', error.message || 'Failed to load group questions');
                joinButton.disabled = false;
                joinButton.textContent = 'Aanmelden interesselijst';
            }
        });
    } else {
        console.log('Join button not found');
    }
});
