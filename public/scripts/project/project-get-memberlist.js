// Function to populate project data in Webflow
function populateProjectData(data) {
    try {
        // Basic project information
        const titleElement = document.querySelector('.project-title');
        if (titleElement) titleElement.textContent = data.title;

        const subtitleElement = document.querySelector('.project-subtitle');
        if (subtitleElement) subtitleElement.textContent = data.subtitle;

        const introElement = document.querySelector('.project-intro');
        if (introElement) introElement.innerHTML = data.intro;

        const locationElement = document.querySelector('.project-location');
        if (locationElement) locationElement.textContent = data.location;
        
        // Project details
        const phaseElement = document.querySelector('.project-phase');
        if (phaseElement) phaseElement.textContent = data.phase.name;

        const developmentFormElement = document.querySelector('.project-development-form');
        if (developmentFormElement) developmentFormElement.textContent = data.development_form.name;

        const homesCountElement = document.querySelector('.project-homes-count');
        if (homesCountElement) homesCountElement.textContent = data.number_of_homes;

        const memberStatusElement = document.querySelector('.project-member-status');
        if (memberStatusElement) memberStatusElement.textContent = data.member_status.name;
        
        // Contact information
        const contactNameElement = document.querySelector('.project-contact-name');
        if (contactNameElement) contactNameElement.textContent = data.contact_name;

        const contactEmailElement = document.querySelector('.project-contact-email');
        if (contactEmailElement) contactEmailElement.textContent = data.contact_email;
        
        // Housing forms
        const housingFormsContainer = document.querySelector('.project-housing-forms');
        if (housingFormsContainer && data.housing_forms) {
            housingFormsContainer.innerHTML = data.housing_forms.map(form => 
                `<div class="housing-form">${form.title}</div>`
            ).join('');
        }
        
        // Interests
        const interestsContainer = document.querySelector('.project-interests');
        if (interestsContainer && data.interests) {
            interestsContainer.innerHTML = data.interests.map(interest => 
                `<div class="interest-tag">${interest.name}</div>`
            ).join('');
        }
        
        // Buy budgets
        const buyBudgetsContainer = document.querySelector('.project-buy-budgets');
        if (buyBudgetsContainer && data.buy_budgets) {
            buyBudgetsContainer.innerHTML = data.buy_budgets.map(budget => 
                `<div class="budget-tag">${budget.name}</div>`
            ).join('');
        }
        
        // Target audiences
        const targetAudiencesContainer = document.querySelector('.project-target-audiences');
        if (targetAudiencesContainer && data.target_audiences) {
            targetAudiencesContainer.innerHTML = data.target_audiences.map(audience => 
                `<div class="audience-tag">${audience.name}</div>`
            ).join('');
        }
        
        // Project images
        const imagesContainer = document.querySelector('.project-images');
        if (imagesContainer && data.images && data.images.length > 0) {
            imagesContainer.innerHTML = data.images.map(image => 
                `<img src="${image.original_url}" alt="${image.name}" class="project-image">`
            ).join('');
        }
        
        // Project status indicators
        const buildingPermitElement = document.querySelector('.project-building-permit');
        if (buildingPermitElement) buildingPermitElement.textContent = data.building_permit_status.name;

        const constructionFinancingElement = document.querySelector('.project-construction-financing');
        if (constructionFinancingElement) constructionFinancingElement.textContent = data.needs_construction_financing.name;

        const planningCostsElement = document.querySelector('.project-planning-costs');
        if (planningCostsElement) planningCostsElement.textContent = data.needs_planning_costs_financing.name;

        const chamberRegistrationElement = document.querySelector('.project-chamber-registration');
        if (chamberRegistrationElement) chamberRegistrationElement.textContent = data.chamber_of_commerce_registration_status.name;

        console.log('Project data populated successfully');
    } catch (error) {
        console.error('Error populating project data:', error);
    }
}

// Function to fetch project data
async function fetchProjectData() {
    try {
        const projectId = 'cpo-project-park-romana';
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched project data:', data);
        
        if (data && data.data) {
            populateProjectData(data.data);
        } else {
            console.error('Invalid data format received from API');
        }
    } catch (error) {
        console.error('Error fetching project data:', error);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchProjectData); 