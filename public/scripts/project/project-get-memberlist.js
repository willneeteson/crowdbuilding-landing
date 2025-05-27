// Function to populate project data in Webflow
function populateProjectData(data) {
    try {
        // Basic project information
        const titleElement = document.querySelector('.project-title');
        if (titleElement) {
            if (data.title) {
                titleElement.textContent = data.title;
                titleElement.style.display = 'block';
            } else {
                titleElement.style.display = 'none';
            }
        }

        const subtitleElement = document.querySelector('.project-subtitle');
        if (subtitleElement) {
            if (data.subtitle) {
                subtitleElement.textContent = data.subtitle;
                subtitleElement.style.display = 'block';
            } else {
                subtitleElement.style.display = 'none';
            }
        }

        const introElement = document.querySelector('.project-intro');
        if (introElement) {
            if (data.intro) {
                introElement.innerHTML = data.intro;
                introElement.style.display = 'block';
            } else {
                introElement.style.display = 'none';
            }
        }

        const locationElement = document.querySelector('.project-location');
        if (locationElement) {
            if (data.location) {
                locationElement.textContent = data.location;
                locationElement.style.display = 'block';
            } else {
                locationElement.style.display = 'none';
            }
        }
        
        // Project details
        const phaseElement = document.querySelector('.project-phase');
        if (phaseElement) {
            if (data.phase?.name) {
                phaseElement.textContent = data.phase.name;
                phaseElement.style.display = 'block';
            } else {
                phaseElement.style.display = 'none';
            }
        }

        const developmentFormElement = document.querySelector('.project-development-form');
        if (developmentFormElement) {
            if (data.development_form?.name) {
                developmentFormElement.textContent = data.development_form.name;
                developmentFormElement.style.display = 'block';
            } else {
                developmentFormElement.style.display = 'none';
            }
        }

        const homesCountElement = document.querySelector('.project-homes-count');
        if (homesCountElement) {
            if (data.number_of_homes) {
                homesCountElement.textContent = data.number_of_homes;
                homesCountElement.style.display = 'block';
            } else {
                homesCountElement.style.display = 'none';
            }
        }

        const memberStatusElement = document.querySelector('.project-member-status');
        if (memberStatusElement) {
            if (data.member_status?.name) {
                memberStatusElement.textContent = data.member_status.name;
                memberStatusElement.style.display = 'block';
            } else {
                memberStatusElement.style.display = 'none';
            }
        }
        
        // Contact information
        const contactNameElement = document.querySelector('.project-contact-name');
        if (contactNameElement) {
            if (data.contact_name) {
                contactNameElement.textContent = data.contact_name;
                contactNameElement.style.display = 'block';
            } else {
                contactNameElement.style.display = 'none';
            }
        }

        const contactEmailElement = document.querySelector('.project-contact-email');
        if (contactEmailElement) {
            if (data.contact_email) {
                contactEmailElement.textContent = data.contact_email;
                contactEmailElement.style.display = 'block';
            } else {
                contactEmailElement.style.display = 'none';
            }
        }
        
        // Housing forms
        const housingFormsContainer = document.querySelector('.project-housing-forms');
        if (housingFormsContainer) {
            if (data.housing_forms && data.housing_forms.length > 0) {
                const maxItems = 3;
                const remainingCount = Math.max(0, data.housing_forms.length - maxItems);
                const displayForms = data.housing_forms.slice(0, maxItems);
                
                housingFormsContainer.innerHTML = displayForms.map(form => 
                    `<div class="housing-form">${form.title}</div>`
                ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
                housingFormsContainer.style.display = 'block';
            } else {
                housingFormsContainer.style.display = 'none';
            }
        }
        
        // Interests
        const interestsContainer = document.querySelector('.project-interests');
        if (interestsContainer) {
            if (data.interests && data.interests.length > 0) {
                const maxItems = 3;
                const remainingCount = Math.max(0, data.interests.length - maxItems);
                const displayInterests = data.interests.slice(0, maxItems);
                
                interestsContainer.innerHTML = displayInterests.map(interest => 
                    `<div class="interest-tag">${interest.name}</div>`
                ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
                interestsContainer.style.display = 'block';
            } else {
                interestsContainer.style.display = 'none';
            }
        }
        
        // Buy budgets
        const buyBudgetsContainer = document.querySelector('.project-buy-budgets');
        if (buyBudgetsContainer) {
            if (data.buy_budgets && data.buy_budgets.length > 0) {
                const maxItems = 3;
                const remainingCount = Math.max(0, data.buy_budgets.length - maxItems);
                const displayBudgets = data.buy_budgets.slice(0, maxItems);
                
                buyBudgetsContainer.innerHTML = displayBudgets.map(budget => 
                    `<div class="budget-tag">${budget.name}</div>`
                ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
                buyBudgetsContainer.style.display = 'block';
            } else {
                buyBudgetsContainer.style.display = 'none';
            }
        }
        
        // Target audiences
        const targetAudiencesContainer = document.querySelector('.project-target-audiences');
        if (targetAudiencesContainer) {
            if (data.target_audiences && data.target_audiences.length > 0) {
                const maxItems = 3;
                const remainingCount = Math.max(0, data.target_audiences.length - maxItems);
                const displayAudiences = data.target_audiences.slice(0, maxItems);
                
                targetAudiencesContainer.innerHTML = displayAudiences.map(audience => 
                    `<div class="audience-tag">${audience.name}</div>`
                ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
                targetAudiencesContainer.style.display = 'block';
            } else {
                targetAudiencesContainer.style.display = 'none';
            }
        }
        
        // Project images
        const imagesContainer = document.getElementById('gallery');
        if (imagesContainer) {
            if (data.images && data.images.length > 0) {
                imagesContainer.innerHTML = data.images.map(image => 
                    `<img src="${image.conversions?.thumb?.url || image.original_url}" alt="${image.name}" class="project-image">`
                ).join('');
                imagesContainer.style.display = 'block';
            } else {
                imagesContainer.style.display = 'none';
            }
        }
        
        // Project status indicators
        const buildingPermitElement = document.querySelector('.project-building-permit');
        if (buildingPermitElement) {
            if (data.building_permit_status?.name) {
                buildingPermitElement.textContent = data.building_permit_status.name;
                buildingPermitElement.style.display = 'block';
            } else {
                buildingPermitElement.style.display = 'none';
            }
        }

        const constructionFinancingElement = document.querySelector('.project-construction-financing');
        if (constructionFinancingElement) {
            if (data.needs_construction_financing?.name) {
                constructionFinancingElement.textContent = data.needs_construction_financing.name;
                constructionFinancingElement.style.display = 'block';
            } else {
                constructionFinancingElement.style.display = 'none';
            }
        }

        const planningCostsElement = document.querySelector('.project-planning-costs');
        if (planningCostsElement) {
            if (data.needs_planning_costs_financing?.name) {
                planningCostsElement.textContent = data.needs_planning_costs_financing.name;
                planningCostsElement.style.display = 'block';
            } else {
                planningCostsElement.style.display = 'none';
            }
        }

        const chamberRegistrationElement = document.querySelector('.project-chamber-registration');
        if (chamberRegistrationElement) {
            if (data.chamber_of_commerce_registration_status?.name) {
                chamberRegistrationElement.textContent = data.chamber_of_commerce_registration_status.name;
                chamberRegistrationElement.style.display = 'block';
            } else {
                chamberRegistrationElement.style.display = 'none';
            }
        }

        console.log('Project data populated successfully');

        // Populate the project details modal
        if (typeof populateProjectDetailsModal === 'function') {
            populateProjectDetailsModal(data);
        }
    } catch (error) {
        console.error('Error populating project data:', error);
    }
}

// Function to fetch project data
async function fetchProjectData() {
    try {
        // Get the current page slug from the URL
        const pathParts = window.location.pathname.split('/');
        const projectId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
        
        if (!projectId) {
            console.error('No project ID found in URL');
            return;
        }

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