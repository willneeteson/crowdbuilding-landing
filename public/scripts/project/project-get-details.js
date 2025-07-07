// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for modal system to be ready
        const modalSystem = await window.waitForModalSystem();
        
        // Get project ID from URL
        const pathParts = window.location.pathname.split('/');
        const projectId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

        if (!projectId) {
            console.error('No project ID found in URL');
            return;
        }

        // Fetch project data
        fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(response => {
                const data = response.data;
                
                // Store data globally
                window.projectData = data;
                console.log('Project data stored:', data);

                // Update page elements with project data
                updatePageElements(data);
            })
            .catch(error => {
                console.error('Error fetching project data:', error);
            });
    } catch (error) {
        console.error('Error initializing project details:', error);
    }
});

function updateDescriptions(descriptions) {
    const container = document.querySelector('.project-descriptions');
    if (!container) return;

    if (descriptions && descriptions.length > 0) {
        container.innerHTML = descriptions.map(desc => `
            <div class="description-section">
                <h3>${desc.title}</h3>
                <div class="description-content">${desc.text}</div>
            </div>
        `).join('');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function updatePageElements(data) {
    // Update basic elements
    updateElement('.project-title', data.title);
    updateElement('.project-subtitle', data.subtitle);
    updateDataDetail('description', data.intro, true);
    
    // Update data-detail attributes for project characteristics
    updateDataDetail('plaats', data.location);
    updateDataDetail('projectfase', data.phase?.name);
    updateDataDetail('ontwikkelvorm', data.development_form?.name);
    updateDataDetail('huishoudens', data.number_of_homes);
    updateDataDetail('aantal-woningen', data.number_of_homes);
    updateDataDetail('woonmilieu', data.housing_forms?.map(form => form.title).join(', '));
    updateDataDetail('member-count', data.followers_count);
    updateDataDetail('contact-email', data.contact_email);
    updateDataDetail('contact-name', data.contact_name);
    updateDataDetail('project-status', data.phase?.name);
    
    // Update tags container
    updateTagsContainer(data.interests, data.target_audiences);

    // Update descriptions if they exist
    if (data.info) {
        const container = document.querySelector('#contentDescription');
        if (container && data.info.length > 0) {
            container.innerHTML = data.info.map(desc => `
                <div class="description-section">
                    <h3>${desc.title}</h3>
                    <div class="description-content">${desc.text}</div>
                </div>
            `).join('');
            container.style.display = 'block';
        } else if (container) {
            container.style.display = 'none';
        }
    }

    // Update images if they exist
    if (data.images && data.images.length > 0) {
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.innerHTML = data.images
                .map(image => `<img src="${image.conversions?.thumb?.url || image.original_url}" alt="${image.name}" class="project-image">`)
                .join('');
        }
    }
}

function updateElement(selector, value, isHTML = false) {
    const element = document.querySelector(selector);
    if (element && value) {
        if (isHTML) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
        element.style.display = 'block';
    } else if (element) {
        element.style.display = 'none';
    }
}

function updateElementAndParent(selector, value, parentSelector) {
    const element = document.querySelector(selector);
    const parent = document.querySelector(parentSelector);
    
    if (element && parent) {
        if (value) {
            element.textContent = value;
            element.style.display = 'block';
            parent.style.display = 'flex';
        } else {
            element.style.display = 'none';
            parent.style.display = 'none';
        }
    }
}

function updateArrayElement(selector, array, property) {
    const container = document.querySelector(selector);
    if (!container) return;

    if (array && array.length > 0) {
        const maxItems = 3;
        const displayItems = array.slice(0, maxItems);
        const remainingCount = Math.max(0, array.length - maxItems);

        container.innerHTML = displayItems.map(item => 
            `<div class="tag">${item[property]}</div>`
        ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
    } else {
        container.style.display = 'none';
    }
}

function updateArrayElementAndParent(selector, array, property, parentSelector) {
    const container = document.querySelector(selector);
    const parent = document.querySelector(parentSelector);
    
    if (!container || !parent) return;

    if (array && array.length > 0) {
        const maxItems = 3;
        const displayItems = array.slice(0, maxItems);
        const remainingCount = Math.max(0, array.length - maxItems);

        container.innerHTML = displayItems.map(item => 
            `<div class="tag">${item[property]}</div>`
        ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
        container.style.display = 'block';
        parent.style.display = 'flex';
    } else {
        container.style.display = 'none';
        parent.style.display = 'none';
    }
}

function updateDataDetail(detailName, value, isHTML = false) {
    const elements = document.querySelectorAll(`[data-detail="${detailName}"]`);
    elements.forEach(element => {
        if (element && value) {
            if (isHTML) {
                element.innerHTML = value;
            } else {
                element.textContent = value;
            }
            element.style.display = 'block';
            // Show the parent cell item
            const parentCell = element.closest('.cell__item');
            if (parentCell) {
                parentCell.style.display = 'grid';
            }
        } else if (element) {
            element.style.display = 'none';
            // Hide the parent cell item if no value
            const parentCell = element.closest('.cell__item');
            if (parentCell) {
                parentCell.style.display = 'none';
            }
        }
    });
}

function updateTagsContainer(interests, targetAudiences) {
    const tagsContainer = document.getElementById('propertiesTags');
    if (!tagsContainer) return;

    const allTags = [];
    
    // Add interests
    if (interests && interests.length > 0) {
        allTags.push(...interests.map(interest => interest.name));
    }
    
    // Add target audiences
    if (targetAudiences && targetAudiences.length > 0) {
        allTags.push(...targetAudiences.map(audience => audience.name));
    }

    if (allTags.length > 0) {
        const maxItems = 3;
        const displayItems = allTags.slice(0, maxItems);
        const remainingCount = Math.max(0, allTags.length - maxItems);

        tagsContainer.innerHTML = displayItems.map(tag => 
            `<div class="tag">${tag}</div>`
        ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
        tagsContainer.style.display = 'block';
        
        // Show the parent cell item
        const parentCell = tagsContainer.closest('.cell__item');
        if (parentCell) {
            parentCell.style.display = 'flex';
        }
    } else {
        tagsContainer.style.display = 'none';
        // Hide the parent cell item if no tags
        const parentCell = tagsContainer.closest('.cell__item');
        if (parentCell) {
            parentCell.style.display = 'none';
        }
    }
}