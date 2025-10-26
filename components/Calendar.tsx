import React, { useState } from 'react';
import { Task, User } from '../types';

interface CalendarProps {
    tasks: Task[];
    users: User[];
    onTaskClick: (task: Task) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, users, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const days = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }

    const tasksByDate: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
        const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
        if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push(task);
    });

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const getAssigneeAvatar = (assigneeId: string) => {
        const user = users.find(u => u.id === assigneeId);
        return user ? `https://picsum.photos/seed/${user.id}/100` : '';
    };

    return (
        <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)}>&lt;</button>
                <h2 className="text-lg font-bold">{currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)}>&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 pb-2 mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map(d => {
                    const dateKey = d.toISOString().split('T')[0];
                    const tasksForDay = tasksByDate[dateKey] || [];
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    return (
                        <div key={dateKey} className={`h-32 border dark:border-gray-700 rounded-md p-1 ${isCurrentMonth ? '' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <span className={`text-xs ${isCurrentMonth ? 'font-medium' : 'text-gray-400'}`}>{d.getDate()}</span>
                            <div className="space-y-1 mt-1 overflow-y-auto max-h-24">
                                {tasksForDay.map(task => (
                                    <div 
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className="text-xs p-1 bg-primary-100 dark:bg-primary-900/50 rounded-md cursor-pointer hover:bg-primary-200 flex items-center"
                                    >
                                        <img src={getAssigneeAvatar(task.assignedTo)} className="w-4 h-4 rounded-full mr-1" alt="assignee" />
                                        <span className="truncate">{task.title}</span>
                                    </div>
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
