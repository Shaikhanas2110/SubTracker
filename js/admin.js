// const API_BASE = "http://localhost:5000/api/admin";
const API_BASE = "https://server-mtye.onrender.com/api/admin";
const token = localStorage.getItem("authToken");

let currentUsers = [];

if (!token) {
  alert("You are not logged in!");
  window.location.href = "/auth.html";
}

window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("authToken");
    window.location.href = "/auth.html";
  }
}

async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    if (!Array.isArray(users)) throw new Error("Invalid response from server");
    currentUsers = users;
    renderUsers(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    alert("Failed to fetch users. Check console for details.");
  }
}

function renderUsers(users) {
  const container = document.getElementById("usersBody");

  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const admins = users.filter((u) => u.isAdmin).length;

  document.getElementById("totalUsers").textContent = total;
  document.getElementById("activeUsers").textContent = active;
  document.getElementById("adminCount").textContent = admins;

  if (users.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <h2 class="empty-title">No users found</h2>
              <p class="empty-text">There are no users to display at the moment.</p>
            </div>
          `;
    return;
  }

  container.innerHTML = users
    .map((u) => {
      const initials = u.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      const statusClass = u.isActive ? "" : "inactive";
      const roleClass = u.isAdmin ? "" : "user";

      return `
            <div class="user-card">
              <div class="user-header">
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                  <div class="user-name">${u.name}</div>
                  <div class="user-email">${u.email}</div>
                </div>
              </div>
              
              <div class="user-badges">
                <span class="badge badge-status ${statusClass}">
                  <span class="badge-indicator"></span>
                  ${u.isActive ? "Active" : "Inactive"}
                </span>
                <span class="badge badge-role ${roleClass}">
                  ${u.isAdmin ? "Admin" : "User"}
                </span>
              </div>

              <div class="user-meta">
                <div class="meta-item">
                  <span class="meta-label">User ID</span>
                  <span class="meta-value">${u._id.substring(0, 8)}...</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Role</span>
                  <span class="meta-value">${
                    u.isAdmin ? "Administrator" : "Standard User"
                  }</span>
                </div>
              </div>

                ${
                  !u.isAdmin
                    ? `<button class="btn btn-purple" onclick="promoteUser('${u._id}')">Make Admin</button>`
                    : ""
                }
                <button class="btn btn-red" onclick="deleteUser('${
                  u._id
                }')">Delete</button>
              </div>
            </div>
          `;
    })
    .join("");
}

async function logout() {
  try {
    await fetch("https://server-mtye.onrender.com/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberUser");

    // Redirect to login page
    window.location.href = "auth.html";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Try again.");
  }
}

// async function deactivateUser(userId, currentStatus) {
//   try {
//     const res = await fetch(`http://localhost:5000/api/admin/user/${userId}/status`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ isActive: !currentStatus }),
//     });

//     const result = await res.json();
//     if (!res.ok) throw new Error(result.message || "Failed to update user status");

//     alert(result.message);
//     fetchUsers(); // refresh table
//   } catch (err) {
//     console.error("Error updating user status:", err);
//     alert("Failed to update status. Check console.");
//   }
// }


// async function toggleStatus(userId, currentStatus) {
//   try {
//     await fetch(`${API_BASE}/user/${userId}/toggle`, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     fetchUsers();
//   } catch (err) {
//     console.error("Error updating status:", err);
//     alert("Failed to update user status.");
//   }
// }

async function promoteUser(userId) {
  if (!confirm("Are you sure you want to make this user an admin?")) return;
  try {
    await fetch(`${API_BASE}/user/${userId}/promote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAdmin: true }),
    });
    fetchUsers();
  } catch (err) {
    console.error("Error promoting user:", err);
    alert("Failed to promote user.");
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await fetch(`${API_BASE}/user/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Failed to delete user.");
  }
}

function downloadReport() {
  if (currentUsers.length === 0) {
    alert("No user data available to download.");
    return;
  }

  const headers = ["Name", "Email", "Status", "Role", "User ID"];
  const csvRows = [headers.join(",")];

  currentUsers.forEach((user) => {
    const row = [
      `"${user.name}"`,
      `"${user.email}"`,
      user.isActive ? "Active" : "Inactive",
      user.isAdmin ? "Admin" : "User",
      user._id,
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `subtracker-users-${timestamp}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

fetchUsers();
