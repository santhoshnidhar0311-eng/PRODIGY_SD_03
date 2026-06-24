// Application State
let contacts = [];
let activeFilter = 'all';
let searchQuery = '';
let sortBy = 'name-asc';
let viewMode = 'grid';
let contactToDeleteId = null;

// Constant Categories
const CATEGORIES = ['Personal', 'Work', 'Family', 'Other'];

// Avatar Gradient Palettes (Premium look)
const GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #eab308)',
  'linear-gradient(135deg, #ef4444, #f43f5e)',
  'linear-gradient(135deg, #84cc16, #10b981)'
];

// DOM Elements Cache
const DOM = {
  contactsContainer: document.getElementById('contacts-container'),
  emptyState: document.getElementById('empty-state'),
  viewTitle: document.getElementById('view-title'),
  resultsCount: document.getElementById('results-count'),
  searchInput: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  sortSelect: document.getElementById('sort-select'),
  viewGridBtn: document.getElementById('view-grid'),
  viewListBtn: document.getElementById('view-list'),
  
  // Navigation
  navItems: document.querySelectorAll('.sidebar-nav li:not(.nav-divider)'),
  countAll: document.getElementById('count-all'),
  countFavorite: document.getElementById('count-favorite'),
  countPersonal: document.getElementById('count-personal'),
  countWork: document.getElementById('count-work'),
  countFamily: document.getElementById('count-family'),
  countOther: document.getElementById('count-other'),
  
  // Stats
  statTotalContacts: document.getElementById('stat-total-contacts'),
  statFavorites: document.getElementById('stat-favorites'),
  statRecent: document.getElementById('stat-recent'),
  dateDisplay: document.getElementById('date-display'),
  
  // Modals
  contactModal: document.getElementById('contact-modal'),
  deleteModal: document.getElementById('delete-modal'),
  contactForm: document.getElementById('contact-form'),
  modalTitle: document.getElementById('modal-title'),
  contactIdInput: document.getElementById('contact-id'),
  contactNameInput: document.getElementById('contact-name'),
  contactPhoneInput: document.getElementById('contact-phone'),
  contactEmailInput: document.getElementById('contact-email'),
  contactTagSelect: document.getElementById('contact-tag'),
  contactFavoriteCheckbox: document.getElementById('contact-favorite'),
  deleteContactName: document.getElementById('delete-contact-name'),
  
  // Buttons
  btnAddNav: document.getElementById('btn-add-contact-nav'),
  btnAddEmpty: document.getElementById('btn-add-contact-empty'),
  btnExport: document.getElementById('btn-export'),
  btnImportTrigger: document.getElementById('btn-import-trigger'),
  importFileInput: document.getElementById('import-file'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  btnCloseDelete: document.getElementById('btn-close-delete'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),
  toastContainer: document.getElementById('toast-container')
};

// Initial Sample Data (if localStorage is empty)
const SAMPLE_CONTACTS = [
  {
    id: 'sample-1',
    name: 'Sarah Connor',
    phone: '+1 (555) 911-2029',
    email: 'sarah.connor@resistance.net',
    tag: 'Work',
    favorite: true,
    createdAt: Date.now() - 3600000 * 2 // 2 hours ago
  },
  {
    id: 'sample-2',
    name: 'Alex Mercer',
    phone: '+1 (555) 762-4231',
    email: 'mercer@gentek.org',
    tag: 'Personal',
    favorite: false,
    createdAt: Date.now() - 3600000 * 12 // 12 hours ago
  },
  {
    id: 'sample-3',
    name: 'Emily Watson',
    phone: '+1 (555) 234-5678',
    email: 'emily.w@family.org',
    tag: 'Family',
    favorite: true,
    createdAt: Date.now() - 3600000 * 48 // 2 days ago
  }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadContacts();
  setupEventListeners();
  updateDateDisplay();
  render();
});

// Load Contacts from localStorage
function loadContacts() {
  const stored = localStorage.getItem('contactsphere_contacts');
  if (stored) {
    try {
      contacts = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse contacts from localStorage', e);
      contacts = [...SAMPLE_CONTACTS];
    }
  } else {
    // Inject sample contacts on first run
    contacts = [...SAMPLE_CONTACTS];
    saveToLocalStorage();
  }
}

// Save Contacts to localStorage
function saveToLocalStorage() {
  localStorage.setItem('contactsphere_contacts', JSON.stringify(contacts));
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation filters
  DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
      DOM.navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      activeFilter = item.getAttribute('data-filter');
      render();
    });
  });

  // Search input
  DOM.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    DOM.clearSearch.style.display = searchQuery ? 'flex' : 'none';
    render();
  });

  // Clear search button
  DOM.clearSearch.addEventListener('click', () => {
    DOM.searchInput.value = '';
    searchQuery = '';
    DOM.clearSearch.style.display = 'none';
    DOM.searchInput.focus();
    render();
  });

  // Sort select
  DOM.sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    render();
  });

  // View toggle buttons
  DOM.viewGridBtn.addEventListener('click', () => {
    viewMode = 'grid';
    DOM.viewGridBtn.classList.add('active');
    DOM.viewListBtn.classList.remove('active');
    DOM.contactsContainer.className = 'contacts-container grid-view';
    render();
  });

  DOM.viewListBtn.addEventListener('click', () => {
    viewMode = 'list';
    DOM.viewListBtn.classList.add('active');
    DOM.viewGridBtn.classList.remove('active');
    DOM.contactsContainer.className = 'contacts-container list-view';
    render();
  });

  // Modal open buttons
  DOM.btnAddNav.addEventListener('click', () => openContactModal());
  DOM.btnAddEmpty.addEventListener('click', () => openContactModal());

  // Modal close buttons
  DOM.btnCloseModal.addEventListener('click', closeContactModal);
  DOM.btnCancelModal.addEventListener('click', closeContactModal);
  DOM.contactModal.addEventListener('click', (e) => {
    if (e.target === DOM.contactModal) closeContactModal();
  });

  // Delete modal close
  DOM.btnCloseDelete.addEventListener('click', closeDeleteModal);
  DOM.btnCancelDelete.addEventListener('click', closeDeleteModal);
  DOM.btnConfirmDelete.addEventListener('click', executeDeleteContact);
  DOM.deleteModal.addEventListener('click', (e) => {
    if (e.target === DOM.deleteModal) closeDeleteModal();
  });

  // Contact form submission
  DOM.contactForm.addEventListener('submit', handleContactFormSubmit);

  // Import / Export Buttons
  DOM.btnExport.addEventListener('click', exportContacts);
  DOM.btnImportTrigger.addEventListener('click', () => DOM.importFileInput.click());
  DOM.importFileInput.addEventListener('change', handleImportFile);

  // Handle ESC key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactModal();
      closeDeleteModal();
    }
  });
}

// Display Current Date
function updateDateDisplay() {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  DOM.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
}

// Get Dynamic Avatar Background based on name hash
function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

// Get Initials from Name
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

// Toast System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'check_circle';
  if (type === 'error') icon = 'error';
  if (type === 'info') icon = 'info';

  toast.innerHTML = `
    <span class="material-symbols-rounded">${icon}</span>
    <div class="toast-message">${message}</div>
  `;

  DOM.toastContainer.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// Render Dashboard UI, Contacts Grid/List, Badges
function render() {
  // 1. Calculate Badges & Statistics
  updateBadgesAndStats();

  // 2. Filter & Sort Contacts
  let filtered = [...contacts];

  // Filter by Side Navigation (Category/Favorites)
  if (activeFilter === 'favorite') {
    filtered = filtered.filter(c => c.favorite);
  } else if (activeFilter !== 'all') {
    filtered = filtered.filter(c => c.tag === activeFilter);
  }

  // Filter by Search Query
  if (searchQuery) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery) ||
      c.phone.toLowerCase().includes(searchQuery)
    );
  }

  // Sort List
  if (sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === 'date-newest') {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'date-oldest') {
    filtered.sort((a, b) => a.createdAt - b.createdAt);
  }

  // Update Main Heading & Subtitle
  let filterTitle = 'All Contacts';
  if (activeFilter === 'favorite') filterTitle = 'Favorites';
  else if (activeFilter !== 'all') filterTitle = `${activeFilter} Contacts`;
  
  DOM.viewTitle.textContent = filterTitle;
  DOM.resultsCount.textContent = `${filtered.length} contact${filtered.length !== 1 ? 's' : ''} found`;

  // 3. Render HTML Cards
  DOM.contactsContainer.innerHTML = '';
  
  if (filtered.length === 0) {
    DOM.contactsContainer.style.display = 'none';
    DOM.emptyState.style.display = 'flex';
    
    // Customize empty state message
    const emptyH3 = DOM.emptyState.querySelector('h3');
    const emptyP = DOM.emptyState.querySelector('p');
    if (searchQuery) {
      emptyH3.textContent = 'No Matches Found';
      emptyP.textContent = 'Try adjusting your search keywords or tags.';
    } else if (activeFilter === 'favorite') {
      emptyH3.textContent = 'No Favorites Yet';
      emptyP.textContent = 'Mark contacts as favorite to see them here.';
    } else if (activeFilter !== 'all') {
      emptyH3.textContent = `No ${activeFilter} Contacts`;
      emptyP.textContent = `You don't have any contacts saved under ${activeFilter}.`;
    } else {
      emptyH3.textContent = 'No Contacts Yet';
      emptyP.textContent = 'Start organizing your network by adding your first contact.';
    }
  } else {
    DOM.contactsContainer.style.display = viewMode === 'grid' ? 'grid' : 'flex';
    DOM.emptyState.style.display = 'none';

    filtered.forEach(contact => {
      const card = createContactCardElement(contact);
      DOM.contactsContainer.appendChild(card);
    });
  }
}

// Update badges and statistic summary cards
function updateBadgesAndStats() {
  const counts = {
    all: contacts.length,
    favorite: contacts.filter(c => c.favorite).length,
    Personal: contacts.filter(c => c.tag === 'Personal').length,
    Work: contacts.filter(c => c.tag === 'Work').length,
    Family: contacts.filter(c => c.tag === 'Family').length,
    Other: contacts.filter(c => c.tag === 'Other').length
  };

  DOM.countAll.textContent = counts.all;
  DOM.countFavorite.textContent = counts.favorite;
  DOM.countPersonal.textContent = counts.Personal;
  DOM.countWork.textContent = counts.Work;
  DOM.countFamily.textContent = counts.Family;
  DOM.countOther.textContent = counts.Other;

  // Stats cards
  DOM.statTotalContacts.textContent = counts.all;
  DOM.statFavorites.textContent = counts.favorite;

  // Recent: Added within last 24 hours
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const recentCount = contacts.filter(c => c.createdAt >= oneDayAgo).length;
  DOM.statRecent.textContent = recentCount;
}

// Create a HTML Contact Card Element
function createContactCardElement(contact) {
  const card = document.createElement('div');
  card.className = `contact-card ${contact.favorite ? 'card-favorite' : ''}`;
  card.dataset.id = contact.id;

  const dateStr = new Date(contact.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const initials = getInitials(contact.name);
  const avatarStyle = `background: ${getAvatarGradient(contact.name)}`;

  card.innerHTML = `
    <div class="contact-header-layout">
      <div class="contact-avatar" style="${avatarStyle}">
        ${initials}
      </div>
      <div class="contact-actions">
        <button class="action-btn btn-fav ${contact.favorite ? 'active' : ''}" title="${contact.favorite ? 'Remove Favorite' : 'Mark Favorite'}">
          <span class="material-symbols-rounded">star</span>
        </button>
        <button class="action-btn btn-edit" title="Edit Contact">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="action-btn btn-delete" title="Delete Contact">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
    
    <div class="contact-info">
      <h3 class="contact-name" title="${contact.name}">${contact.name}</h3>
      <a href="tel:${contact.phone}" class="contact-details-row" title="Call ${contact.name}">
        <span class="material-symbols-rounded">call</span>
        <span>${contact.phone}</span>
      </a>
      <a href="mailto:${contact.email}" class="contact-details-row" title="Email ${contact.name}">
        <span class="material-symbols-rounded">mail</span>
        <span>${contact.email}</span>
      </a>
    </div>

    <div class="contact-footer-layout">
      <span class="tag-badge tag-${contact.tag.toLowerCase()}">${contact.tag}</span>
      <span class="contact-date">${dateStr}</span>
    </div>
  `;

  // Attach dynamic event listeners to card actions
  const favBtn = card.querySelector('.btn-fav');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavoriteContact(contact.id);
  });

  const editBtn = card.querySelector('.btn-edit');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openContactModal(contact.id);
  });

  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDeleteModal(contact.id);
  });

  return card;
}

// Toggle Favorite Status
function toggleFavoriteContact(id) {
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index].favorite = !contacts[index].favorite;
    saveToLocalStorage();
    showToast(
      `${contacts[index].name} ${contacts[index].favorite ? 'added to' : 'removed from'} favorites`,
      contacts[index].favorite ? 'success' : 'info'
    );
    render();
  }
}

// Open Form Modal (Add / Edit)
function openContactModal(id = null) {
  DOM.contactForm.reset();
  
  if (id) {
    // Edit mode
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    DOM.modalTitle.textContent = 'Edit Contact';
    DOM.contactIdInput.value = contact.id;
    DOM.contactNameInput.value = contact.name;
    DOM.contactPhoneInput.value = contact.phone;
    DOM.contactEmailInput.value = contact.email;
    DOM.contactTagSelect.value = contact.tag;
    DOM.contactFavoriteCheckbox.checked = contact.favorite;
  } else {
    // Add mode
    DOM.modalTitle.textContent = 'Add New Contact';
    DOM.contactIdInput.value = '';
  }

  DOM.contactModal.classList.add('active');
  DOM.contactNameInput.focus();
}

// Close Form Modal
function closeContactModal() {
  DOM.contactModal.classList.remove('active');
  DOM.contactForm.reset();
}

// Handle Form Submission (Add or Edit saving)
function handleContactFormSubmit(e) {
  e.preventDefault();

  const id = DOM.contactIdInput.value;
  const name = DOM.contactNameInput.value.trim();
  const phone = DOM.contactPhoneInput.value.trim();
  const email = DOM.contactEmailInput.value.trim();
  const tag = DOM.contactTagSelect.value;
  const favorite = DOM.contactFavoriteCheckbox.checked;

  // Form Validation Checks
  if (!name || !phone || !email) {
    showToast('Please fill out all required fields', 'error');
    return;
  }

  if (id) {
    // Update existing contact
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = {
        ...contacts[index],
        name,
        phone,
        email,
        tag,
        favorite
      };
      showToast('Contact updated successfully');
    }
  } else {
    // Create new contact
    const newContact = {
      id: 'contact-' + Date.now(),
      name,
      phone,
      email,
      tag,
      favorite,
      createdAt: Date.now()
    };
    contacts.push(newContact);
    showToast('New contact added successfully');
  }

  saveToLocalStorage();
  closeContactModal();
  render();
}

// Open Delete Confirmation Modal
function openDeleteModal(id) {
  const contact = contacts.find(c => c.id === id);
  if (!contact) return;

  contactToDeleteId = id;
  DOM.deleteContactName.textContent = contact.name;
  DOM.deleteModal.classList.add('active');
}

// Close Delete Confirmation Modal
function closeDeleteModal() {
  DOM.deleteModal.classList.remove('active');
  contactToDeleteId = null;
}

// Execute Contact Delete
function executeDeleteContact() {
  if (!contactToDeleteId) return;

  const contact = contacts.find(c => c.id === contactToDeleteId);
  const name = contact ? contact.name : 'Contact';

  contacts = contacts.filter(c => c.id !== contactToDeleteId);
  saveToLocalStorage();
  closeDeleteModal();
  showToast(`${name} deleted successfully`, 'info');
  render();
}

// Export contacts to a JSON file
function exportContacts() {
  if (contacts.length === 0) {
    showToast('No contacts to export', 'error');
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `contacts_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('Contacts backup exported successfully');
}

// Handle imported file reading
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);
      
      // Basic structure validation
      if (Array.isArray(importedData)) {
        const validated = importedData.filter(item => {
          return item.id && item.name && item.phone && item.email && item.tag;
        });

        if (validated.length > 0) {
          // Merge imported contacts, avoiding exact duplicate IDs (replace with new ones)
          validated.forEach(imp => {
            const index = contacts.findIndex(c => c.id === imp.id);
            if (index !== -1) {
              contacts[index] = imp; // overwrite
            } else {
              contacts.push(imp); // add new
            }
          });

          saveToLocalStorage();
          showToast(`Successfully imported ${validated.length} contacts!`);
          render();
        } else {
          showToast('Invalid file format. No contacts could be imported.', 'error');
        }
      } else {
        showToast('JSON must be an array of contacts', 'error');
      }
    } catch (error) {
      showToast('Error parsing JSON backup file', 'error');
      console.error(error);
    }
    
    // Clear input so same file can be uploaded again
    DOM.importFileInput.value = '';
  };
  reader.readAsText(file);
}
