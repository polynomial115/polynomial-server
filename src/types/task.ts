// this code is shared with the client
// any updates must be made in both client and server

export enum TaskStatus {
	ToDo = 0,
	Backlog = 1,
	InProgress = 2,
	Completed = 3
}

export enum Priority {
	Urgent = 3,
	High = 2,
	Normal = 1,
	Low = 0
}

export enum Deadline {
	Never = 0,
	OneDay = 1,
	TwoDays = 2,
	FourDays = 3,
	OneWeek = 4,
	TwoWeeks = 5,
	OneMonth = 6
}

export const taskStatusNames = {
	[TaskStatus.Backlog]: 'Backlog',
	[TaskStatus.ToDo]: 'To Do',
	[TaskStatus.InProgress]: 'In Progress',
	[TaskStatus.Completed]: 'Completed'
}

export interface Task {
	id: string
	assignees: string[]
	name: string
	description: string
	priority: Priority
	status: TaskStatus
	deadline: Deadline
}
