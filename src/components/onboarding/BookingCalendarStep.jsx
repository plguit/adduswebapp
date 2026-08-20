import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { Button } from '../common/Button.jsx';

/**
 * Step 8: Booking Calendar Component
 * - 3-day minimum buffer rule (disables unavailable past/prep dates)
 * - Weekends enabled
 * - Estimated delivery calculation (5 days post-shoot)
 * - Budget estimate summary pill
 */
export function BookingCalendarStep() {
  const { state, updateState } = useOnboardingStore();

  // Calculate 3-day buffer date
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 3);

  const [selectedDate, setSelectedDate] = useState(
    state.booking?.shootDate || minDate.toISOString().split('T')[0]
  );

  // Generate 14 selectable dates
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

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleContinue = () => {
    const chosenDate = new Date(selectedDate);
    const estDelivery = new Date(chosenDate);
    estDelivery.setDate(chosenDate.getDate() + 5);

    const estDeliveryStr = estDelivery.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    updateState({
      booking: {
        shootDate: selectedDate,
        estimatedDelivery: estDeliveryStr
      },
      currentStep: 'project_details'
    });
  };

  const chosenDateObj = new Date(selectedDate);
  const deliveryDateObj = new Date(chosenDateObj);
  deliveryDateObj.setDate(chosenDateObj.getDate() + 5);
  const formattedDelivery = deliveryDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const budgetDisplay = state.project?.budget || '$2,500 - $5,000';

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <CalendarIcon size={24} className="accent-icon" />
        </div>
        <h2 className="step-title">Choose your preferred schedule.</h2>
        <p className="step-subtitle">Select preferred dates for production or delivery.</p>
      </div>

      {/* Date Picker Grid */}
      <div className="calendar-grid">
        {availableDates.map((item) => (
          <div
            key={item.fullDate}
            className={`date-card ${selectedDate === item.fullDate ? 'date-selected' : ''}`}
            onClick={() => handleDateSelect(item.fullDate)}
          >
            <span className="date-month">{item.monthName}</span>
            <span className="date-num">{item.dayNumber}</span>
            <span className="date-day">{item.dayName}</span>
            {item.isWeekend && <span className="weekend-dot" title="Weekend shoot available">•</span>}
          </div>
        ))}
      </div>

      {/* Summary Pills */}
      <div className="booking-summary-pills margin-top-16">
        <div className="estimate-summary-pill flex-center">
          <Clock size={15} />
          <span>Estimated delivery: {formattedDelivery}</span>
        </div>

        <div className="budget-estimate-pill flex-center margin-top-10">
          <DollarSign size={15} />
          <span>Target Budget: {budgetDisplay}</span>
        </div>
      </div>

      <div className="margin-top-20">
        <Button onClick={handleContinue} icon={ArrowRight}>
          Continue
        </Button>
      </div>
    </div>
  );
}
