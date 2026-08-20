import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function BookingCalendar({ onConfirmDate }) {
  // Generate dates starting 3 days from today (minimum 3-day buffer rule)
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 3);

  const [selectedDate, setSelectedDate] = useState(minDate.toISOString().split('T')[0]);

  // Generate 14 selectable dates from minDate
  const availableDates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(minDate);
    d.setDate(minDate.getDate() + i);
    availableDates.push({
      fullDate: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  const handleSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleContinue = () => {
    const chosenDate = new Date(selectedDate);
    const estDelivery = new Date(chosenDate);
    estDelivery.setDate(chosenDate.getDate() + 5);

    onConfirmDate({
      shootDate: selectedDate,
      estimatedDelivery: estDelivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <CalendarIcon size={22} className="accent-icon" />
        </div>
        <h2 className="step-title">Select Shoot or Execution Date</h2>
        <p className="step-subtitle">3-day preparation buffer applied to ensure crew and equipment readiness.</p>
      </div>

      <div className="calendar-grid">
        {availableDates.map((item) => (
          <div
            key={item.fullDate}
            className={`date-card ${selectedDate === item.fullDate ? 'date-selected' : ''}`}
            onClick={() => handleSelect(item.fullDate)}
          >
            <span className="date-month">{item.monthName}</span>
            <span className="date-num">{item.dayNumber}</span>
            <span className="date-day">{item.dayName}</span>
            {item.isWeekend && <span className="weekend-dot" title="Weekend shoot available">•</span>}
          </div>
        ))}
      </div>

      <div className="estimate-summary-pill flex-center">
        <Clock size={16} />
        <span>Estimated Delivery: 5 days after shoot date</span>
      </div>

      <button type="button" className="primary-btn pulse-glow margin-top-20" onClick={handleContinue}>
        <span>Confirm Date</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
