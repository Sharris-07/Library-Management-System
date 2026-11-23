document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("api-status");

    try {
        const result = await apiRequest("/health");
        status.textContent = `Backend connection: ${result.status}`;
    } catch (error) {
        status.textContent = "Backend is currently unavailable.";
        console.error(error);
    }
});
