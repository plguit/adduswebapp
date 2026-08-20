import React, { useState } from 'react';
import { Compass, CheckCircle, Rocket, TrendingUp, RefreshCw, Box, Users, HelpCircle, ArrowRight } from 'lucide-react';

export function ExpectationStep({ onCompleteExpectation }) {
  const [phase, setPhase] = useState('expectation'); // 'expectation' | 'goal'
  const [expectation, setExpectation] = useState(null);
  const [goal, setGoal] = useState(null);

  const goalOptions = [
    { id: 'launching', label: 'Launching a Business', icon: Rocket },
    { id: 'growing', label: 'Building a Stronger Presence', icon: TrendingUp },
    { id: 'rebranding', label: 'Rebranding', icon: RefreshCw },
    { id: 'product', label: 'Product Launch', icon: Box },
    { id: 'customers', label: 'More Customers', icon: Users },
    { id: 'other', label: 'Something Else', icon: HelpCircle }
  ];

  const handleSelectExpectation = (choice) => {
    setExpectation(choice);
    setPhase('goal');
  };

  const handleSelectGoal = (selectedGoal) => {
    setGoal(selectedGoal);
    onCompleteExpectation({ expectation, goal: selectedGoal });
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      {phase === 'expectation' ? (
        <>
          <div className="step-header">
            <div className="icon-badge">
              <Compass size={22} className="accent-icon" />
            </div>
            <h2 className="step-title">What are you trying to accomplish?</h2>
            <p className="step-subtitle">Choose the option that best describes your situation.</p>
          </div>

          <div className="expectation-cards-wrap">
            <div
              className={`selection-card ${expectation === 'help_figure' ? 'card-selected' : ''}`}
              onClick={() => handleSelectExpectation('help_figure')}
            >
              <div className="card-radio"></div>
              <div>
                <h4 className="card-heading">Help me figure it out</h4>
                 <p className="card-desc">Let ADDI analyze my business and suggest where to start.</p>
              </div>
            </div>

            <div
              className={`selection-card ${expectation === 'know_need' ? 'card-selected' : ''}`}
              onClick={() => handleSelectExpectation('know_need')}
            >
              <div className="card-radio"></div>
              <div>
                <h4 className="card-heading">I already know what I need</h4>
                 <p className="card-desc">I have specific deliverables in mind and want to start planning.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="step-header">
            <h2 className="step-title">What is your primary business goal right now?</h2>
            <p className="step-subtitle">This helps ADDI recommend the right work for your business.</p>
          </div>

          <div className="goals-grid">
            {goalOptions.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className={`goal-card ${goal === item.id ? 'card-selected' : ''}`}
                  onClick={() => handleSelectGoal(item.id)}
                >
                  <IconComp size={20} className="goal-icon" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
