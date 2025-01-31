document.addEventListener("DOMContentLoaded", () => {
    // Select modal and buttons
    const openModalButton = document.getElementById("openModal");
    const closeModalButton = document.getElementById("closeModal");
    const modal = document.getElementById("exampleModal");

    // Function to open modal
    function openModal() {
        modal.style.display = "block";
    }

    // Function to close modal
    function closeModal() {
        modal.style.display = "none";
    }

    // Event listeners for opening and closing modal
    openModalButton.addEventListener("click", openModal);
    closeModalButton.addEventListener("click", closeModal);

    // Close modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    
});




// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}
