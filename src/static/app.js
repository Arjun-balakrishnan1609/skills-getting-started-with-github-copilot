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
  function buildParticipantsList(participants, activityName) {
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

      // Add remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "participant-remove";
      removeBtn.title = `Remove ${email}`;
      removeBtn.type = "button";
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", async () => {
        if (!confirm(`Unregister ${email} from ${activityName}?`)) return;
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
            { method: "DELETE", cache: 'no-store' }
          );

          const result = await response.json();
          if (response.ok) {
            showMessage(result.message || `Removed ${email}` , "success");
            await fetchActivities();
          } else {
            showMessage(result.detail || `Failed to remove ${email}` , "error");
          }
        } catch (err) {
          showMessage("Failed to remove participant. Please try again.", "error");
          console.error("Error removing participant:", err);
        }
      });

      li.appendChild(removeBtn);

      ul.appendChild(li);
    });
    return ul;
  }

  // Function to insert individual participant DOM node for immediate UI feedback
  function createParticipantListItem(email, activityName) {
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

    const removeBtn = document.createElement("button");
    removeBtn.className = "participant-remove";
    removeBtn.title = `Remove ${email}`;
    removeBtn.type = "button";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", async () => {
      if (!confirm(`Unregister ${email} from ${activityName}?`)) return;
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE", cache: 'no-store' }
        );

        const result = await response.json();
        if (response.ok) {
          showMessage(result.message || `Removed ${email}` , "success");
          await fetchActivities();
        } else {
          showMessage(result.detail || `Failed to remove ${email}` , "error");
        }
      } catch (err) {
        showMessage("Failed to remove participant. Please try again.", "error");
        console.error("Error removing participant:", err);
      }
    });

    li.appendChild(removeBtn);
    return li;
  }

  // Append participant to existing activity card for immediate UI update
  function appendParticipantToActivityCard(activityName, email) {
    const cards = activitiesList.querySelectorAll('.activity-card');
    for (const card of cards) {
      const title = card.querySelector('h4');
      if (title && title.textContent.trim() === activityName) {
        const ul = card.querySelector('.participants');
        if (ul) {
          // If there was a "No participants yet" item, remove it
          const noParticipants = ul.querySelector('.no-participants');
          if (noParticipants) {
            ul.removeChild(noParticipants);
          }
          // Append the new participant row
          ul.appendChild(createParticipantListItem(email, activityName));

          // Update availability text (best effort)
          const availP = Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('Availability:'));
          if (availP) {
            const match = availP.textContent.match(/Availability:\s*(\d+)\s*spots left/);
            if (match) {
              const newCount = Math.max(0, parseInt(match[1], 10) - 1);
              availP.innerHTML = `<strong>Availability:</strong> ${newCount} spots left`;
            }
          }

          // Update participants count heading if exists
          const countSpan = card.querySelector('.participants-heading .participants-count');
          if (countSpan) {
            const match = countSpan.textContent.match(/(\d+)/);
            if (match) {
              const current = parseInt(match[1], 10);
              const next = current + 1;
              countSpan.textContent = `${next} participant${next !== 1 ? 's' : ''}`;
            }
          }
        }
        break;
      }
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
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
          const participantsList = buildParticipantsList(details.participants, name);
              activityCard.appendChild(participantsList);

          // Add a heading that shows people count, for visual clarity
          const heading = document.createElement('div');
          heading.className = 'participants-heading';
          const countSpan = document.createElement('span');
          countSpan.className = 'participants-count';
          countSpan.textContent = `${details.participants?.length || 0} participant${(details.participants?.length || 0) !== 1 ? 's' : ''}`;
          heading.appendChild(countSpan);
          activityCard.appendChild(heading);

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
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message || "Signed up successfully", "success");
        signupForm.reset();
        // Optimistically update the UI before the server-fetched re-render
        appendParticipantToActivityCard(activity, email);
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
