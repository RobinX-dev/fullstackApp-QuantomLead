import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { authAxios, token, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    owner: '',
    members: '',
    startDate: '',
    deadline: '',
    technologies: '',
    email: localStorage.getItem('userEmail') || '',
  });
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    owner: '',
    members: '',
    startDate: '',
    deadline: '',
    technologies: '',
    status: 'active',
    email: localStorage.getItem('userEmail') || '',
  });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  // Unified fetch: prefer authAxios (adds auth header) but also include email & token in params
  const fetchProjects = async () => {
    const userEmail = localStorage.getItem('userEmail');
    const tokenFromStorage = localStorage.getItem('token');
    setLoading(true);
    try {
      // try authAxios first (will include Authorization header if configured)
      const { data } = await authAxios.get('/api/projects', {
        params: { email: userEmail, token: tokenFromStorage }
      });
      setProjects(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedProject(data[0]);
    } catch (err) {
      // fallback to plain fetch (in case server expects token in query)
      try {
        const userEmail = localStorage.getItem('userEmail');
        const tokenFromStorage = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/projects?email=${encodeURIComponent(userEmail)}&token=${encodeURIComponent(tokenFromStorage)}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data2 = await res.json();
        setProjects(Array.isArray(data2) ? data2 : []);
        if (Array.isArray(data2) && data2.length > 0) setSelectedProject(data2[0]);
      } catch (err2) {
        console.error('Fetch projects failed:', err, err2);
        setProjects([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // run on token availability
  useEffect(() => {
    if (!token) return;
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // local quick fetch on mount (keeps compatibility if token already in localStorage)
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const tokenFromStorage = localStorage.getItem('token');
    if (!userEmail || !tokenFromStorage) return;
    // If token exists in context we already called fetchProjects; otherwise call fallback:
    if (!token) {
      // call direct fetch with query (no auth header)
      fetch(`http://localhost:4000/api/projects?email=${encodeURIComponent(userEmail)}&token=${encodeURIComponent(tokenFromStorage)}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch projects');
          return res.json();
        })
        .then(data => {
          setProjects(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) setSelectedProject(data[0]);
        })
        .catch(err => {
          console.warn('Initial fetch (no context token) failed:', err.message);
        });
    }
  }, []); // run once

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditInput = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.owner) {
      setError('Task name and owner are required.');
      return;
    }
    try {
      const payload = {
        ...form,
        email: localStorage.getItem('userEmail'),
        members: form.members ? form.members.split(',').map(m => m.trim()).filter(Boolean) : [],
        technologies: form.technologies ? form.technologies.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      // POST with authAxios; include token/email in params for compatibility
      const { data } = await authAxios.post('/api/projects', payload, {
        params: { email: payload.email, token: localStorage.getItem('token') }
      });

      setProjects(prev => [data, ...prev]);
      setForm({
        name: '',
        description: '',
        owner: '',
        members: '',
        startDate: '',
        deadline: '',
        technologies: '',
        email: localStorage.getItem('userEmail') || ''
      });
      setSelectedProject(data);
      setShowModal(false);
    } catch (err) {
      console.error('Create project failed:', err.response?.data || err.message);
      setError('Create project failed');
    }
  };

  // Open edit modal and pre-fill form
  const openEditModal = () => {
    if (!selectedProject) return;
    setEditForm({
      id: selectedProject._id || selectedProject.id || '',
      name: selectedProject.name || '',
      description: selectedProject.description || '',
      owner: selectedProject.owner || '',
      members: Array.isArray(selectedProject.members)
        ? selectedProject.members.join(', ')
        : (selectedProject.members || ''),
      startDate: selectedProject.startDate ? selectedProject.startDate.slice(0, 10) : '',
      deadline: selectedProject.deadline ? selectedProject.deadline.slice(0, 10) : '',
      technologies: Array.isArray(selectedProject.technologies)
        ? selectedProject.technologies.join(', ')
        : (selectedProject.technologies || ''),
      status: selectedProject.status || 'active',
      email: selectedProject.userEmail || localStorage.getItem('userEmail') || ''
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Submit edit form
  const editProject = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.name) {
      setEditError('Task name is required.');
      return;
    }
    if (!editForm.id) {
      setEditError('No Task selected for editing.');
      return;
    }
    try {
      const payload = {
        ...editForm,
        members: editForm.members ? editForm.members.split(',').map(m => m.trim()).filter(Boolean) : [],
        technologies: editForm.technologies ? editForm.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        email: editForm.email || localStorage.getItem('userEmail')
      };

      // put with authAxios, include params for compatibility
      const { data } = await authAxios.put(`/api/projects/${editForm.id}`, payload, {
        params: { email: payload.email, token: localStorage.getItem('token') }
      });

      setProjects(prev =>
        prev.map(p => ((p._id === editForm.id || p.id === editForm.id) ? data : p))
      );
      setSelectedProject(data);
      setShowEditModal(false);
    } catch (err) {
      console.error('Edit project failed:', err.response?.data || err.message);
      setEditError('Edit project failed');
    }
  };

  // Delete project by id
  const deleteProject = async () => {
    if (!selectedProject || !selectedProject._id) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedProject.name}"?`)) return;
    try {
      const userEmail = localStorage.getItem('userEmail');
      await authAxios.delete(`/api/projects/${selectedProject._id}`, {
        params: { email: userEmail, token: localStorage.getItem('token') }
      });
      setProjects(prev => prev.filter(p => p._id !== selectedProject._id));
      setSelectedProject(null);
      setShowEditModal(false);
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      alert('Delete failed');
    }
  };

  const userName = localStorage.getItem('userName');

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-user-top">
        {userName ? `Welcome, ${userName}` : ''}
      </div>
      <button className="dashboard-logout-top" onClick={() => { logout(); navigate('/login'); }}>Logout</button>

      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Tasks</h2>
          <button className="sidebar-add-btn" onClick={() => setShowModal(true)}>+ Add New Task</button>
        </div>
        <div className="sidebar-list">
          {loading ? (
            <div className="sidebar-loading">Loading...</div>
          ) : (
            projects.length === 0 ? (
              <div className="sidebar-empty">No projects yet.</div>
            ) : (
              (Array.isArray(projects) ? projects : []).map((p) => {
                const id = p._id || p.id;
                const isSelected = selectedProject && (selectedProject._id === id || selectedProject.id === id);
                return (
                  <div
                    key={id}
                    className={`sidebar-project${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedProject(p)}
                    tabIndex={0}
                  >
                    <div className="sidebar-project-name">{p.name}</div>
                    <div className="sidebar-project-owner">{p.owner}</div>
                  </div>
                );
              })
            )
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        {selectedProject ? (
          <div className="project-details-card">
            <div className="project-details-header">
              <h2>{selectedProject.name}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="edit-btn icon-btn" title="Edit Task" onClick={openEditModal}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.243 8.243a1 1 0 01-.293.207l-3 1.5a1 1 0 01-1.316-1.316l1.5-3a1 1 0 01.207-.293l8.243-8.243z" stroke="#134e4a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="delete-btn icon-btn" title="Delete Task" onClick={deleteProject}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6l8 8M6 14L14 6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
                    <rect x="3" y="3" width="14" height="14" rx="3" stroke="#e74c3c" strokeWidth="2" fill="none" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="project-meta-card">
              <h3 className="meta-title">Task Details</h3>
              <div className="project-meta">
                <span className='spanBreak'><strong>Owner:</strong> {selectedProject.owner}</span>
                <span  className='spanBreak'>
                  <strong>Members:</strong> {Array.isArray(selectedProject.members) ? selectedProject.members.join(', ') : selectedProject.members}
                </span>
                <span className='spanBreak'>
                  <strong>Start:</strong> {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}
                </span>
                <span className='spanBreak'>
                  <strong>Deadline:</strong> {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'N/A'}
                </span>
                <span className='spanBreak'>
                  <strong>Technologies:</strong> {Array.isArray(selectedProject.technologies) ? selectedProject.technologies.join(', ') : selectedProject.technologies}
                </span>
              </div>
            </div>


            <div className="project-desc">{selectedProject.description}</div>
          </div>
        ) : (
          <div className="project-details-card empty">
            <h2>Select a project</h2>
            <p>Click a project on the left to view details.</p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Task</h2>
            <form className="modal-form" onSubmit={createProject}>
              <input name="name" placeholder="Task name" value={form.name} onChange={handleInput} className="modal-input" required />
              <input name="owner" placeholder="Owner/Manager" value={form.owner} onChange={handleInput} className="modal-input" required />
              <input name="members" placeholder="Team members (comma separated)" value={form.members} onChange={handleInput} className="modal-input" />
              <input name="startDate" type="date" placeholder="Start date" value={form.startDate} onChange={handleInput} className="modal-input" />
              <input name="deadline" type="date" placeholder="Deadline" value={form.deadline} onChange={handleInput} className="modal-input" />
              <input name="technologies" placeholder="Technologies (comma separated)" value={form.technologies} onChange={handleInput} className="modal-input" />
              <textarea name="description" placeholder="Task description" value={form.description} onChange={handleInput} className="modal-input" rows={2} />
              <button className="modal-btn" type="submit">Submit</button>
              {error && <div className="modal-error">{error}</div>}
            </form>
            <button className="modal-close" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Task</h2>
            <form className="modal-form" onSubmit={editProject}>
              <input name="name" placeholder="Task name" value={editForm.name} onChange={handleEditInput} className="modal-input" required />
              <input name="owner" placeholder="Owner/Manager" value={editForm.owner} onChange={handleEditInput} className="modal-input" required />
              <input name="members" placeholder="Team members (comma separated)" value={editForm.members} onChange={handleEditInput} className="modal-input" />
              <input name="startDate" type="date" placeholder="Start date" value={editForm.startDate} onChange={handleEditInput} className="modal-input" />
              <input name="deadline" type="date" placeholder="Deadline" value={editForm.deadline} onChange={handleEditInput} className="modal-input" />
              <input name="technologies" placeholder="Technologies (comma separated)" value={editForm.technologies} onChange={handleEditInput} className="modal-input" />
              <textarea name="description" placeholder="Task description" value={editForm.description} onChange={handleEditInput} className="modal-input" rows={2} />
              <button className="modal-btn" type="submit">Save Changes</button>
              {editError && <div className="modal-error">{editError}</div>}
            </form>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Raleway', sans-serif;
          position: relative;

        }
          .spanBreak{
            display:block;
            width:100%;
          }
          
        .dashboard-user-top {
          position: fixed;
          top: 1rem;
          left: 1rem;
          font-size: 1.15rem;
          font-weight: 600;
          color: #22223b;
          background: rgba(255,255,255,0.9);
          padding: 0.45rem 1rem;
          border-radius: 10px;
          z-index: 1100;
          box-shadow: 0 2px 8px rgba(80,80,80,0.08);
        }
        .dashboard-logout-top {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.55rem 1.15rem;
          font-weight: 600;
          cursor: pointer;
          z-index: 1100;
          transition: transform 0.5s ease;
        }
        .dashboard-logout-top:hover { transform: scale(1.03); }

        .close-btn { position: fixed;
          top: 1rem;
          right: 1rem;
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.55rem 1.15rem;
          font-weight: 600;
          cursor: pointer;
          z-index: 1100;
          transition: transform 0.5s ease;}

        .dashboard-sidebar {
          width: 320px;
          background: #0f2a57;
          color: #fff;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 1.2rem;
          box-shadow: 2px 0 16px rgba(0,0,0,0.07);
          border-radius: 0 18px 18px 0;
        }
        .sidebar-header { display:flex; flex-direction:column; gap:0.7rem; margin-bottom:1.2rem; }
        .sidebar-add-btn {
          background: linear-gradient(90deg,#59a6ff,#4ecca3);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(46,82,154,0.12);
        }
        .sidebar-add-btn:hover { transform: translateY(-3px); }
        /* Modal Close Button */
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: #ff4d4d;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s ease;
}

.modal-close:hover {
  background-color: #e63939;
  transform: scale(1.05);
}


        .sidebar-list { flex: 1; overflow-y: auto; margin-top: 0.8rem; padding-right: 6px; }
        .sidebar-project {
          padding: 0.9rem 1rem;
          border-radius: 12px;
          margin-bottom: 0.6rem;
          cursor: pointer;
          background: transparent;
          transition: background 0.5s, transform 0.5s;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        .sidebar-project:hover { transform: translateY(-3px); background: rgba(255,255,255,0.06); }
        .sidebar-project.selected { background: linear-gradient(90deg,#4ecca3,#3ec6e0); color: #022; transform: none; }

        .sidebar-project-name { font-weight: 700; font-size: 1.05rem; }
        .sidebar-project-owner { font-size: 0.9rem; opacity: 0.85; }

        .dashboard-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 4rem 2rem;
        }
        .project-details-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          padding: 2.5rem 2.2rem;
          width: 100%;
          max-width: 920px;
          position: relative;
          transition: box-shadow 0.5s ease, transform 0.5s ease;
        }
        .project-details-card.empty { text-align:center; color:#888; }

        .project-details-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:1rem;
        }
        .project-details-header h2 { margin:0; color:#0b2140; font-size:1.8rem; }
        .project-actions { display:flex; gap:0.6rem; }

        .icon-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; transition: background 0.3s, transform 0.2s; }
        .icon-btn:hover { background: rgba(0,0,0,0.04); transform: translateY(-2px); }

        .project-meta { display:flex; flex-wrap:wrap; gap:1.2rem; color:#4b5563; margin-bottom:1.2rem; }
        .project-desc { color:#374151; font-size:1.02rem; line-height:1.6; }

        .project-meta-card {
  background-color: #1b2a50;
  border-radius: 20px;
  padding: 25px 30px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
  margin-top: 20px;
}

.project-meta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.meta-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #e0e0ff;
  margin-bottom: 15px;
  border-bottom: 1px solid #2a3d7a;
  padding-bottom: 8px;
}

.project-meta span {
  display: block;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #cfd9ff;
}

.project-meta span strong {
  color: #fff;
}


        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(8,15,38,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 1300;
        }
        .modal-content {
          background: #fff; border-radius: 14px; padding: 2rem; width: 420px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.16);
          transition: transform 0.5s ease, opacity 0.5s ease;
        }
        .modal-form { display:flex; flex-direction:column; gap:0.7rem; }
        .modal-input {
          padding: 0.7rem 1rem; border: 1px solid #e6e9ef; border-radius: 10px; background:#fbfdff;
        }
        .modal-btn {
          background: linear-gradient(90deg,#59a6ff,#4ecca3);
          color:#022; border:none; padding:0.75rem 1rem; border-radius:10px; font-weight:700; cursor:pointer;
        }
        .modal-btn:hover { transform: translateY(-3px); }

        .modal-error { color:#e74c3c; margin-top:0.3rem; }

        /* small helpers */
        @media (max-width: 980px) {
          .dashboard-sidebar { width: 240px; padding: 1.8rem 1rem; }
          .project-details-card { padding: 1.6rem; max-width: 720px; }
        }
      `}</style>
    </div>
  );
}
