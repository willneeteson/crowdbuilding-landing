// Function to populate project data in Webflow
function populateProjectData(data) {
    // Basic project information
    document.querySelector('.project-title').textContent = data.title;
    document.querySelector('.project-subtitle').textContent = data.subtitle;
    document.querySelector('.project-intro').innerHTML = data.intro;
    document.querySelector('.project-location').textContent = data.location;
    
    // Project details
    document.querySelector('.project-phase').textContent = data.phase.name;
    document.querySelector('.project-development-form').textContent = data.development_form.name;
    document.querySelector('.project-homes-count').textContent = data.number_of_homes;
    document.querySelector('.project-member-status').textContent = data.member_status.name;
    
    // Contact information
    document.querySelector('.project-contact-name').textContent = data.contact_name;
    document.querySelector('.project-contact-email').textContent = data.contact_email;
    
    // Housing forms
    const housingFormsContainer = document.querySelector('.project-housing-forms');
    if (housingFormsContainer) {
        housingFormsContainer.innerHTML = data.housing_forms.map(form => 
            `<div class="housing-form">${form.title}</div>`
        ).join('');
    }
    
    // Interests
    const interestsContainer = document.querySelector('.project-interests');
    if (interestsContainer) {
        interestsContainer.innerHTML = data.interests.map(interest => 
            `<div class="interest-tag">${interest.name}</div>`
        ).join('');
    }
    
    // Buy budgets
    const buyBudgetsContainer = document.querySelector('.project-buy-budgets');
    if (buyBudgetsContainer) {
        buyBudgetsContainer.innerHTML = data.buy_budgets.map(budget => 
            `<div class="budget-tag">${budget.name}</div>`
        ).join('');
    }
    
    // Target audiences
    const targetAudiencesContainer = document.querySelector('.project-target-audiences');
    if (targetAudiencesContainer) {
        targetAudiencesContainer.innerHTML = data.target_audiences.map(audience => 
            `<div class="audience-tag">${audience.name}</div>`
        ).join('');
    }
    
    // Project images
    const imagesContainer = document.querySelector('.project-images');
    if (imagesContainer && data.images.length > 0) {
        imagesContainer.innerHTML = data.images.map(image => 
            `<img src="${image.original_url}" alt="${image.name}" class="project-image">`
        ).join('');
    }
    
    // Project status indicators
    document.querySelector('.project-building-permit').textContent = data.building_permit_status.name;
    document.querySelector('.project-construction-financing').textContent = data.needs_construction_financing.name;
    document.querySelector('.project-planning-costs').textContent = data.needs_planning_costs_financing.name;
    document.querySelector('.project-chamber-registration').textContent = data.chamber_of_commerce_registration_status.name;
}

// Example usage:
// fetch('your-api-endpoint')
//     .then(response => response.json())
//     .then(data => populateProjectData(data.data)); 