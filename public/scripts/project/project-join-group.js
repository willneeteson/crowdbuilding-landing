// Hardcoded group ID
const GROUP_ID = 'tiny-house-alkmaar';
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
    console.log('Creating form for questions:', questions);
    
    const formContainer = document.createElement('div');
    formContainer.className = 'group-questions-form';
    
    if (!Array.isArray(questions) || questions.length === 0) {
        console.log('No questions to display');
        return formContainer;
    }
    
    questions.forEach((question, index) => {
        console.log('Creating question:', question);
        
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
            input.placeholder = 'Type your answer here...';
        }
        
        // Use the question's ID directly
        const questionId = question.id || question.question_id;
        console.log(`Setting up question with ID: ${questionId}`, question);
        
        input.name = `question_${questionId}`;
        input.id = `question_${questionId}`;
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
    
    console.log('Created form container:', formContainer);
    return formContainer;
}

// Function to show loading state
function setLoading(isLoading) {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Loading...' : 'Submit';
    }
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

        // Collect answers
        const answers = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        console.log('Found form inputs:', Array.from(inputs).map(input => ({
            name: input.name,
            type: input.type,
            value: input.value,
            required: input.required
        })));
        
        inputs.forEach(input => {
            if (input.name) {
                // Handle checkbox inputs differently
                if (input.type === 'checkbox') {
                    answers[input.name] = input.checked ? 'on' : 'off';
                } else {
                    const value = input.value.trim();
                    answers[input.name] = value;
                    console.log(`Setting answer for ${input.name}:`, value);
                }
            }
        });
        console.log('Collected answers:', answers);

        // Format answers into the expected structure
        const formattedAnswers = Object.entries(answers)
            .filter(([name]) => name !== 'email_visibility') // Exclude email visibility from answers
            .map(([name, value]) => {
                const questionId = name.replace('question_', '');
                console.log(`Formatting answer for question ${questionId}:`, value);
                return {
                    question_id: parseInt(questionId),
                    answer: value
                };
            });

        console.log('Raw answers before formatting:', answers);
        console.log('Formatted answers for API:', formattedAnswers);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        const requestBody = {
            answers: formattedAnswers,
            email_visibility: answers.email_visibility === 'on'
        };

        console.log('Final request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${GROUP_ID}/join`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Error response:', errorData);
            if (errorData.errors) {
                // Handle validation errors
                const errorMessages = Object.values(errorData.errors).flat();
                throw new Error(errorMessages.join('. '));
            }
            throw new Error(errorData.message || `Failed to join group: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success response:', data);

        // Handle successful join
        if (data.message) {
            showNotification('success', data.message);
        }

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
            joinButton.textContent = 'Joined';
            joinButton.classList.add('joined');
            joinButton.disabled = true;
        } else {
            joinButton.textContent = 'Join Group';
            joinButton.classList.remove('joined');
            joinButton.disabled = false;
        }
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

// Function to fetch group data and questions
async function fetchGroupData() {
    try {
        // Get API token from auth module
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            throw new Error('Authentication required. Please log in to continue.');
        }

        console.log('Fetching questions with token:', apiToken);

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        console.log('Making request to:', `${API_BASE_URL}/api/v1/groups/${GROUP_ID}/members/questions`);
        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${GROUP_ID}/members/questions`, {
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
        console.log('Processed questions:', questions);
        
        return { questions };
    } catch (error) {
        console.error('Error fetching group questions:', error);
        showNotification('error', error.message || 'Failed to load group questions');
        throw error;
    }
}

// Event listener for join button
document.addEventListener('DOMContentLoaded', async () => {
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
                
                // Create modal
                const modal = document.createElement('div');
                modal.className = 'modal';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                
                const closeButton = document.createElement('span');
                closeButton.className = 'close-button';
                closeButton.innerHTML = '&times;';
                closeButton.onclick = () => {
                    modal.remove();
                    joinButton.disabled = false;
                    joinButton.textContent = 'Join Group';
                };
                
                const title = document.createElement('h2');
                title.textContent = 'Join Group';
                
                const form = document.createElement('form');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    
                    try {
                        // Validate required fields
                        const requiredInputs = form.querySelectorAll('[required]');
                        let isValid = true;
                        requiredInputs.forEach(input => {
                            if (!input.value.trim()) {
                                isValid = false;
                                input.classList.add('error');
                                console.log('Missing required field:', input.name);
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
                        const inputs = form.querySelectorAll('input, select, textarea');
                        console.log('Found form inputs:', Array.from(inputs).map(input => ({
                            name: input.name,
                            type: input.type,
                            value: input.value,
                            required: input.required
                        })));
                        
                        inputs.forEach(input => {
                            if (input.name) {
                                // Handle checkbox inputs differently
                                if (input.type === 'checkbox') {
                                    answers[input.name] = input.checked ? 'on' : 'off';
                                } else {
                                    const value = input.value.trim();
                                    answers[input.name] = value;
                                    console.log(`Setting answer for ${input.name}:`, value);
                                }
                            }
                        });
                        console.log('Collected answers:', answers);
                        
                        // Submit join request
                        await joinGroup(answers);
                        modal.remove();
                    } catch (error) {
                        console.error('Form submission error:', error);
                        showNotification('error', error.message || 'Failed to submit form');
                    }
                };
                
                // Add questions to form
                if (groupData.questions && groupData.questions.length > 0) {
                    console.log('Creating questions form with questions:', groupData.questions);
                    const questionsForm = createQuestionForm(groupData.questions);
                    form.appendChild(questionsForm);
                } else {
                    console.log('No questions found in group data');
                }
                
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.textContent = 'Submit';
                submitButton.className = 'submit-button';
                
                form.appendChild(submitButton);
                
                modalContent.appendChild(closeButton);
                modalContent.appendChild(title);
                modalContent.appendChild(form);
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                
                // Reset join button state
                joinButton.disabled = false;
                joinButton.textContent = 'Join Group';
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('error', error.message || 'Failed to load group questions');
                joinButton.disabled = false;
                joinButton.textContent = 'Join Group';
            }
        });
    } else {
        console.log('Join button not found');
    }
});

// Add some basic modal styles
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        animation: fadeIn 0.3s ease-in-out;
    }
    
    .modal-content {
        background-color: #fefefe;
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        max-width: 600px;
        border-radius: 8px;
        position: relative;
        animation: slideIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .close-button {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .close-button:hover {
        color: black;
    }
    
    .question-container {
        margin-bottom: 20px;
    }
    
    .question-explanation {
        color: #666;
        margin: 5px 0;
        font-size: 0.9em;
    }
    
    .question-input {
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
        transition: border-color 0.2s;
    }
    
    .question-input:focus {
        border-color: #4CAF50;
        outline: none;
    }
    
    .question-input.error {
        border-color: #ff4444;
    }
    
    .email-visibility-container {
        margin: 20px 0;
        padding: 10px;
        background-color: #f8f8f8;
        border-radius: 4px;
    }
    
    .submit-button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        margin-top: 20px;
        transition: background-color 0.2s;
    }
    
    .submit-button:hover:not(:disabled) {
        background-color: #45a049;
    }
    
    .submit-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
    
    .required {
        color: red;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        z-index: 1001;
        animation: slideInRight 0.3s ease-in-out;
    }
    
    .notification.success {
        background-color: #4CAF50;
    }
    
    .notification.error {
        background-color: #ff4444;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
