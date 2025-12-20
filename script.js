document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");
    const messageBox = document.getElementById("formMessage");

    if (!contactForm) return; // Prevent errors if not on contact page

    contactForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Stop page reload

        const name = contactForm.elements["name"].value.trim();
        const email = contactForm.elements["email"].value.trim();
        const message = contactForm.elements["message"].value.trim();

        // Basic validation
        if (!name || !email || !message) {
            alert("Please fill in all fields before sending.");
            return;
        }

        // Success text
        const confirmation =
            "Thank you for sending the contact form. " +
            "My business hours are 08:00–12:00; I will contact you during these hours.";

        // Show message below form
        messageBox.textContent = confirmation;
        messageBox.classList.add("visible");

        // Clear form
        contactForm.reset();
    });
});
