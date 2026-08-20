import React, { useState } from 'react';

/**
 * Reusable Booking Calendar Component
 * Enforces 3-day minimum buffer and displays delivery estimates.
 */
export function Calendar({ minBufferDays = 3, onSelectDate, selectedDate = null }) {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minBufferDays);

  const [activeDate, setActiveDate] = useState(selectedDate || minDate.toISOString().split('T')[0]);

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(minDate);
    d.setDate(minDate.getDate() + i);
    dates.push({
      fullDate: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  const handlePick = (dateStr) => {
    setActiveDate(dateStr);
    if (typeof onSelectDate === 'function') {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className="calendar-grid">
      {dates.map((d) => (
        <div
          key={d.fullDate}
          className={`date-card ${activeDate === d.fullDate ? 'date-selected' : ''}`}
          onClick={() => handlePick(d.fullDate)}
        >
          <span className="date-month">{d.monthName}</span>
          <span className="date-num">{d.dayNum}</span>
          <span className="date-day">{d.dayName}</span>
          {d.isWeekend && <span className="weekend-dot">•</span>}
        </div>
      ))}
    </div>
  );
}
