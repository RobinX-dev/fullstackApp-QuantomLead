import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const STATUS = ['todo', 'in-progress', 'done'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { authAxios, token } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchProject = async () => {
      try {
        const { data } = await authAxios.get(`/api/projects/${id}`);
        setProject(data);
      } catch (err) {
        setError('Project not found.');
      }
    };
    const fetchTasks = async () => {
      try {
        const { data } = await authAxios.get(`/api/projects/${id}/tasks`);
        setTasks(data);
      } catch (err) {
        setTasks([]);
      }
      setLoading(false);
    };
    fetchProject();
    fetchTasks();
  }, [id, token, authAxios, navigate]);

  // Move task to another status
  const moveTask = async (taskId, newStatus) => {
    try {
      await authAxios.patch(`/api/projects/${id}/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks =>
        tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setError('Failed to move task');
    }
  };

  if (!token) return null;

  return (
    <div className="kanban-bg">
      <div className="kanban-card">
        {loading ? (
          <div className="project-loading">Loading...</div>
        ) : error ? (
          <div className="project-error">{error}</div>
        ) : (
          <>
            <h2 className="project-title">{project.name}</h2>
            <button className="project-back" onClick={() => navigate('/')}>Back to Dashboard</button>
            <div className="kanban-board">
              {STATUS.map(status => (
                <div key={status} className="kanban-column">
                  <h3 className="kanban-column-title">{status.replace('-', ' ').toUpperCase()}</h3>
                  {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="kanban-task">
                      <strong>{task.title}</strong>
                      <div>{task.description}</div>
                      <div className="kanban-task-meta">
                        <span>Assignee: {task.assignee || 'Unassigned'}</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="kanban-task-actions">
                        {STATUS.filter(s => s !== status).map(s => (
                          <button key={s} onClick={() => moveTask(task.id, s)}>
                            Move to {s.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`
        .kanban-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kanban-card {
          background: #fff;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(180, 180, 80, 0.15);
          width: 90vw;
          max-width: 1200px;
        }
        .project-title {
          font-size: 2rem;
          font-weight: 700;
          color: #f7971e;
          margin-bottom: 1rem;
        }
        .project-back {
          background: linear-gradient(90deg, #f7971e 0%, #ffd200 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 1rem;
        }
        .kanban-board {
          display: flex;
          gap: 2rem;
          margin-top: 2rem;
        }
        .kanban-column {
          background: #fffbe6;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(180,180,80,0.08);
          flex: 1;
          padding: 1rem;
          min-height: 300px;
        }
        .kanban-column-title {
          color: #f7971e;
          margin-bottom: 1rem;
        }
        .kanban-task {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(180,180,80,0.08);
          margin-bottom: 1rem;
          padding: 1rem;
        }
        .kanban-task-meta {
          font-size: 0.9rem;
          color: #888;
          margin: 0.5rem 0;
          display: flex;
          gap: 1rem;
        }
        .kanban-task-actions button {
          background: #ffd200;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.4rem 0.8rem;
          font-size: 0.9rem;
          cursor: pointer;
          margin-right: 0.5rem;
          margin-top: 0.5rem;
        }
        .kanban-task-actions button:hover {
          background: #f7971e;
        }
        .project-error {
          color: #e74c3c;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
