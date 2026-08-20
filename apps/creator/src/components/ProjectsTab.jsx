import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ChevronRight, MessageCircle, UploadCloud, Wrench, FileText, CheckSquare, X } from 'lucide-react';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../src/store/projectStore.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';

export function ProjectsTab({ creator }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('tasks');
  const [chatMessage, setChatMessage] = useState('');
  
  // Equipment Request State
  const [eqItem, setEqItem] = useState('');
  const [eqQty, setEqQty] = useState(1);
  const [eqReason, setEqReason] = useState('');

  const refreshProjects = () => {
    const all = getAllProjectsAcrossUsers();
    // Filter projects where creator is assigned OR invited
    const relevant = all.filter(p => 
      (p.assignedCreator && p.assignedCreator.creatorId === creator.creatorId) ||
      (p.invitations && p.invitations.some(inv => inv.creatorId === creator.creatorId))
    );
    setProjects(relevant);
  };

  useEffect(() => {
    refreshProjects();
    window.addEventListener('addus_project_store_updated', refreshProjects);
    return () => window.removeEventListener('addus_project_store_updated', refreshProjects);
  }, [creator.creatorId]);

  const handleAcceptInvite = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    
    // Auto-setup members for Collaboration Engine
    const members = p.members || { customer: p.userId, projectManager: 'ADM001', creators: [], admin: 'ADM001' };
    members.creators.push(creator.creatorId);

    updateProjectInStore(projectId, {
      assignedCreator: { creatorId: creator.creatorId, name: creator.name },
      status: 'In Production', // Advanced workflow
      members,
      invitations: []
    }, { actor: creator.name, role: 'Creator' });

    NotificationEngine.notify({
      userId: p.userId,
      role: 'Customer',
      type: 'creator_assigned',
      title: 'Creator Assigned',
      message: `${creator.name} has accepted your project and is ready to start.`,
    });

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'creator_accepted',
      title: 'Project Accepted',
      message: `${creator.name} accepted ${projectId}.`,
    });
  };

  const handleDeclineInvite = (projectId) => {
    updateProjectInStore(projectId, {
      assignedCreator: null,
      status: 'Creator Assignment',
      invitations: [] // clear invites so matching engine re-runs
    }, { actor: creator.name, role: 'Creator' });

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'creator_declined',
      title: 'Project Declined',
      message: `${creator.name} declined ${projectId}. Re-running Matching Engine.`,
      priority: 'high'
    });
  };

  const handleTaskToggle = (p, taskId) => {
    // Rely on Workflow Engine for state transitions
    const engineResult = require('../../../../src/services/brain/WorkflowEngine.js').default.handleTaskCompletion(p, taskId, creator.name);
    if (engineResult) {
      updateProjectInStore(p.id, engineResult);
    }

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'task_completed',
      title: 'Task Updated',
      message: `${creator.name} updated a task on project ${p.id}.`
    });
  };

  const handleFileUpload = (p, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload to Business Vault
    const newFile = {
      id: `f_${Date.now()}`,
      name: file.name,
      category: 'Raw Files', // default
      uploaderId: creator.creatorId,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    };

    updateProjectInStore(p.id, {
      files: [...(p.files || []), newFile]
    });

    NotificationEngine.notify({
      userId: p.userId,
      role: 'Customer',
      type: 'file_uploaded',
      title: 'Files Uploaded',
      message: `${creator.name} uploaded ${file.name}.`
    });
  };

  const sendChatMessage = (p) => {
    if (!chatMessage.trim()) return;
    const msg = {
      id: `msg_${Date.now()}`,
      senderId: creator.creatorId,
      senderName: creator.name,
      senderRole: 'Creator',
      text: chatMessage,
      timestamp: new Date().toISOString()
    };

    updateProjectInStore(p.id, { chat: [...(p.chat || []), msg] });
    setChatMessage('');

    NotificationEngine.notify({
      userId: p.userId,
      role: 'Customer',
      type: 'new_message',
      title: 'New Message',
      message: `${creator.name} sent a message on project ${p.id}.`
    });
  };

  const requestClarification = (p) => {
    updateProjectInStore(p.id, {
      clarificationRequests: [...(p.clarificationRequests || []), {
        id: `cr_${Date.now()}`,
        status: 'pending',
        timestamp: new Date().toISOString()
      }]
    });

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'clarification_requested',
      title: 'Clarification Requested',
      message: `${creator.name} requested clarification for ${p.id}. PM review required.`
    });
    alert('Clarification request sent to Project Manager.');
  };

  const requestEquipment = (p) => {
    if (!eqItem.trim()) return;
    const req = {
      id: `eq_${Date.now()}`,
      item: eqItem,
      quantity: eqQty,
      reason: eqReason,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    updateProjectInStore(p.id, { equipmentRequests: [...(p.equipmentRequests || []), req] });
    setEqItem(''); setEqQty(1); setEqReason('');
    
    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'equipment_requested',
      title: 'Equipment Request',
      message: `${creator.name} requested ${eqQty}x ${eqItem}.`
    });
    alert('Equipment request submitted.');
  };

  const invitations = projects.filter(p => !p.assignedCreator && p.invitations?.some(inv => inv.creatorId === creator.creatorId));
  const ongoing = projects.filter(p => p.assignedCreator?.creatorId === creator.creatorId && p.status !== 'Delivered' && p.status !== 'Archived');
  const completed = projects.filter(p => p.assignedCreator?.creatorId === creator.creatorId && (p.status === 'Delivered' || p.status === 'Archived'));

  // Workspace View
  if (activeProject) {
    const p = projects.find(proj => proj.id === activeProject.id) || activeProject; // ensure fresh data
    return (
      <div className="admin-tab-content fade-in">
        <div className="admin-section-header">
          <div>
            <button className="creator-link-btn" onClick={() => setActiveProject(null)}>← Back to Projects</button>
            <h2 style={{ marginTop: 8 }}>{p.service} - {p.projectId}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Client: {p.businessId} | Status: {p.status}</p>
          </div>
          <div>
            <button className="creator-secondary-btn" onClick={() => requestClarification(p)}>❓ Request Clarification</button>
          </div>
        </div>

        <div className="creator-workspace-nav margin-top-24" style={{ display: 'flex', gap: 16, borderBottom: '1px solid #374151', paddingBottom: 8 }}>
          {['tasks', 'chat', 'files', 'equipment'].map(t => (
            <button 
              key={t}
              style={{ background: 'none', border: 'none', color: activeWorkspaceTab === t ? '#818CF8' : '#9CA3AF', cursor: 'pointer', fontWeight: activeWorkspaceTab === t ? 'bold' : 'normal', paddingBottom: 4, borderBottom: activeWorkspaceTab === t ? '2px solid #818CF8' : 'none' }}
              onClick={() => setActiveWorkspaceTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="margin-top-16">
          {activeWorkspaceTab === 'tasks' && (
            <div className="creator-card">
              <h3>Execution Checklist</h3>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(p.tasks || []).filter(t => t.assignedTo === 'creator').map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#1F2937', borderRadius: 8 }}>
                    <button 
                      onClick={() => handleTaskToggle(p, task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: task.status === 'completed' ? '#34D399' : '#9CA3AF' }}
                    >
                      {task.status === 'completed' ? <CheckSquare size={20} /> : <div style={{ width: 18, height: 18, border: '2px solid #6B7280', borderRadius: 4 }} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: task.status === 'completed' ? '#9CA3AF' : '#fff', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>Deadline: {task.deadline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'chat' && (
            <div className="creator-card" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
                {(p.chat || []).map(msg => (
                  <div key={msg.id} style={{ alignSelf: msg.senderId === creator.creatorId ? 'flex-end' : 'flex-start', background: msg.senderId === creator.creatorId ? '#4F46E5' : '#374151', padding: '8px 12px', borderRadius: 12, maxWidth: '80%' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{msg.senderName} ({msg.senderRole})</div>
                    <div>{msg.text}</div>
                  </div>
                ))}
                {(!p.chat || p.chat.length === 0) && <div style={{ color: '#6B7280', textAlign: 'center', marginTop: 40 }}>Project Chat Room initiated. No messages yet.</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: '1px solid #374151', paddingTop: 12 }}>
                <input 
                  className="creator-input" 
                  value={chatMessage} 
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Type message to team..."
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage(p)}
                />
                <button className="creator-primary-btn" onClick={() => sendChatMessage(p)}>Send</button>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'files' && (
            <div className="creator-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>File Center (Business Vault)</h3>
                <label className="creator-primary-btn" style={{ cursor: 'pointer' }}>
                  <UploadCloud size={16} /> Upload File
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(p, e)} />
                </label>
              </div>
              
              {['Raw Files', 'Edited Files', 'Final Deliverables', 'Documents'].map(category => {
                const catFiles = (p.files || []).filter(f => f.category === category);
                if (catFiles.length === 0) return null;
                return (
                  <div key={category} style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#9CA3AF', marginBottom: 8 }}>{category}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                      {catFiles.map(f => (
                        <div key={f.id} style={{ background: '#1F2937', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                          <FileText size={24} style={{ color: '#818CF8', margin: '0 auto 8px' }} />
                          <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(!p.files || p.files.length === 0) && <div style={{ color: '#6B7280', textAlign: 'center', padding: 20 }}>No files uploaded yet.</div>}
            </div>
          )}

          {activeWorkspaceTab === 'equipment' && (
            <div className="creator-card">
              <h3>Equipment Requests</h3>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <input className="creator-input" placeholder="Item (e.g. Sony A7S III)" value={eqItem} onChange={e => setEqItem(e.target.value)} />
                <input className="creator-input" type="number" placeholder="Qty" style={{ width: 80 }} value={eqQty} onChange={e => setEqQty(e.target.value)} />
                <input className="creator-input" placeholder="Reason" value={eqReason} onChange={e => setEqReason(e.target.value)} />
                <button className="creator-primary-btn" onClick={() => requestEquipment(p)}>Request</button>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ color: '#9CA3AF', marginBottom: 12 }}>Past Requests</h4>
                {(p.equipmentRequests || []).map(req => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#1F2937', borderRadius: 8, marginBottom: 8 }}>
                    <div>
                      <strong>{req.quantity}x {req.item}</strong>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{req.reason}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 12, background: req.status === 'pending' ? '#F59E0B20' : '#10B98120', color: req.status === 'pending' ? '#FBBF24' : '#34D399' }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!p.equipmentRequests || p.equipmentRequests.length === 0) && <div style={{ color: '#6B7280', fontSize: 13 }}>No requests made.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Work Allocation & Projects</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Manage your active assignments and new invitations.</p>
        </div>
      </div>

      {/* Invitations */}
      {invitations.length > 0 && (
        <div className="margin-top-24">
          <h3 style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} /> New Invitations ({invitations.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {invitations.map(p => (
              <div key={p.id} className="creator-card" style={{ border: '1px solid #F59E0B40', background: '#F59E0B05' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{p.service} - {p.projectId}</h4>
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Shoot: {p.shootDate} | Budget: {p.budget} | Delivery: {p.estimatedDelivery}</p>
                    <p style={{ fontSize: 13, color: '#F87171', marginTop: 8 }}>⏳ Auto-declines in 01:59:45</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="creator-secondary-btn" onClick={() => handleDeclineInvite(p.id)}><XCircle size={16}/> Decline</button>
                    <button className="creator-primary-btn" onClick={() => handleAcceptInvite(p.id)}><CheckCircle size={16}/> Accept Project</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Projects */}
      <div className="margin-top-24">
        <h3>Ongoing Projects ({ongoing.length})</h3>
        {ongoing.length === 0 ? (
          <div className="creator-empty-state margin-top-12">
            <Wrench size={32} style={{ color: '#374151' }} />
            <p>No active projects currently.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
            {ongoing.map(p => {
              const creatorTasks = (p.tasks || []).filter(t => t.assignedTo === 'creator');
              const completedTasks = creatorTasks.filter(t => t.status === 'completed');
              const progress = creatorTasks.length ? Math.round((completedTasks.length / creatorTasks.length) * 100) : 0;
              
              return (
                <div key={p.id} className="creator-card" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setActiveProject(p)}>
                  <h4>{p.service}</h4>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>{p.projectId} · {p.status}</div>
                  
                  <div style={{ background: '#374151', height: 6, borderRadius: 3, marginBottom: 8 }}>
                    <div style={{ background: '#818CF8', width: `${progress}%`, height: '100%', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{progress}% Complete</span>
                    <span>{completedTasks.length}/{creatorTasks.length} Tasks</span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <MessageCircle size={16} style={{ color: '#9CA3AF' }} />
                      <FileText size={16} style={{ color: '#9CA3AF' }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#818CF8', display: 'flex', alignItems: 'center' }}>Enter Workspace <ChevronRight size={14} /></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="margin-top-32">
          <h3 style={{ color: '#9CA3AF' }}>Completed History ({completed.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {completed.map(p => (
              <div key={p.id} style={{ padding: 12, background: '#111827', borderRadius: 8, display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.service}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.projectId} · Completed on {new Date(p.updatedAt).toLocaleDateString()}</div>
                </div>
                <div><CheckCircle size={20} style={{ color: '#10B981' }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
