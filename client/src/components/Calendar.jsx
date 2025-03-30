import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const Calendar = ({ sessions, onSessionSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const getSessionsForDay = (day) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.date), day)
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={prevMonth} 
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
        >
          &larr; Previous
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={nextMonth} 
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
        >
          Next &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}

        {monthDays.map(day => {
          const daysSessions = getSessionsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] border rounded-lg p-2 relative ${
                isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm ${
                isToday ? 'text-blue-600 font-semibold' : 'text-gray-600'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {daysSessions.map(session => (
                  <button
                    key={session._id}
                    onClick={() => onSessionSelect(session)}
                    className={`w-full text-left text-xs p-2 rounded-md transition-colors ${
                      session.status === 'pending'
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                        : session.status === 'confirmed'
                        ? 'bg-green-100 hover:bg-green-200 text-green-800'
                        : session.status === 'completed'
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        : 'bg-red-100 hover:bg-red-200 text-red-800'
                    }`}
                  >
                    <div className="font-medium">{session.subject}</div>
                    <div>{session.startTime}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
