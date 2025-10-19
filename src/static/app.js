document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // ヘルパー: メールからイニシャルを作る
  function getInitials(email) {
    const name = email.split("@")[0];
    const parts = name.split(/[\.\-_]/).filter(Boolean);
    const initials = parts.length >= 2
      ? parts[0][0] + parts[1][0]
      : name.slice(0, 2);
    return initials.toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = details.participants
            .map(p => `
              <div class="participant">
                <div class="avatar">${getInitials(p)}</div>
                <div class="p-email" title="${p}">${p}</div>
              </div>
            `).join("");
        } else {
          participantsHtml = `<div class="no-participants">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <button type="button" class="toggle-btn" aria-expanded="false">Show participants</button>

          <div class="participants collapsed" aria-hidden="true">
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Wire up toggle button
        const toggleBtn = activityCard.querySelector(".toggle-btn");
        const participantsDiv = activityCard.querySelector(".participants");

        toggleBtn.addEventListener("click", () => {
          const isCollapsed = participantsDiv.classList.toggle("collapsed");
          if (isCollapsed) {
            toggleBtn.textContent = "Show participants";
            toggleBtn.setAttribute("aria-expanded", "false");
            participantsDiv.setAttribute("aria-hidden", "true");
          } else {
            toggleBtn.textContent = "Hide participants";
            toggleBtn.setAttribute("aria-expanded", "true");
            participantsDiv.setAttribute("aria-hidden", "false");
            // アニメーション用に max-height を一時的に大きくする
            participantsDiv.style.maxHeight = participantsDiv.scrollHeight + "px";
            setTimeout(() => {
              participantsDiv.style.maxHeight = "";
            }, 300);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
