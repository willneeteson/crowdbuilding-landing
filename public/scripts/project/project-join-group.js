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

    // Add email visibility checkbox
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
    emailLabel.textContent = 'Admin can see your email';
    emailLabel.className = 'email-visibility-label';
    
    emailVisibilityDiv.appendChild(emailCheckbox);
    emailVisibilityDiv.appendChild(emailLabel);
    formContainer.appendChild(emailVisibilityDiv);
    
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
            throw new Error('Authentication required. Please log in to continue.');
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

        // Ensure we have at least one answer
        if (Object.keys(formattedAnswers).length === 0) {
            throw new Error('No answers provided');
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
    const joinButton = document.querySelector('.join-group-button');
    if (joinButton) {
        if (isJoined) {
            joinButton.textContent = 'Je bent lid';
            joinButton.classList.add('joined');
            joinButton.disabled = true;
        } else {
            joinButton.textContent = 'Aanmelden interesselijst';
            joinButton.classList.remove('joined');
            joinButton.disabled = false;
        }
    }
}

// Function to fetch group data and questions
async function fetchGroupData() {
    try {
        // Get API token from auth module
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            throw new Error('Authentication required. Please log in to continue.');
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
    const joinButton = document.querySelector('.join-group-button');
    if (joinButton) {
        joinButton.disabled = true;
        joinButton.textContent = 'Laden...';
    }
    try {
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            if (joinButton) {
                joinButton.disabled = false;
                joinButton.textContent = 'Aanmelden interesselijst';
            }
            return;
        }

        // Get group ID from URL
        const groupId = getGroupId();

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        // Call the group API to get membership info
        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${groupId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            // Use is_member boolean from data.data
            if (data.data && data.data.is_member) {
                updateGroupUI(true);
            } else {
                updateGroupUI(false);
            }
        } else {
            updateGroupUI(false);
        }
    } catch (error) {
        console.error('Error checking membership status:', error);
        updateGroupUI(false);
    }
}

// Event listener for join button
document.addEventListener('DOMContentLoaded', async () => {
    await checkMembershipStatus();
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
                console.log('Fetched group data:', groupData);
                
                // Create form
                const form = document.createElement('form');
                
                // Add informational text
                const infoText = document.createElement('p');
                infoText.className = 'group-join-info';
                infoText.textContent = 'Door je aan te melden wordt je toegevoegd aan de groepschat en ontvang je updates over dit project. Initiatiefnemers kunnen contact met je opnemen en je contactgegevens en publieke informatie bekijken.';
                form.appendChild(infoText);
                
                // Add questions to form if they exist
                if (groupData.questions && groupData.questions.length > 0) {
                    console.log('Creating questions form with questions:', groupData.questions);
                    const questionsForm = createQuestionForm(groupData.questions);
                    form.appendChild(questionsForm);
                } else {
                    console.log('No questions found in group data');
                }
                
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.textContent = 'Verstuur';
                submitButton.className = 'submit-button';
                
                form.appendChild(submitButton);
                
                // Wait for modal system and create modal with form
                const modalSystem = await window.waitForModalSystem();
                const modalContent = `
                    <div class="cb-modal-body">
                        ${form.outerHTML}
                    </div>
                `;
                modalSystem.createModal('Aanmelden interesselijst', modalContent, { id: 'joinGroupModal' });
                modalSystem.showModal('joinGroupModal');

                // Set up form submission handler after modal is created
                const modalForm = document.querySelector('#joinGroupModal form');
                if (modalForm) {
                    modalForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        try {
                            // Validate required fields
                            const requiredInputs = modalForm.querySelectorAll('[required]');
                            let isValid = true;
                            requiredInputs.forEach(input => {
                                if (!input.value.trim()) {
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

// Add some basic modal styles
const style = document.createElement('style');
style.textContent = `
    /* Modal structure styles */
    .cb-modal-content {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        height: auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        padding: 0;
    }

    .cb-modal-header {
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
        padding: 20px 24px;
        border-bottom: 1px solid #e0e0e0;
    }

    .cb-modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        -webkit-overflow-scrolling: touch;
    }

    /* Form and content styles */
    .group-join-info {
        background-color: #f8f9fa;
        padding: 20px;
        margin: 0 0 28px;
        border-radius: 12px;
        color: #090F3F;
        font-size: 0.95em;
        line-height: 1.6;
    }
    
    .completion-message {
        text-align: center;
        padding: 40px 24px;
        margin: 0;
    }
    
    .completion-message h3 {
        color: #FF5C54;
        margin-bottom: 16px;
        font-size: 1.5em;
        font-weight: 600;
    }
    
    .completion-message p {
        color: #090F3F;
        font-size: 1.1em;
        line-height: 1.6;
        max-width: 400px;
        margin: 0 auto;
    }
    
    /* Question Form Styles */
    .question-container {
        margin-bottom: 24px;
        padding: 0;
    }
    
    .question-container:last-child {
        margin-bottom: 0;
    }
    
    .question-container label {
        display: block;
        margin-bottom: 8px;
        color: #090F3F;
        font-weight: 500;
    }
    
    .question-explanation {
        color: #090F3F;
        margin: 8px 0 12px;
        font-size: 0.9em;
        line-height: 1.5;
    }
    
    .question-input {
        width: 100%;
        padding: 12px;
        margin-top: 6px;
        border: 1.5px solid #e0e0e0;
        border-radius: 8px;
        transition: all 0.2s ease;
        font-size: 15px;
    }
    
    .question-input:focus {
        border-color: #4CAF50;
        outline: none;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }
    
    .question-input.error {
        border-color: #ff4444;
        background-color: #fff8f8;
    }
    
    .question-input.error:focus {
        box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
    }
    
    .email-visibility-container {
        margin: 24px 0;
        padding: 16px;
        background-color: #f8f9fa;
        border-radius: 12px;
        border: 1.5px solid #e0e0e0;
    }
    
    .email-visibility-container label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
    }
    
    .email-visibility-checkbox {
        width: 18px;
        height: 18px;
        margin: 0;
    }
    
    .submit-button {
        background-color: #FF5C54;
        color: white;
        padding: 14px 24px;
        border: none;
        border-radius: 99px;
        cursor: pointer;
        width: 100%;
        margin: 24px 0 0;
        transition: all 0.2s ease;
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.3px;
    }
    
    .submit-button:hover:not(:disabled) {
        background-color: #ff4f47;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 92, 84, 0.2);
    }
    
    .submit-button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: none;
    }
    
    .submit-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        opacity: 0.8;
    }
    
    /* Responsive adjustments */
    @media (max-width: 480px) {
        .cb-modal-content {
            max-height: 100vh;
            border-radius: 0;
        }

        .cb-modal-body {
            padding: 20px;
        }

        .group-join-info {
            margin-top: 0;
        }
    }

    .email-visibility-label {
        color: #090F3F;
    }
`;
document.head.appendChild(style);
