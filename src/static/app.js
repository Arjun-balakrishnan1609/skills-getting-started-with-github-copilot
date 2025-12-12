document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, kind = "info") {
    messageDiv.textContent = text;
    // keep the base `message` class for consistent styling
    messageDiv.className = `message ${kind}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to build participant list element
  function buildParticipantsList(participants) {
    const ul = document.createElement("ul");
    ul.className = "participants";
    if (!participants || participants.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No participants yet";
      li.className = "no-participants";
      ul.appendChild(li);
      return ul;
    }

    participants.forEach((email) => {
      const li = document.createElement("li");

      const badge = document.createElement("span");
      badge.className = "participant-badge";
      const initials =
        email
          .split("@")[0]
          .split(/[._-]/)
          .map((s) => s[0] || "")
          .slice(0, 2)
          .join("")
          .toUpperCase() || "?";
      badge.textContent = initials;
      li.appendChild(badge);

      const span = document.createElement("span");
      span.className = "participant-email";
      span.textContent = email;
      li.appendChild(span);

      ul.appendChild(li);
    });
    return ul;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error("Failed to fetch activities");
      const activities = await response.json();

      // Clear loading message and previous content
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities)
        .sort(([aName], [bName]) => aName.localeCompare(bName))
        .forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - (details.participants?.length || 0);

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // Append participants list
          const participantsList = buildParticipantsList(details.participants);
          activityCard.appendChild(participantsList);

          activitiesList.appendChild(activityCard);

          // Add option to select dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!email) {
      showMessage("Please provide a valid email", "error");
      return;
    }
    if (!activity) {
      showMessage("Please select an activity", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message || "Signed up successfully", "success");
        signupForm.reset();
        await fetchActivities(); // refresh participants and availability
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
