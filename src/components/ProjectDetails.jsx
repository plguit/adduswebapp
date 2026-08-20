import React, { useState } from 'react';
import { MapPin, Sun, Upload, FileText, ArrowRight, DollarSign } from 'lucide-react';

export function ProjectDetails({ projectData, onSaveDetails }) {
  const [location, setLocation] = useState(projectData.location || '');
  const [environment, setEnvironment] = useState(projectData.environment || 'indoor'); // 'indoor' | 'outdoor' | 'both'
  const [budget, setBudget] = useState(projectData.budget || '$2,500 - $5,000');
  const [notes, setNotes] = useState(projectData.notes || '');
  const [referenceFile, setReferenceFile] = useState(null);

  const budgetOptions = [
    '< $2,500',
    '$2,500 - $5,000',
    '$5,000 - $10,000',
    '$10,000+'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveDetails({
      location: location || 'Client Office / On-site',
      environment,
      budget,
      notes,
      referenceFile
    });
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <h2 className="step-title">Project Details</h2>
        <p className="step-subtitle">Provide location and budget details for your project.</p>
      </div>

      <form onSubmit={handleSubmit} className="phone-form">
        {/* Location Input */}
        <div className="form-field">
          <label className="field-label"><MapPin size={14} /> Location:</label>
          <input
            type="text"
            className="phone-input field-input"
            placeholder="e.g. Mumbai, Goa, Bengaluru, Remote..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Indoor / Outdoor Selector */}
        <div className="form-field">
          <label className="field-label"><Sun size={14} /> Shoot Setting:</label>
          <div className="setting-options">
            {['indoor', 'outdoor', 'both'].map((env) => (
              <button
                key={env}
                type="button"
                className={`setting-tab ${environment === env ? 'setting-active' : ''}`}
                onClick={() => setEnvironment(env)}
              >
                {env.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range Selector */}
        <div className="form-field">
          <label className="field-label"><DollarSign size={14} /> Estimated Budget:</label>
          <div className="budget-chips-wrap">
            {budgetOptions.map((b) => (
              <button
                key={b}
                type="button"
                className={`chip-select ${budget === b ? 'chip-active' : ''}`}
                onClick={() => setBudget(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="form-field">
          <label className="field-label"><Upload size={14} /> Reference Files (Optional):</label>
          <label className="upload-dropzone compact-dropzone">
            <Upload size={18} className="accent-icon" />
            <span>{referenceFile ? referenceFile.name : 'Upload Moodboard or Style PDF'}</span>
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => setReferenceFile(e.target.files[0] || null)}
            />
          </label>
        </div>

        {/* Additional Notes */}
        <div className="form-field">
          <label className="field-label"><FileText size={14} /> Additional Notes:</label>
          <textarea
            className="explain-textarea"
            placeholder="Any specific shot requirements, brand guidelines, or key dates..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <button type="submit" className="primary-btn pulse-glow margin-top-10">
          <span>Review Project</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
