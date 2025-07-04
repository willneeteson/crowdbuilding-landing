document.addEventListener("DOMContentLoaded", async () => {
    // Check if user is logged in
    const isLoggedIn = await window.auth.isUserLoggedIn();
    
    // Read More/Read Less Functionality
    const container = document.getElementById("readMoreContainer");
    const button = document.getElementById("readMoreButton");

    const checkContentLength = () => {
        const originalHeight = container.scrollHeight;
        const visibleHeight = container.clientHeight;

        button.style.display = originalHeight > visibleHeight ? "block" : "none";
    };

    button.addEventListener("click", () => {
        const expanded = container.classList.toggle("expanded");
        button.textContent = expanded ? "Read Less" : "Read More";

        checkContentLength();
    });

    checkContentLength();

    // Swiper Slide Counter
    const updateCounter = (swiper, swiperElement) => {
        const currentSlide = swiperElement.querySelector(".current-slide");
        const totalSlides = swiperElement.querySelector(".total-slides");

        if (!currentSlide || !totalSlides) {
            // Create and append counters if not already present
            const counterWrapper = document.createElement("div");
            counterWrapper.className = "swiper-counter";

            const current = document.createElement("span");
            current.className = "current-slide";
            current.textContent = swiper.realIndex + 1 || 1;

            const separator = document.createElement("span");
            separator.textContent = " / ";

            const total = document.createElement("span");
            total.className = "total-slides";
            total.textContent = swiper.slides.length - (swiper.loopedSlides || 0);

            counterWrapper.appendChild(current);
            counterWrapper.appendChild(separator);
            counterWrapper.appendChild(total);
            swiperElement.appendChild(counterWrapper);
        } else {
            // Update counter values
            currentSlide.textContent = swiper.realIndex + 1 || 1;
            totalSlides.textContent = swiper.slides.length - (swiper.loopedSlides || 0);
        }
    };

    // Swiper Initialisation
    const swipers = document.querySelectorAll(".swiper");

    if (swipers.length > 0) {
        swipers.forEach((swiperElement, index) => {
            // Create navigation wrapper and pagination container
            const navAndPaginationWrapper = document.createElement("div");
            navAndPaginationWrapper.className = "swiper-controls-wrapper";

            const navWrapper = document.createElement("div");
            navWrapper.className = "swiper-nav-wrapper";

            const pagination = document.createElement("div");
            pagination.className = "swiper-pagination";

            // Create navigation buttons dynamically
            const nextButton = document.createElement("div");
            const prevButton = document.createElement("div");

            nextButton.className = "swiper-button-next";
            prevButton.className = "swiper-button-prev";

            // Append navigation buttons to the nav wrapper
            navWrapper.appendChild(prevButton);
            navWrapper.appendChild(nextButton);

            // Append nav wrapper and pagination to the controls wrapper
            navAndPaginationWrapper.appendChild(navWrapper);
            navAndPaginationWrapper.appendChild(pagination);

            // Append the controls wrapper to the Swiper container
            swiperElement.appendChild(navAndPaginationWrapper);

            // Initialize Swiper
            const swiper = new Swiper(swiperElement, {
                navigation: {
                    nextEl: nextButton,
                    prevEl: prevButton,
                },
                pagination: {
                    el: pagination,
                    clickable: true,
                },
                slidesPerView: "auto",
                spaceBetween: 16,
                on: {
                    init() {
                        updateCounter(this, swiperElement);
                    },
                    slideChange() {
                        updateCounter(this, swiperElement);
                    },
                },
            });
        });
    }

    // Modal Functionality
    const modal = document.getElementById("image-modal");
    const modalGrid = modal.querySelector(".modal-grid");
    const closeModal = modal.querySelector(".close");
    const slides = document.querySelectorAll(".swiper-slide");

    slides.forEach((slide) => {
        slide.addEventListener("click", () => {
            const clickedImgSrc = slide.querySelector("img").src;

            modalGrid.innerHTML = ""; // Clear existing modal content

            slides.forEach((slideItem) => {
                const imgSrc = slideItem.querySelector("img").src;
                const img = document.createElement("img");
                img.src = imgSrc;
                img.classList.add("modal-image");
                modalGrid.appendChild(img);
            });

            const modalImages = modalGrid.querySelectorAll(".modal-image");
            modal.classList.remove("hidden");

            modalImages.forEach((img) => {
                if (img.src === clickedImgSrc) {
                    img.scrollIntoView({ behavior: "instant", block: "center" });
                }
            });
        });
    });

    closeModal.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    // Lightbox Functionality
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxClose = document.querySelector(".lightbox-close");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");

    let currentIndex = 0;
    let images = [];

    modalGrid.addEventListener("click", (e) => {
        if (e.target.tagName === "IMG") {
            images = Array.from(modalGrid.querySelectorAll("img")).map((img) => img.src);
            currentIndex = images.indexOf(e.target.src);
            openLightbox(currentIndex);
        }
    });

    const openLightbox = (index) => {
        lightboxImage.src = images[index];
        lightbox.classList.remove("hidden");
    };

    lightboxClose.addEventListener("click", () => {
        lightbox.classList.add("hidden");
    });

    lightboxPrev.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        openLightbox(currentIndex);
    });

    lightboxNext.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % images.length;
        openLightbox(currentIndex);
    });

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.classList.add("hidden");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (!lightbox.classList.contains("hidden")) {
                lightbox.classList.add("hidden");
            }
            if (!modal.classList.contains("hidden")) {
                modal.classList.add("hidden");
            }
        }
    });
});