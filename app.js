// --- Data og state ---
let users = JSON.parse(localStorage.getItem('users') || '{}'); // { brugernavn: { email, password } }
let currentUser = null;
let projects = JSON.parse(localStorage.getItem('projects') || '[]'); // projekter
let invitations = JSON.parse(localStorage.getItem('invitations') || '[]'); // {projectName, fromUser, toUser}
let selectedProject = null;

// --- Helper funktioner ---
function saveAll() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('projects', JSON.stringify(projects));
  localStorage.setItem('invitations', JSON.stringify(invitations));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- LOGIN / REGISTRATION ---
const regUsername = document.getElementById('reg-username');
const regEmail = document.getElementById('reg-email');
const regPassword = document.getElementById('reg-password');
const registerBtn = document.getElementById('register-btn');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const loginSlide = document.getElementById('login-slide');
const appSlide = document.getElementById('app-slide');

registerBtn.addEventListener('click', () => {
  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;

  loginError.textContent = '';

  if (username.length < 3) {
    loginError.textContent = 'Brugernavn skal være mindst 3 tegn.';
    return;
  }
  if (!email.includes('@')) {
    loginError.textContent = 'Indtast en gyldig email.';
    return;
  }
  if (password.length < 6) {
    loginError.textContent = 'Adgangskode skal være mindst 6 tegn.';
    return;
  }
  if (users[username]) {
    loginError.textContent = 'Brugernavn findes allerede.';
    return;
  }
  // Gem bruger
  users[username] = { email, password };
  saveAll();
  alert('Konto oprettet! Du kan nu logge ind.');
  regUsername.value = '';
  regEmail.value = '';
  regPassword.value = '';
});

loginBtn.addEventListener('click', () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  loginError.textContent = '';

  if (!users[username]) {
    loginError.textContent = 'Brugernavn findes ikke.';
    return;
  }
  if (users[username].password !== password) {
    loginError.textContent = 'Forkert adgangskode.';
    return;
  }
  currentUser = username;
  initApp();
});

// --- App init efter login ---
function initApp() {
  loginSlide.style.display = 'none';
  appSlide.style.display = 'block';
  renderProjects();
  renderInvitations();
  renderTeamChat();
  renderBugChat();
  updateInviteBadge();
  selectTab('tab-projects');
}

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', () => {
  currentUser = null;
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.textContent = '';
  appSlide.style.display = 'none';
  loginSlide.style.display = 'block';
});

// --- Navigation tabs ---
const tabs = ['tab-projects', 'tab-invitations', 'tab-chat', 'tab-bugchat'];
tabs.forEach(tabId => {
  document.getElementById(tabId).addEventListener('click', () => {
    selectTab(tabId);
  });
});
function selectTab(tabId) {
  // Tabs buttons
  tabs.forEach(id => {
    document.getElementById(id).classList.toggle('active', id === tabId);
  });
  // Slides
  document.getElementById('projects-slide').style.display = (tabId === 'tab-projects') ? 'block' : 'none';
  document.getElementById('invitations-slide').style.display = (tabId === 'tab-invitations') ? 'block' : 'none';
  document.getElementById('teamchat-slide').style.display = (tabId === 'tab-chat') ? 'block' : 'none';
  document.getElementById('bugchat-slide').style.display = (tabId === 'tab-bugchat') ? 'block' : 'none';
}

// --- Projekter ---
// Elementer
const newProjectInput = document.getElementById('new-project-input');
const addProjectBtn = document.getElementById('add-project-btn');
const projectError = document.getElementById('project-error');
const projectsList = document.getElementById('projects-list');
const projectDetails = document.getElementById('project-details');
const projectTitle = document.getElementById('project-title');

const newTaskInput = document.getElementById('new-task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

const inviteUserInput = document.getElementById('invite-user-input');
const inviteBtn = document.getElementById('invite-btn');
const inviteMsg = document.getElementById('invite-msg');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// Tilføj nyt projekt
addProjectBtn.addEventListener('click', () => {
  const name = newProjectInput.value.trim();
  if (name.length < 3) {
    projectError.textContent = 'Projektnavn skal være mindst 3 tegn.';
    return;
  }
  if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    projectError.textContent = 'Projekt med dette navn findes allerede.';
    return;
  }
  projectError.textContent = '';
  projects.push({
    name,
    owner: currentUser,
    members: [currentUser],
    tasks: [],
    chat: []
  });
  saveAll();
  newProjectInput.value = '';
  renderProjects();
});

// Render projekter i liste
function renderProjects() {
  projectsList.innerHTML = '';
  const userProjects = projects.filter(p => p.members.includes(currentUser));
  if (userProjects.length === 0) {
    projectsList.innerHTML = '<p>Du har ingen projekter.</p>';
  }
  userProjects.forEach(proj => {
    const div = document.createElement('div');
    div.textContent = proj.name + (proj.owner === currentUser ? ' (Ejer)' : '');
    div.className = 'project-item' + (selectedProject && selectedProject.name === proj.name ? ' active' : '');
    div.onclick = () => selectProject(proj.name);
    projectsList.appendChild(div);
  });
  projectDetails.style.display = 'none';
  selectedProject = null;
}

// Vælg projekt og vis detaljer
function selectProject(name) {
  selectedProject = projects.find(p => p.name === name);
  projectTitle.textContent = selectedProject.name + (selectedProject.owner === currentUser ? ' (Ejer)' : '');
  renderTasks();
  renderChat();
  projectDetails.style.display = 'block';
  inviteMsg.textContent = '';
  chatInput.value = '';
  chatSendBtn.disabled = true;
}

// Opgaver
addTaskBtn.addEventListener('click', () => {
  if (!selectedProject) return;
  const task = newTaskInput.value.trim();
  if (task.length === 0) return;
  selectedProject.tasks.push({ text: task, completed: false });
  saveAll();
  newTaskInput.value = '';
  renderTasks();
});
function renderTasks() {
  taskList.innerHTML = '';
  selectedProject.tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.textContent = task.text;
    if (task.completed) li.classList.add('completed');
    li.onclick = () => {
      task.completed = !task.completed;
      saveAll();
      renderTasks();
    };
    taskList.appendChild(li);
  });
}

// Inviter brugere (kun ejer kan invitere)
inviteBtn.addEventListener('click', () => {
  if (!selectedProject) return;
  if (selectedProject.owner !== currentUser) {
    inviteMsg.textContent = 'Kun ejeren kan invitere brugere.';
    inviteMsg.className = 'error';
    return;
  }
  const userToInvite = inviteUserInput.value.trim();
  if (!userToInvite) return;
  if (!users[userToInvite]) {
    inviteMsg.textContent = 'Brugeren findes ikke.';
    inviteMsg.className = 'error';
    return;
  }
  if (selectedProject.members.includes(userToInvite)) {
    inviteMsg.textContent = 'Brugeren er allerede medlem.';
    inviteMsg.className = 'error';
    return;
  }
  // Check om invitation allerede findes
  const exists = invitations.find(inv => inv.projectName === selectedProject.name && inv.toUser === userToInvite);
  if (exists) {
    inviteMsg.textContent = 'Brugeren har allerede en invitation til dette projekt.';
    inviteMsg.className = 'error';
    return;
  }
  // Opret invitation
  invitations.push({
    projectName: selectedProject.name,
    fromUser: currentUser,
    toUser: userToInvite
  });
  saveAll();
  inviteMsg.textContent = 'Invitation sendt!';
  inviteMsg.className = 'success';
  inviteUserInput.value = '';
  updateInviteBadge();
  renderInvitations();
});

// Chat i projekt
chatInput.addEventListener('input', () => {
  chatSendBtn.disabled = chatInput.value.trim().length === 0;
});
chatSendBtn.addEventListener('click', () => {
  if (!selectedProject) return;
  const message = chatInput.value.trim();
  if (!message) return;
  selectedProject.chat.push({
    user: currentUser,
    message,
    time: new Date().toLocaleTimeString()
  });
  saveAll();
  chatInput.value = '';
  chatSendBtn.disabled = true;
  renderChat();
});
function renderChat() {
  chatMessages.innerHTML = '';
  if (!selectedProject) return;
  selectedProject.chat.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="user">${escapeHtml(msg.user)}</span>: <span class="message">${escapeHtml(msg.message)}</span> <span class="time">[${msg.time}]</span>`;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Invitationer ---
const invitationList = document.getElementById('invitation-list');
function renderInvitations() {
  const userInvitations = invitations.filter(inv => inv.toUser === currentUser);
  if (userInvitations.length === 0) {
    invitationList.innerHTML = 'Ingen invitationer.';
    updateInviteBadge();
    return;
  }
  invitationList.innerHTML = '';
  userInvitations.forEach((inv, i) => {
    const div = document.createElement('div');
    div.textContent = `${inv.fromUser} har inviteret dig til projektet "${inv.projectName}"`;
    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Acceptér';
    acceptBtn.style.marginLeft = '10px';
    acceptBtn.onclick = () => {
      // Tilføj bruger til projekt
      const proj = projects.find(p => p.name === inv.projectName);
      if (proj && !proj.members.includes(currentUser)) {
        proj.members.push(currentUser);
        saveAll();
      }
      // Fjern invitation
      invitations.splice(invitations.indexOf(inv), 1);
      saveAll();
      renderInvitations();
      renderProjects();
      updateInviteBadge();
      alert(`Du er nu medlem af projektet "${inv.projectName}".`);
    };
    div.appendChild(acceptBtn);

    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Afvis';
    rejectBtn.style.marginLeft = '5px';
    rejectBtn.onclick = () => {
      invitations.splice(invitations.indexOf(inv), 1);
      saveAll();
      renderInvitations();
      updateInviteBadge();
    };
    div.appendChild(rejectBtn);

    invitationList.appendChild(div);
  });
  updateInviteBadge();
}
function updateInviteBadge() {
  const count = invitations.filter(inv => inv.toUser === currentUser).length;
  const badge = document.getElementById('invite-count');
  if (count > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = count;
  } else {
    badge.style.display = 'none';
  }
}

// --- Team Chat ---
// Simpel global chat (alle brugere kan sende beskeder her)
const teamchatMessages = document.getElementById('teamchat-messages');
const teamchatInput = document.getElementById('teamchat-input');
const teamchatSendBtn = document.getElementById('teamchat-send-btn');

let teamChatData = JSON.parse(localStorage.getItem('teamChat') || '[]');

teamchatInput.addEventListener('input', () => {
  teamchatSendBtn.disabled = teamchatInput.value.trim().length === 0;
});
teamchatSendBtn.addEventListener('click', () => {
  const msg = teamchatInput.value.trim();
  if (!msg) return;
  teamChatData.push({
    user: currentUser,
    message: msg,
    time: new Date().toLocaleTimeString()
  });
  localStorage.setItem('teamChat', JSON.stringify(teamChatData));
  teamchatInput.value = '';
  teamchatSendBtn.disabled = true;
  renderTeamChat();
});
function renderTeamChat() {
  teamchatMessages.innerHTML = '';
  teamChatData.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="user">${escapeHtml(msg.user)}</span>: <span class="message">${escapeHtml(msg.message)}</span> <span class="time">[${msg.time}]</span>`;
    teamchatMessages.appendChild(div);
  });
  teamchatMessages.scrollTop = teamchatMessages.scrollHeight;
}

// --- Bug rapporterings chatbot ---
// Simpel bot: Gemmer beskeder som bugs i localStorage pr projekt
const bugMessages = document.getElementById('bug-messages');
const bugInput = document.getElementById('bug-input');
const bugSendBtn = document.getElementById('bug-send-btn');

let bugReports = JSON.parse(localStorage.getItem('bugReports') || '{}');
// bugReports = { projectName: [ {user, message, time} ] }

bugInput.addEventListener('input', () => {
  bugSendBtn.disabled = bugInput.value.trim().length === 0;
});
bugSendBtn.addEventListener('click', () => {
  const msg = bugInput.value.trim();
  if (!msg) return;
  if (!selectedProject) {
    alert('Vælg venligst et projekt for at rapportere bugs.');
    return;
  }
  if (!bugReports[selectedProject.name]) bugReports[selectedProject.name] = [];
  bugReports[selectedProject.name].push({
    user: currentUser,
    message: msg,
    time: new Date().toLocaleTimeString()
  });
  localStorage.setItem('bugReports', JSON.stringify(bugReports));
  bugInput.value = '';
  bugSendBtn.disabled = true;
  renderBugChat();
});

function renderBugChat() {
  bugMessages.innerHTML = '';
  if (!selectedProject) {
    bugMessages.innerHTML = '<i>Vælg et projekt i "Projekter" for at se fejl-rapporter.</i>';
    return;
  }
  const bugs = bugReports[selectedProject.name] || [];
  if (bugs.length === 0) {
    bugMessages.innerHTML = 'Ingen fejl-rapporter endnu.';
    return;
  }
  bugs.forEach(bug => {
    const div = document.createElement('div');
    div.className = 'bug-message';
    div.innerHTML = `<span class="user">${escapeHtml(bug.user)}</span>: <span class="message">${escapeHtml(bug.message)}</span> <span class="time">[${bug.time}]</span>`;
    bugMessages.appendChild(div);
  });
  bugMessages.scrollTop = bugMessages.scrollHeight;
}
