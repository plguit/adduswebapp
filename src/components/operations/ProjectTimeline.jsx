import React from 'react';
import { CheckCircle2, Clock, Calendar, ChevronRight } from 'lucide-react';
import { calculateTimelineProgressForWorkstreams } from '../../store/projectStore.js';

export function ProjectTimeline({ project }) {
  if (!project) return null;

  const currentStatus = project.status || 'Submitted';
  const services = project.selectedServices && project.selectedServices.length > 0 
    ? project.selectedServices 
    : [project.service || 'Video Production'];
  const workstreams = calculateTimelineProgressForWorkstreams(currentStatus, services);

  return (
    <div className="project-ops-timeline-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="ops-timeline-header flex-between">
        <div>
          <h4 className="ops-timeline-title">Project Progress</h4>
          <span className="ops-timeline-sub">Your project progress is updated automatically.</span>
        </div>
        <span className="ops-timeline-badge">
          Status: <strong>{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</strong>
        </span>
      </div>

      {workstreams.map((ws, wsIdx) => (
        <div key={wsIdx} className="workstream-timeline-block" style={{ borderTop: wsIdx > 0 ? '1px dashed rgba(255,255,255,0.1)' : 'none', paddingTop: wsIdx > 0 ? '16px' : '0' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }}></span>
            {ws.label} Project Steps
          </div>
          
          <div className="ops-timeline-flow" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px', alignItems: 'center' }}>
            {ws.phases.map((phase, idx) => {
              const isDone = phase.status === 'completed';
              const isActive = phase.status === 'active';

              return (
                <React.Fragment key={phase.key}>
                  <div className={`ops-timeline-step ${isDone ? 'step-done' : isActive ? 'step-active' : 'step-pending'}`} style={{ minWidth: '110px' }}>
                    <div className="step-circle" style={{ width: '22px', height: '22px', fontSize: '10px', flexShrink: 0 }}>
                      {isDone ? <CheckCircle2 size={13} /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="step-content">
                      <span className="step-title" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{phase.label}</span>
                      <span className="step-status" style={{ fontSize: '9px' }}>
                        {isDone ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {idx < ws.phases.length - 1 && (
                    <div className={`ops-timeline-connector ${isDone ? 'connector-done' : ''}`} style={{ flexGrow: 1, minWidth: '10px', height: '2px', margin: '0 4px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectTimeline;
