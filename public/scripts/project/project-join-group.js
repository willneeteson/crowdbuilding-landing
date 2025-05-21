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
        
        input.name = `question_${question.id}`;
        input.id = `question_${question.id}`;
        input.className = 'question-input';
        
        questionDiv.appendChild(label);
        questionDiv.appendChild(explanation);
        questionDiv.appendChild(input);
        formContainer.appendChild(questionDiv);
    });
    
    console.log('Created form container:', formContainer);
    return formContainer;
}

// Function to handle joining a group
async function joinGroup(answers = {}) {
    try {
        // Get API token from auth module
        const apiToken = await window.auth.getApiToken();
        if (!apiToken) {
            throw new Error('Authentication required. Please log in to continue.');
        }

        // Format answers into the expected structure
        const formattedAnswers = Object.entries(answers).map(([name, value]) => ({
            question_id: parseInt(name.replace('question_', '')),
            answer: value
        }));

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        };

        const response = await fetch(`${API_BASE_URL}/api/v1/groups/${GROUP_ID}/join`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ answers: formattedAnswers })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.errors) {
                // Handle validation errors
                const errorMessages = Object.values(errorData.errors).flat();
                throw new Error(errorMessages.join('. '));
            }
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
        try {
            // Fetch group data and questions
            const groupData = await fetchGroupData();
            console.log('Fetched group data:', groupData);
            
            // Create container for questions
            const questionsContainer = document.createElement('div');
            questionsContainer.className = 'group-questions-container';
            
            // Add questions to container
            if (groupData.questions && groupData.questions.length > 0) {
                console.log('Creating questions form with questions:', groupData.questions);
                const questionsForm = createQuestionForm(groupData.questions);
                questionsContainer.appendChild(questionsForm);
            } else {
                console.log('No questions found in group data');
            }
            
            // Insert questions before the join button
            joinButton.parentNode.insertBefore(questionsContainer, joinButton);
            
            // Update join button click handler
            joinButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    // Collect answers
                    const answers = {};
                    const inputs = questionsContainer.querySelectorAll('input, select, textarea');
                    console.log('Found form inputs:', inputs);
                    inputs.forEach(input => {
                        if (input.name) {
                            answers[input.name] = input.value;
                        }
                    });
                    console.log('Collected answers:', answers);
                    
                    // Submit join request
                    joinButton.disabled = true;
                    await joinGroup(answers);
                } catch (error) {
                    joinButton.disabled = false;
                }
            });
            
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', error.message || 'Failed to load group questions');
        }
    } else {
        console.log('Join button not found');
    }
});
