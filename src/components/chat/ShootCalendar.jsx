import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/**
 * ShootCalendar — Visual month-grid calendar with minimum date enforcement.
 * Props:
 *   minDate: string (YYYY-MM-DD) — dates before this are disabled
 *   value: string (YYYY-MM-DD) — selected date
 *   onChange: (dateStr: string) => void
 */
export function ShootCalendar({ minDate, value, onChange }) {
  const today = new Date();
  const minDateObj = minDate ? new Date(minDate) : today;
  // Normalize minDateObj to start of day
  minDateObj.setHours(0, 0, 0, 0);

  const initDate = value ? new Date(value) : minDateObj;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    const dateObj = new Date(viewYear, viewMonth, day);
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj < minDateObj) return; // disabled
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const selectedObj = value ? new Date(value) : null;
  if (selectedObj) selectedObj.setHours(0, 0, 0, 0);

  // Build calendar cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="sc-calendar">
      {/* Header */}
      <div className="sc-header">
        <button className="sc-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
        <span className="sc-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="sc-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Day names */}
      <div className="sc-day-names">
        {DAY_NAMES.map(d => <div key={d} className="sc-day-name">{d}</div>)}
      </div>

      {/* Days grid */}
      <div className="sc-days-grid">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="sc-cell sc-cell-empty" />;

          const dateObj = new Date(viewYear, viewMonth, day);
          dateObj.setHours(0, 0, 0, 0);
          const isDisabled = dateObj < minDateObj;
          const isSelected = selectedObj && dateObj.getTime() === selectedObj.getTime();
          const isToday = dateObj.getTime() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          return (
            <button
              key={day}
              className={[
                'sc-cell',
                isDisabled ? 'sc-cell-disabled' : 'sc-cell-enabled',
                isSelected ? 'sc-cell-selected' : '',
                isToday ? 'sc-cell-today' : '',
                isWeekend && !isDisabled ? 'sc-cell-weekend' : '',
              ].join(' ')}
              onClick={() => !isDisabled && handleDayClick(day)}
              disabled={isDisabled}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="sc-legend">
        <span className="sc-legend-item"><span className="sc-legend-dot sc-dot-disabled" />Unavailable</span>
        <span className="sc-legend-item"><span className="sc-legend-dot sc-dot-weekend" />Weekend</span>
        <span className="sc-legend-item"><span className="sc-legend-dot sc-dot-selected" />Selected</span>
      </div>
    </div>
  );
}
