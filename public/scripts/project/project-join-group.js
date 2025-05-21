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
    const formContainer = document.createElement('div');
    formContainer.className = 'group-questions-form';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const label = document.createElement('label');
        label.textContent = question.title;
        if (question.required) {
            label.innerHTML += ' <span class="required">*</span>';
        }
        
        const explanation = document.createElement('p');
        explanation.className = 'question-explanation';
        explanation.textContent = question.explanation;
        
        let input;
        if (question.question_type === 'multiple_choice') {
            input = document.createElement('select');
            input.required = question.required;
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select an option';
            input.appendChild(emptyOption);
            
            // Add question answers as options
            question.question_answers.forEach(answer => {
                const option = document.createElement('option');
                option.value = answer.answer;
                option.textContent = answer.answer;
                input.appendChild(option);
            });
        } else {
            input = document.createElement('textarea');
            input.required = question.required;
            input.rows = 3;
        }
        
        input.name = `question_${question.id}`;
        input.id = `question_${question.id}`;
        input.className = 'question-input';
        
        questionDiv.appendChild(label);
        questionDiv.appendChild(explanation);
        questionDiv.appendChild(input);
        formContainer.appendChild(questionDiv);
    });
    
    return formContainer;
}

// Function to handle joining a group
async function joinGroup(answers = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Only add CSRF token if it exists
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${GROUP_ID}/join`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ answers })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to join group: ${response.status}`);
        }

        const data = await response.json();

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

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${GROUP_ID}/members/questions`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch group questions: ${response.status}`);
            } else {
                throw new Error(`Failed to fetch group questions: ${response.status} - Server returned non-JSON response`);
            }
        }

        const data = await response.json();
        
        if (!data || !data.data) {
            throw new Error('Invalid response format from server');
        }
        
        return data.data;
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
                // Fetch group data and questions
                const groupData = await fetchGroupData();
                
                // Create modal for questions
                const modal = document.createElement('div');
                modal.className = 'modal';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                
                const closeButton = document.createElement('span');
                closeButton.className = 'close-button';
                closeButton.innerHTML = '&times;';
                closeButton.onclick = () => modal.remove();
                
                const title = document.createElement('h2');
                title.textContent = 'Join Group';
                
                const form = document.createElement('form');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    
                    // Collect answers
                    const answers = {};
                    const inputs = form.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input.name) {
                            answers[input.name] = input.value;
                        }
                    });
                    
                    // Submit join request
                    try {
                        joinButton.disabled = true;
                        await joinGroup(answers);
                        modal.remove();
                    } catch (error) {
                        joinButton.disabled = false;
                    }
                };
                
                // Add questions to form
                if (groupData.questions && groupData.questions.length > 0) {
                    const questionsForm = createQuestionForm(groupData.questions);
                    form.appendChild(questionsForm);
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
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('error', error.message || 'Failed to load group questions');
            }
        });
    }
});
