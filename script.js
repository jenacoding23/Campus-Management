/* ==========================================================
   SMART CAMPUS 360
   Frontend: HTML + CSS + JavaScript + Bootstrap
   Features: Dashboard, Attendance, Assignments, Notices,
   Events, Charts, Search, Dark Mode, CSV Export, Local Storage
   ========================================================== */

(() => {
  "use strict";

  // ----------------------------------------------------------
  // 1. HELPER FUNCTIONS
  // ----------------------------------------------------------

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const STORAGE_KEY = "smartCampus360.v1";

  const today = new Date();

  function isoDate(date) {
    const d = new Date(date);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return isoDate(date);
  }

  function niceDate(value, options = {
    month: "short",
    day: "numeric"
  }) {
    if (!value) return "No date";

    const date = new Date(`${value}T12:00:00`);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, options);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function percent(attended, total) {
    return total > 0
      ? Math.round((attended / total) * 100)
      : 0;
  }

  function showToast(message, type = "success") {
    const container = $("#toastContainer");

    if (!container || typeof bootstrap === "undefined") {
      console.log(message);
      return;
    }

    const id = `toast-${Date.now()}-${Math.random()
      .toString(16).slice(2)}`;

    const icon = type === "warning"
      ? "bi-exclamation-triangle"
      : type === "error"
        ? "bi-x-circle"
        : "bi-check-circle-fill";

    container.insertAdjacentHTML("beforeend", `
      <div id="${id}"
           class="toast align-items-center"
           role="status"
           aria-live="polite">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span>${escapeHTML(message)}</span>
          <button type="button"
                  class="btn-close ms-auto"
                  data-bs-dismiss="toast"
                  aria-label="Close"></button>
        </div>
      </div>
    `);

    const element = document.getElementById(id);

    const toast = new bootstrap.Toast(element, {
      delay: 3000
    });

    toast.show();

    element.addEventListener("hidden.bs.toast", () => {
      element.remove();
    }, { once: true });
  }

  // ----------------------------------------------------------
  // 2. INITIAL DEMO DATA
  // ----------------------------------------------------------

  function defaultData() {
    return {
      theme: "light",

      subjects: [
        {
          id: 1,
          name: "Web Technology",
          faculty: "Prof. Das",
          attended: 39,
          total: 44,
          color: "#7965ec",
          icon: "bi-code-slash"
        },
        {
          id: 2,
          name: "Database Management",
          faculty: "Dr. Mohanty",
          attended: 36,
          total: 42,
          color: "#ff9f59",
          icon: "bi-database"
        },
        {
          id: 3,
          name: "Computer Networks",
          faculty: "Prof. Patra",
          attended: 31,
          total: 40,
          color: "#27b5ce",
          icon: "bi-diagram-3"
        },
        {
          id: 4,
          name: "Machine Learning",
          faculty: "Dr. Sahu",
          attended: 38,
          total: 42,
          color: "#20b98b",
          icon: "bi-cpu"
        }
      ],

      assignments: [
        {
          id: 101,
          title: "Responsive Portfolio Website",
          subject: "Web Technology",
          due: dateOffset(1),
          priority: "High",
          status: "In progress"
        },
        {
          id: 102,
          title: "SQL Query Practice Set",
          subject: "Database Management",
          due: dateOffset(2),
          priority: "Medium",
          status: "Pending"
        },
        {
          id: 103,
          title: "Network Topology Report",
          subject: "Computer Networks",
          due: dateOffset(4),
          priority: "Low",
          status: "Pending"
        },
        {
          id: 104,
          title: "ML Model Evaluation",
          subject: "Machine Learning",
          due: dateOffset(6),
          priority: "High",
          status: "In progress"
        },
        {
          id: 105,
          title: "Bootstrap UI Components",
          subject: "Web Technology",
          due: dateOffset(-1),
          priority: "Medium",
          status: "Completed"
        }
      ],

      notices: [
        {
          id: 201,
          title: "Mid-semester examination schedule",
          category: "Academic",
          description:
            "The tentative examination timetable is available. Check with your department for updates.",
          date: dateOffset(0),
          icon: "bi-calendar2-week"
        },
        {
          id: 202,
          title: "Placement orientation session",
          category: "Placement",
          description:
            "Final-year students are invited to attend placement orientation and resume preparation.",
          date: dateOffset(-1),
          icon: "bi-briefcase"
        },
        {
          id: 203,
          title: "Innovation Day registrations open",
          category: "Events",
          description:
            "Showcase your ideas, prototypes, and creative student projects.",
          date: dateOffset(-2),
          icon: "bi-lightbulb"
        }
      ],

      events: [
        {
          id: 301,
          title: "Innovation Day",
          date: dateOffset(2),
          time: "10:00",
          location: "Main Auditorium",
          category: "Workshop",
          icon: "bi-lightbulb-fill",
          banner: "banner-violet",
          description:
            "Present fresh ideas and explore student projects.",
          joined: false
        },
        {
          id: 302,
          title: "Career Readiness Workshop",
          date: dateOffset(4),
          time: "14:00",
          location: "Seminar Hall 2",
          category: "Placement",
          icon: "bi-people-fill",
          banner: "banner-orange",
          description:
            "Practice interviews and learn to present your strengths.",
          joined: false
        },
        {
          id: 303,
          title: "Campus Green Day",
          date: dateOffset(7),
          time: "09:30",
          location: "Central Garden",
          category: "Community",
          icon: "bi-tree-fill",
          banner: "banner-green",
          description:
            "Join a campus sustainability activity.",
          joined: false
        }
      ]
    };
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return defaultData();

      const parsed = JSON.parse(saved);
      const defaults = defaultData();

      return {
        ...defaults,
        ...parsed,
        subjects: Array.isArray(parsed.subjects)
          ? parsed.subjects : defaults.subjects,
        assignments: Array.isArray(parsed.assignments)
          ? parsed.assignments : defaults.assignments,
        notices: Array.isArray(parsed.notices)
          ? parsed.notices : defaults.notices,
        events: Array.isArray(parsed.events)
          ? parsed.events : defaults.events
      };
    } catch (error) {
      console.error("Unable to load saved data:", error);
      return defaultData();
    }
  }

  let data = loadData();
  let currentNoticeFilter = "All";
  let charts = {};

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Unable to save data:", error);
      showToast("Unable to save browser data.", "warning");
    }
  }

  // ----------------------------------------------------------
  // 3. DASHBOARD HEADER AND NAVIGATION
  // ----------------------------------------------------------

  function setToday() {
    const dateLabel = $("#todayLabel");
    const greeting = $("#greeting");

    if (dateLabel) {
      dateLabel.textContent = today.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
    }

    if (greeting) {
      const hour = new Date().getHours();

      greeting.textContent = hour < 12
        ? "morning"
        : hour < 18
          ? "afternoon"
          : "evening";
    }
  }

  function navigate(view) {
    if (!$(`#view-${view}`)) {
      view = "overview";
    }

    $$(".view-panel").forEach(panel => {
      panel.classList.toggle(
        "active",
        panel.id === `view-${view}`
      );
    });

    $$(".side-nav .nav-link").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.view === view
      );
    });

    const activeLink = $(
      `.side-nav .nav-link[data-view="${view}"]`
    );

    const breadcrumb = $("#breadcrumbTitle");

    if (breadcrumb) {
      breadcrumb.textContent = activeLink
        ? activeLink.querySelector("span")?.textContent ||
          activeLink.textContent.trim()
        : view;
    }

    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (view === "performance") {
      requestAnimationFrame(() => renderCharts(true));
    }
  }

  function openSidebar() {
    $("#sidebar")?.classList.add("open");
    $("#sidebarBackdrop")?.classList.add("show");
  }

  function closeSidebar() {
    $("#sidebar")?.classList.remove("open");
    $("#sidebarBackdrop")?.classList.remove("show");
  }

  function animateCounters() {
    $$(".count-up").forEach(element => {
      const target = Number(element.dataset.count || 0);
      const decimals = Number(element.dataset.decimals || 0);
      const start = performance.now();
      const duration = 1000;

      function step(now) {
        const progress = Math.min(
          (now - start) / duration,
          1
        );

        const eased = 1 - Math.pow(1 - progress, 3);

        element.textContent = (
          target * eased
        ).toFixed(decimals);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    });
  }

  // ----------------------------------------------------------
  // 4. ATTENDANCE DASHBOARD
  // ----------------------------------------------------------

  function overallAttendance() {
    const totals = data.subjects.reduce((sum, subject) => {
      sum.attended += subject.attended;
      sum.total += subject.total;
      return sum;
    }, { attended: 0, total: 0 });

    return percent(totals.attended, totals.total);
  }

  function renderSubjectPreview() {
    const preview = $("#subjectPreview");

    if (!preview) return;

    preview.innerHTML = data.subjects.slice(0, 4).map(subject => {
      const p = percent(subject.attended, subject.total);
      const color = p < 75 ? "#ff9b66" : subject.color;

      return `
        <div class="subject-row">
          <div>
            <div class="subject-row-top">
              <span>${escapeHTML(subject.name)}</span>
              <span>${p}%</span>
            </div>

            <div class="subject-track">
              <span style="width:${Math.min(p, 100)}%;background:${color}"></span>
            </div>
          </div>

          <div class="subject-percent" style="color:${color}">
            ${p >= 75 ? "✓" : "!"}
          </div>
        </div>
      `;
    }).join("") || `
      <div class="empty-state">
        <strong>No subjects yet</strong>
        <span>Add a subject in Attendance.</span>
      </div>
    `;

    const total = data.subjects.reduce(
      (sum, subject) => sum + subject.total, 0
    );

    const attended = data.subjects.reduce(
      (sum, subject) => sum + subject.attended, 0
    );

    const overall = overallAttendance();

    if ($("#overallAttendance")) {
      $("#overallAttendance").textContent = `${overall}%`;
    }

    if ($("#attendanceRing")) {
      $("#attendanceRing").style.background =
        `conic-gradient(#6f5ce8 0 ${overall}%, #eeebfb ${overall}% 100%)`;
    }

    if ($("#attendanceTotalLarge")) {
      $("#attendanceTotalLarge").textContent = `${overall}%`;
    }

    if ($("#onTrackCount")) {
      $("#onTrackCount").textContent = data.subjects.filter(
        subject => percent(subject.attended, subject.total) >= 75
      ).length;
    }

    if ($("#classesAttended")) {
      $("#classesAttended").textContent = `${attended} / ${total}`;
    }
  }

  function renderAttendanceTable() {
    const table = $("#attendanceTable");

    if (!table) return;

    const filter = $("#attendanceFilter")?.value || "all";

    const subjects = data.subjects.filter(subject => {
      const p = percent(subject.attended, subject.total);

      return filter === "all" ||
        (filter === "low" && p < 75) ||
        (filter === "good" && p >= 75);
    });

    table.innerHTML = subjects.map(subject => {
      const p = percent(subject.attended, subject.total);
      const color = p < 75 ? "#ff9860" : subject.color;

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <span class="subject-mini-icon"
                    style="background:${color}18;color:${color}">
                <i class="bi ${subject.icon || "bi-book"}"></i>
              </span>
              <span class="table-title">
                ${escapeHTML(subject.name)}
              </span>
            </div>
          </td>

          <td>${escapeHTML(subject.faculty)}</td>

          <td>
            <strong>${subject.attended}</strong> / ${subject.total}
          </td>

          <td>
            <span class="attendance-bar">
              <span style="width:${Math.min(p, 100)}%;background:${color}"></span>
            </span>
            <strong>${p}%</strong>
          </td>

          <td>
            <span class="status-pill ${p >= 75 ? "status-good" : "task-pending"}">
              ${p >= 75 ? "On track" : "Needs attention"}
            </span>
          </td>

          <td>
            <button class="record-btn" data-record-class="${subject.id}">
              <i class="bi bi-plus-lg me-1"></i>Record class
            </button>
          </td>
        </tr>
      `;
    }).join("") || `
      <tr>
        <td colspan="6" class="text-center py-4 text-secondary">
          No subjects match this filter.
        </td>
      </tr>
    `;

    renderSubjectPreview();

    if ($("#perfAttendance")) {
      $("#perfAttendance").textContent = `${overallAttendance()}%`;
    }

    if ($("#perfAttendanceBar")) {
      $("#perfAttendanceBar").style.width =
        `${overallAttendance()}%`;
    }
  }

  function handleSubjectSubmit(event) {
    event.preventDefault();

    const name = $("#subjectName").value.trim();
    const faculty = $("#subjectFaculty").value.trim();
    const attended = Number($("#subjectAttended").value);
    const total = Number($("#subjectTotal").value);

    if (
      !name ||
      !faculty ||
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      total < 1 ||
      attended < 0 ||
      attended > total
    ) {
      showToast("Enter valid subject details.", "warning");
      return;
    }

    const colors = [
      "#7965ec",
      "#ff9f59",
      "#27b5ce",
      "#20b98b"
    ];

    data.subjects.push({
      id: Date.now(),
      name,
      faculty,
      attended,
      total,
      color: colors[data.subjects.length % colors.length],
      icon: "bi-book-half"
    });

    saveData();
    renderAll();

    $("#subjectForm").reset();

    bootstrap.Modal.getInstance(
      $("#subjectModal")
    )?.hide();

    showToast("Subject added successfully.");
  }

  function calculateAttendance() {
    const attended = Number($("#calcAttended")?.value);
    const total = Number($("#calcTotal")?.value);
    const target = Number($("#calcTarget")?.value);
    const result = $("#calcResult");

    if (!result) return;

    if (
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total < 1 ||
      attended > total ||
      target <= 0 ||
      target > 100
    ) {
      result.innerHTML = `
        <small>Check your inputs</small>
        <strong>—</strong>
        <span>Enter valid class counts and a target from 1–100%.</span>
      `;
      return;
    }

    let needed = 0;
    let message = "";

    if (percent(attended, total) >= target) {
      message = "You are already at or above your target.";
    } else if (target === 100) {
      needed = Infinity;
      message = "Attend every remaining class to reach 100%.";
    } else {
      needed = Math.max(
        0,
        Math.ceil(
          (target * total - 100 * attended) / (100 - target)
        )
      );

      message = needed === 1
        ? "Attend the next class to reach your target."
        : `Attend the next ${needed} classes consecutively to reach your target.`;
    }

    result.innerHTML = `
      <small>Classes to attend</small>
      <strong>${Number.isFinite(needed) ? needed : "All"}</strong>
      <span>${escapeHTML(message)}</span>
    `;
  }

  // ----------------------------------------------------------
  // 5. ASSIGNMENT MANAGEMENT
  // ----------------------------------------------------------

  function assignmentIcon(subject) {
    const name = subject.toLowerCase();

    if (name.includes("web") || name.includes("html")) {
      return "bi-code-slash bg-lavender";
    }

    if (name.includes("database") || name.includes("sql")) {
      return "bi-database bg-peach";
    }

    if (name.includes("network")) {
      return "bi-diagram-3 bg-sky";
    }

    if (name.includes("machine") || name.includes("ai")) {
      return "bi-cpu bg-mint";
    }

    return "bi-journal-text bg-lavender";
  }

  function assignmentRow(assignment, full = false) {
    const icon = assignmentIcon(assignment.subject).split(" ");
    const due = niceDate(assignment.due, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const overdue =
      assignment.status !== "Completed" &&
      assignment.due &&
      assignment.due < isoDate(new Date());

    const dueLabel = overdue
      ? `<span style="color:#e97965">${escapeHTML(due)} · Overdue</span>`
      : escapeHTML(due);

    const common = `
      <td>
        <div class="d-flex align-items-center">
          <span class="subject-mini-icon ${icon.slice(1).join(" ")}">
            <i class="bi ${icon[0]}"></i>
          </span>
          <span class="table-title">${escapeHTML(assignment.title)}</span>
        </div>
      </td>

      <td>${escapeHTML(assignment.subject)}</td>
      <td>${dueLabel}</td>
    `;

    if (!full) {
      return `
        <tr>
          ${common}
          <td>
            <span class="task-status ${
              assignment.status === "Completed"
                ? "task-completed"
                : assignment.status === "In progress"
                  ? "task-progress"
                  : "task-pending"
            }">${escapeHTML(assignment.status)}</span>
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        ${common}

        <td>
          <span class="priority-pill priority-${assignment.priority.toLowerCase()}">
            ${escapeHTML(assignment.priority)}
          </span>
        </td>

        <td>
          <select class="form-select assignment-status-select"
                  data-status-id="${assignment.id}"
                  aria-label="Change assignment status">
            <option ${assignment.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${assignment.status === "In progress" ? "selected" : ""}>In progress</option>
            <option ${assignment.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>

        <td>
          <div class="row-actions">
            <button class="row-action"
                    data-edit-assignment="${assignment.id}"
                    aria-label="Edit assignment">
              <i class="bi bi-pencil"></i>
            </button>

            <button class="row-action delete"
                    data-delete-assignment="${assignment.id}"
                    aria-label="Delete assignment">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderAssignmentPreview() {
    const preview = $("#assignmentPreview");

    if (preview) {
      const pending = data.assignments
        .filter(a => a.status !== "Completed")
        .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
        .slice(0, 4);

      preview.innerHTML = pending.map(a => assignmentRow(a)).join("") ||
        `<tr><td colspan="4" class="text-center py-4 text-secondary">
          All caught up! No pending assignments.
        </td></tr>`;
    }

    const activeCount = data.assignments.filter(
      a => a.status !== "Completed"
    ).length;

    if ($("#assignmentNavCount")) {
      $("#assignmentNavCount").textContent = activeCount;
    }

    if ($("#dueSoonCount")) {
      const count = data.assignments.filter(a =>
        a.status !== "Completed" &&
        a.due >= isoDate(new Date()) &&
        a.due <= dateOffset(2)
      ).length;

      $("#dueSoonCount").textContent = `${count} due soon`;
    }
  }

  function renderAssignments() {
    const table = $("#assignmentTable");

    if (!table) return;

    const query = ($("#assignmentSearch")?.value || "")
      .trim().toLowerCase();

    const filter = $("#assignmentFilter")?.value || "all";

    const list = data.assignments
      .filter(assignment => {
        const matchesStatus =
          filter === "all" || assignment.status === filter;

        const searchable = [
          assignment.title,
          assignment.subject,
          assignment.priority,
          assignment.status
        ].join(" ").toLowerCase();

        return matchesStatus && searchable.includes(query);
      })
      .sort((a, b) => (a.due || "").localeCompare(b.due || ""));

    table.innerHTML = list.map(a => assignmentRow(a, true)).join("");

    $("#assignmentEmpty")?.classList.toggle(
      "d-none",
      list.length > 0
    );

    if ($("#assignmentCountLabel")) {
      $("#assignmentCountLabel").textContent =
        `Showing ${list.length} of ${data.assignments.length} assignments`;
    }

    const completed = data.assignments.filter(
      a => a.status === "Completed"
    ).length;

    const pending = data.assignments.filter(
      a => a.status === "Pending"
    ).length;

    const progress = data.assignments.filter(
      a => a.status === "In progress"
    ).length;

    const overdue = data.assignments.filter(
      a => a.status !== "Completed" &&
        a.due < isoDate(new Date())
    ).length;

    const summary = $("#assignmentSummary");

    if (summary) {
      const items = [
        ["bi-journal-text bg-lavender", data.assignments.length, "Total assignments"],
        ["bi-hourglass-split bg-peach", pending, "Pending"],
        ["bi-arrow-repeat bg-sky", progress, "In progress"],
        ["bi-check2-circle bg-mint", completed, "Completed"]
      ];

      summary.innerHTML = items.map(([icon, value, label]) => `
        <div class="assignment-summary-card">
          <span class="summary-icon ${icon.split(" ").slice(1).join(" ")}">
            <i class="bi ${icon.split(" ")[0]}"></i>
          </span>
          <div>
            <strong>${value}</strong>
            <small>${label}</small>
          </div>
        </div>
      `).join("");
    }

    if ($("#perfAssignments")) {
      const completion = data.assignments.length
        ? Math.round(completed / data.assignments.length * 100)
        : 0;

      $("#perfAssignments").textContent = `${completion}%`;

      if ($("#perfAssignmentsBar")) {
        $("#perfAssignmentsBar").style.width = `${completion}%`;
      }
    }

    if (overdue > 0 && $("#assignmentCountLabel")) {
      $("#assignmentCountLabel").textContent += ` · ${overdue} overdue`;
    }
  }

  function openModal(id) {
    const element = document.getElementById(id);

    if (element && typeof bootstrap !== "undefined") {
      bootstrap.Modal.getOrCreateInstance(element).show();
    }
  }

  function resetAssignmentForm() {
    $("#assignmentForm").reset();
    $("#assignmentId").value = "";
    $("#assignmentDue").value = dateOffset(3);
    $("#assignmentStatus").value = "Pending";
    $("#assignmentPriority").value = "Medium";
    $("#assignmentModalTitle").textContent = "Add assignment";
  }

  function openAssignmentEditor(id = null) {
    resetAssignmentForm();

    if (id !== null) {
      const assignment = data.assignments.find(
        item => item.id === Number(id)
      );

      if (!assignment) return;

      $("#assignmentId").value = assignment.id;
      $("#assignmentName").value = assignment.title;
      $("#assignmentSubject").value = assignment.subject;
      $("#assignmentDue").value = assignment.due;
      $("#assignmentPriority").value = assignment.priority;
      $("#assignmentStatus").value = assignment.status;
      $("#assignmentModalTitle").textContent = "Edit assignment";
    }

    openModal("assignmentModal");
  }

  function handleAssignmentSubmit(event) {
    event.preventDefault();

    const id = $("#assignmentId").value;

    const item = {
      id: id ? Number(id) : Date.now(),
      title: $("#assignmentName").value.trim(),
      subject: $("#assignmentSubject").value.trim(),
      due: $("#assignmentDue").value,
      priority: $("#assignmentPriority").value,
      status: $("#assignmentStatus").value
    };

    if (!item.title || !item.subject || !item.due) {
      showToast("Please complete all assignment fields.", "warning");
      return;
    }

    if (id) {
      data.assignments = data.assignments.map(a =>
        a.id === Number(id) ? item : a
      );

      showToast("Assignment updated successfully.");
    } else {
      data.assignments.push(item);
      showToast("New assignment added.");
    }

    saveData();
    renderAll();

    bootstrap.Modal.getInstance($("#assignmentModal"))?.hide();
  }

  // ----------------------------------------------------------
  // 6. NOTICE BOARD
  // ----------------------------------------------------------

  function iconForCategory(category) {
    if (category === "Placement") return "bi-briefcase";
    if (category === "Events") return "bi-stars";
    return "bi-mortarboard";
  }

  function iconClass(category) {
    if (category === "Placement") return "green";
    if (category === "Events") return "orange";
    return "purple";
  }

  function renderNotices() {
    const preview = $("#noticePreview");

    if (preview) {
      preview.innerHTML = data.notices
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 3)
        .map(notice => `
          <div class="notice-item">
            <span class="notice-symbol ${iconClass(notice.category)}">
              <i class="bi ${notice.icon || iconForCategory(notice.category)}"></i>
            </span>

            <div>
              <strong>${escapeHTML(notice.title)}</strong>
              <p>${escapeHTML(notice.description.slice(0, 88))}${
                notice.description.length > 88 ? "…" : ""
              }</p>
              <small>
                ${escapeHTML(notice.category)} ·
                ${escapeHTML(niceDate(notice.date))}
              </small>
            </div>
          </div>
        `).join("") || `<div class="text-secondary small">No notices yet.</div>`;
    }

    const grid = $("#noticeGrid");

    if (!grid) return;

    const notices = data.notices
      .filter(n =>
        currentNoticeFilter === "All" ||
        n.category === currentNoticeFilter
      )
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    grid.innerHTML = notices.map((notice, index) => `
      <article class="notice-card" style="animation-delay:${index * 50}ms">
        <div class="notice-card-top">
          <span class="notice-card-icon notice-symbol ${iconClass(notice.category)}">
            <i class="bi ${notice.icon || iconForCategory(notice.category)}"></i>
          </span>
          <span class="notice-category ${notice.category.toLowerCase()}">
            ${escapeHTML(notice.category)}
          </span>
        </div>

        <h3>${escapeHTML(notice.title)}</h3>
        <p>${escapeHTML(notice.description)}</p>

        <div class="notice-card-footer">
          <span>
            <i class="bi bi-calendar3 me-1"></i>
            ${escapeHTML(niceDate(notice.date))}
          </span>
          <span>
            <i class="bi bi-pin-angle me-1"></i>Campus update
          </span>
        </div>
      </article>
    `).join("") || `
      <div class="empty-state">
        <i class="bi bi-megaphone"></i>
        <strong>No notices in this category</strong>
        <span>Try another category or post a new notice.</span>
      </div>
    `;
  }

  function handleNoticeSubmit(event) {
    event.preventDefault();

    const title = $("#noticeTitle").value.trim();
    const category = $("#noticeCategory").value;
    const description = $("#noticeDescription").value.trim();

    if (!title || !description) return;

    data.notices.unshift({
      id: Date.now(),
      title,
      category,
      description,
      date: isoDate(new Date()),
      icon: iconForCategory(category)
    });

    saveData();
    renderNotices();
    renderAll();

    $("#noticeForm").reset();

    bootstrap.Modal.getInstance($("#noticeModal"))?.hide();

    showToast("Notice published successfully.");
  }

  // ----------------------------------------------------------
  // 7. CAMPUS EVENTS
  // ----------------------------------------------------------

  function renderEvents() {
    const events = data.events
      .slice()
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    if ($("#eventCountBadge")) {
      $("#eventCountBadge").textContent =
        `${events.length} event${events.length === 1 ? "" : "s"}`;
    }

    const preview = $("#eventPreview");

    if (preview) {
      preview.innerHTML = events.slice(0, 3).map(event => {
        const date = new Date(`${event.date}T12:00:00`);

        return `
          <div class="event-mini">
            <div class="event-date-box">
              <strong>${date.getDate()}</strong>
              <small>${date.toLocaleDateString(undefined, {
                month: "short"
              }).toUpperCase()}</small>
            </div>

            <div class="event-mini-copy">
              <strong>${escapeHTML(event.title)}</strong>
              <small>
                <i class="bi bi-clock me-1"></i>
                ${escapeHTML(event.time || "Time TBA")} ·
                ${escapeHTML(event.location)}
              </small>
            </div>
          </div>
        `;
      }).join("") || `<div class="text-secondary small">No upcoming events.</div>`;
    }

    const grid = $("#eventsGrid");

    if (!grid) return;

    grid.innerHTML = events.map((event, index) => `
      <article class="event-card" style="animation-delay:${index * 60}ms">
        <div class="event-card-banner ${event.banner || "banner-violet"}">
          <i class="bi ${event.icon || "bi-calendar-event"}"></i>
        </div>

        <div class="event-card-body">
          <div class="event-card-meta">
            <span class="soft-badge">${escapeHTML(event.category)}</span>
            <span>
              <i class="bi bi-calendar3 me-1"></i>
              ${escapeHTML(niceDate(event.date, {
                month: "short",
                day: "numeric"
              }))}
            </span>
          </div>

          <h3>${escapeHTML(event.title)}</h3>
          <p>${escapeHTML(event.description || "Join the campus community.")}</p>

          <div class="event-card-location">
            <i class="bi bi-geo-alt"></i>
            ${escapeHTML(event.location)}
            <span class="ms-auto">
              <i class="bi bi-clock me-1"></i>
              ${escapeHTML(event.time || "TBA")}
            </span>
          </div>

          <div class="event-card-footer">
            <small><i class="bi bi-people me-1"></i>Campus community</small>
            <button class="event-rsvp ${event.joined ? "joined" : ""}"
                    data-rsvp="${event.id}">
              ${event.joined ? "✓ Interested" : "I'm interested"}
            </button>
          </div>
        </div>
      </article>
    `).join("") || `
      <div class="empty-state">
        <i class="bi bi-calendar-event"></i>
        <strong>No events scheduled</strong>
        <span>Add a campus event to populate this page.</span>
      </div>
    `;
  }

  function handleEventSubmit(event) {
    event.preventDefault();

    const title = $("#eventName").value.trim();
    const date = $("#eventDate").value;
    const time = $("#eventTime").value;
    const location = $("#eventLocation").value.trim();
    const category = $("#eventCategory").value;

    if (!title || !date || !time || !location) return;

    const banners = [
      "banner-violet",
      "banner-orange",
      "banner-cyan",
      "banner-green"
    ];

    const icons = {
      Workshop: "bi-lightbulb-fill",
      Academic: "bi-mortarboard-fill",
      Community: "bi-tree-fill",
      Placement: "bi-people-fill"
    };

    data.events.push({
      id: Date.now(),
      title,
      date,
      time,
      location,
      category,
      icon: icons[category] || "bi-calendar-event",
      banner: banners[data.events.length % banners.length],
      description: "Join the campus community for this event.",
      joined: false
    });

    saveData();
    renderEvents();

    $("#eventForm").reset();

    bootstrap.Modal.getInstance($("#eventModal"))?.hide();

    showToast("Campus event added.");
  }

  // ----------------------------------------------------------
  // 8. PERFORMANCE CHARTS
  // ----------------------------------------------------------

  function renderCharts(force = false) {
    if (typeof Chart === "undefined") return;

    const dark = document.body.classList.contains("dark-mode");
    const textColor = dark ? "#a09fbb" : "#9695ad";
    const gridColor = dark ? "#303147" : "#f0eff7";

    const monthly = $("#performancePeriod")?.value === "month";

    const labels = monthly
      ? ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]
      : ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];

    const attendance = monthly
      ? [72, 75, 77, 79, 83, overallAttendance()]
      : [76, 79, 75, 82, 84, overallAttendance()];

    const completed = data.assignments.filter(
      a => a.status === "Completed"
    ).length;

    const assignmentProgress = Math.round(
      completed / Math.max(data.assignments.length, 1) * 100
    );

    const assignment = [55, 61, 58, 70, 75, assignmentProgress];

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: dark ? "#27283c" : "#292344",
          padding: 11,
          cornerRadius: 9
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: textColor,
            callback: value => `${value}%`
          },
          grid: { color: gridColor },
          border: { display: false }
        }
      }
    };

    function buildChart(canvasId) {
      const canvas = $(`#${canvasId}`);

      if (!canvas) return;

      if (charts[canvasId]) {
        charts[canvasId].destroy();
      }

      const context = canvas.getContext("2d");

      const gradient = context.createLinearGradient(0, 0, 0, 240);

      gradient.addColorStop(0, "rgba(119,99,239,.22)");
      gradient.addColorStop(1, "rgba(119,99,239,0)");

      charts[canvasId] = new Chart(context, {
        type: "line",

        data: {
          labels,
          datasets: [
            {
              label: "Attendance",
              data: attendance,
              borderColor: "#7865ec",
              backgroundColor: gradient,
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius: 3
            },
            {
              label: "Assignments",
              data: assignment,
              borderColor: "#ffab65",
              backgroundColor: "transparent",
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius: 3
            }
          ]
        },

        options
      });
    }

    ["performanceChart", "performanceChartLarge"].forEach(id => {
      if (force || !charts[id]) {
        buildChart(id);
      }
    });
  }

  // ----------------------------------------------------------
  // 9. RENDER ALL COMPONENTS
  // ----------------------------------------------------------

  function renderAll() {
    renderSubjectPreview();
    renderAssignmentPreview();
    renderAssignments();
    renderNotices();
    renderEvents();
    renderAttendanceTable();
    renderCharts(true);
  }

  // ----------------------------------------------------------
  // 10. DARK MODE
  // ----------------------------------------------------------

  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    data.theme = document.body.classList.contains("dark-mode")
      ? "dark"
      : "light";

    $("#themeToggle").innerHTML = `
      <i class="bi ${
        data.theme === "dark" ? "bi-sun" : "bi-moon-stars"
      }"></i>
    `;

    saveData();
    renderCharts(true);
  }

  // ----------------------------------------------------------
  // 11. CSV REPORT DOWNLOAD
  // ----------------------------------------------------------

  function exportReport() {
    const rows = [
      ["Smart Campus 360 - Demo Performance Report"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Subject", "Faculty", "Classes Attended", "Total Classes", "Attendance %"],

      ...data.subjects.map(subject => [
        subject.name,
        subject.faculty,
        subject.attended,
        subject.total,
        `${percent(subject.attended, subject.total)}%`
      ]),

      [],
      ["Assignment", "Subject", "Due Date", "Priority", "Status"],

      ...data.assignments.map(assignment => [
        assignment.title,
        assignment.subject,
        assignment.due,
        assignment.priority,
        assignment.status
      ])
    ];

    const csv = rows.map(row =>
      row.map(value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "smart-campus-performance-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showToast("Performance report exported as CSV.");
  }

  // ----------------------------------------------------------
  // 12. GLOBAL SEARCH
  // ----------------------------------------------------------

  function globalSearch(query) {
    const q = query.trim().toLowerCase();

    if (!q) return;

    const assignment = data.assignments.find(a =>
      `${a.title} ${a.subject}`.toLowerCase().includes(q)
    );

    if (assignment) {
      navigate("assignments");

      $("#assignmentSearch").value = query;
      renderAssignments();

      return;
    }

    const notice = data.notices.find(n =>
      `${n.title} ${n.description} ${n.category}`
        .toLowerCase().includes(q)
    );

    if (notice) {
      currentNoticeFilter = "All";

      $$("[data-notice-filter]").forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.noticeFilter === "All"
        );
      });

      navigate("notices");
      renderNotices();

      return;
    }

    const subject = data.subjects.find(s =>
      `${s.name} ${s.faculty}`.toLowerCase().includes(q)
    );

    if (subject) {
      navigate("attendance");

      if ($("#attendanceFilter")) {
        $("#attendanceFilter").value = "all";
      }

      renderAttendanceTable();

      return;
    }

    const campusEvent = data.events.find(e =>
      `${e.title} ${e.location} ${e.category}`
        .toLowerCase().includes(q)
    );

    if (campusEvent) {
      navigate("events");
      return;
    }

    showToast(`No results found for "${query}".`, "warning");
  }

  // ----------------------------------------------------------
  // 13. QUICK ADD MENU
  // ----------------------------------------------------------

  function handleQuickAdd(type) {
    $("#quickAddMenu")?.classList.add("d-none");

    if (type === "assignment") {
      openAssignmentEditor();
    }

    if (type === "notice") {
      openModal("noticeModal");
    }

    if (type === "event") {
      openModal("eventModal");
    }
  }

  // ----------------------------------------------------------
  // 14. EVENT LISTENERS
  // ----------------------------------------------------------

  function bindEvents() {
    // Sidebar navigation
    $$(".side-nav .nav-link").forEach(button => {
      button.addEventListener("click", () => {
        navigate(button.dataset.view);
      });
    });

    $$("[data-navigate]").forEach(button => {
      button.addEventListener("click", () => {
        navigate(button.dataset.navigate);
      });
    });

    $("#menuToggle")?.addEventListener("click", openSidebar);
    $("#closeSidebar")?.addEventListener("click", closeSidebar);
    $("#sidebarBackdrop")?.addEventListener("click", closeSidebar);

    // Theme
    $("#themeToggle")?.addEventListener("click", toggleTheme);

    // Notifications
    $("#markRead")?.addEventListener("click", () => {
      const pip = $(".notification-pip");

      if (pip) pip.style.display = "none";

      showToast("Notifications marked as read.");
    });

    // Quick add
    $("#quickAddBtn")?.addEventListener("click", () => {
      $("#quickAddMenu")?.classList.toggle("d-none");
    });

    $$("[data-quick]").forEach(button => {
      button.addEventListener("click", () => {
        handleQuickAdd(button.dataset.quick);
      });
    });

    document.addEventListener("click", event => {
      if (
        !event.target.closest("#quickAddBtn") &&
        !event.target.closest("#quickAddMenu")
      ) {
        $("#quickAddMenu")?.classList.add("d-none");
      }
    });

    // Assignment forms
    $("#newAssignmentBtn")?.addEventListener("click", () => {
      openAssignmentEditor();
    });

    $("#assignmentForm")?.addEventListener(
      "submit",
      handleAssignmentSubmit
    );

    $("#assignmentSearch")?.addEventListener(
      "input",
      renderAssignments
    );

    $("#assignmentFilter")?.addEventListener(
      "change",
      renderAssignments
    );

    // Attendance forms
    $("#addSubjectBtn")?.addEventListener("click", () => {
      openModal("subjectModal");
    });

    $("#subjectForm")?.addEventListener(
      "submit",
      handleSubjectSubmit
    );

    $("#attendanceFilter")?.addEventListener(
      "change",
      renderAttendanceTable
    );

    $("#calculateAttendance")?.addEventListener(
      "click",
      calculateAttendance
    );

    ["calcAttended", "calcTotal", "calcTarget"].forEach(id => {
      $(`#${id}`)?.addEventListener("keydown", event => {
        if (event.key === "Enter") calculateAttendance();
      });
    });

    // Notice forms
    $("#addNoticeBtn")?.addEventListener("click", () => {
      openModal("noticeModal");
    });

    $("#noticeForm")?.addEventListener(
      "submit",
      handleNoticeSubmit
    );

    $$("[data-notice-filter]").forEach(button => {
      button.addEventListener("click", () => {
        currentNoticeFilter = button.dataset.noticeFilter;

        $$("[data-notice-filter]").forEach(item => {
          item.classList.toggle("active", item === button);
        });

        renderNotices();
      });
    });

    // Event forms
    $("#addEventBtn")?.addEventListener("click", () => {
      openModal("eventModal");
    });

    $("#eventForm")?.addEventListener(
      "submit",
      handleEventSubmit
    );

    // Performance
    $("#performancePeriod")?.addEventListener("change", () => {
      renderCharts(true);
    });

    $("#downloadReport")?.addEventListener(
      "click",
      exportReport
    );

    // Dynamic table actions
    document.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit-assignment]");

      if (edit) {
        openAssignmentEditor(edit.dataset.editAssignment);
        return;
      }

      const remove = event.target.closest("[data-delete-assignment]");

      if (remove) {
        const id = Number(remove.dataset.deleteAssignment);

        const assignment = data.assignments.find(
          item => item.id === id
        );

        if (assignment && confirm(`Delete "${assignment.title}"?`)) {
          data.assignments = data.assignments.filter(
            item => item.id !== id
          );

          saveData();
          renderAll();

          showToast("Assignment deleted.");
        }

        return;
      }

      const record = event.target.closest("[data-record-class]");

      if (record) {
        const subject = data.subjects.find(
          item => item.id === Number(record.dataset.recordClass)
        );

        if (!subject) return;

        subject.attended++;
        subject.total++;

        saveData();
        renderAll();

        showToast(`Attendance recorded for ${subject.name}.`);
        return;
      }

      const rsvp = event.target.closest("[data-rsvp]");

      if (rsvp) {
        const campusEvent = data.events.find(
          item => item.id === Number(rsvp.dataset.rsvp)
        );

        if (!campusEvent) return;

        campusEvent.joined = !campusEvent.joined;

        saveData();
        renderEvents();

        showToast(
          campusEvent.joined
            ? `Marked interest in ${campusEvent.title}.`
            : `Removed interest in ${campusEvent.title}.`
        );
      }
    });

    // Assignment status dropdown
    document.addEventListener("change", event => {
      const select = event.target.closest("[data-status-id]");

      if (!select) return;

      const assignment = data.assignments.find(
        item => item.id === Number(select.dataset.statusId)
      );

      if (!assignment) return;

      assignment.status = select.value;

      saveData();
      renderAll();

      showToast("Assignment status updated.");
    });

    // Search and keyboard shortcuts
    $("#globalSearch")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        globalSearch(event.currentTarget.value);
        event.currentTarget.blur();
      }
    });

    document.addEventListener("keydown", event => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        $("#globalSearch")?.focus();
      }

      if (event.key === "Escape") {
        $("#quickAddMenu")?.classList.add("d-none");
        closeSidebar();
      }
    });

    // Demo profile
    $("#profileButton")?.addEventListener("click", () => {
      showToast(
        "Profile settings can be connected to a backend later.",
        "warning"
      );
    });
  }

  // ----------------------------------------------------------
  // 15. INITIALIZE APPLICATION
  // ----------------------------------------------------------

  function init() {
    setToday();

    // Restore the saved theme
    if (data.theme === "dark") {
      document.body.classList.add("dark-mode");

      if ($("#themeToggle")) {
        $("#themeToggle").innerHTML =
          '<i class="bi bi-sun"></i>';
      }
    }

    // Set default form values
    if ($("#assignmentDue")) {
      $("#assignmentDue").min = isoDate(new Date());
      $("#assignmentDue").value = dateOffset(3);
    }

    if ($("#eventDate")) {
      $("#eventDate").min = isoDate(new Date());
      $("#eventDate").value = dateOffset(2);
    }

    if ($("#eventTime")) {
      $("#eventTime").value = "10:00";
    }

    if ($("#calcAttended")) {
      $("#calcAttended").value = 36;
    }

    if ($("#calcTotal")) {
      $("#calcTotal").value = 45;
    }

    if ($("#calcTarget")) {
      $("#calcTarget").value = 75;
    }

    bindEvents();
    renderAll();
    animateCounters();
    calculateAttendance();
  }

  // Wait until HTML has loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();