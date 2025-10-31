import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Search,
  Bell,
  Archive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  assigneeName: string;
  assignerName: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  receiverName: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'urgent';
  targetRoles: string[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  creatorName: string;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function StaffCommunication() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as const,
    dueDate: ''
  });
  
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    subject: '',
    content: ''
  });
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'info' as const,
    targetRoles: [] as string[]
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffMembers();
    fetchTasks();
    fetchMessages();
    fetchAnnouncements();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch('/api/suppliers/staff', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/tasks', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/messages', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/announcements', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(taskForm)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task created successfully'
        });
        setIsTaskDialogOpen(false);
        setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
        fetchTasks();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(messageForm)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Message sent successfully'
        });
        setIsMessageDialogOpen(false);
        setMessageForm({ receiverId: '', subject: '', content: '' });
        fetchMessages();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(announcementForm)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Announcement created successfully'
        });
        setIsAnnouncementDialogOpen(false);
        setAnnouncementForm({ title: '', content: '', priority: 'info', targetRoles: [] });
        fetchAnnouncements();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create announcement');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/suppliers/staff/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task status updated'
        });
        fetchTasks();
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Communication & Tasks</h2>
          <p className="text-gray-600">Manage team communication and task assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create and assign a task to a team member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Describe the task details"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="task-assignee">Assign To</Label>
                  <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.filter(s => s.isActive).map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!taskForm.title || !taskForm.assignedTo}>
                  Assign Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
                <DialogDescription>
                  Send a direct message to a team member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message-recipient">Recipient</Label>
                  <Select value={messageForm.receiverId} onValueChange={(value) => setMessageForm({ ...messageForm, receiverId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.filter(s => s.isActive).map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message-subject">Subject</Label>
                  <Input
                    id="message-subject"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="Message subject"
                  />
                </div>
                <div>
                  <Label htmlFor="message-content">Message</Label>
                  <Textarea
                    id="message-content"
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    placeholder="Type your message here"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={!messageForm.receiverId || !messageForm.content}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Assign and track tasks for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                  <p className="text-gray-500 mb-4">Start by assigning tasks to your team members</p>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign First Task
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{task.assigneeName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(task.priority)}
                            <Badge className={PRIORITY_COLORS[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge className={STATUS_COLORS[task.status]}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onValueChange={(value) => updateTaskStatus(task.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Messages</CardTitle>
              <CardDescription>
                Direct communication with team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                  <p className="text-gray-500 mb-4">Start communicating with your team</p>
                  <Button onClick={() => setIsMessageDialogOpen(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send First Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-gray-600">{message.receiverName}</span>
                          {!message.isRead && <Badge variant="secondary">Unread</Badge>}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium mb-2">{message.subject}</h4>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Announcements
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Bell className="w-4 h-4 mr-2" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>
                        Broadcast a message to your team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                          id="announcement-title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="Announcement title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="announcement-content">Content</Label>
                        <Textarea
                          id="announcement-content"
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          placeholder="Announcement content"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="announcement-priority">Priority</Label>
                        <Select 
                          value={announcementForm.priority} 
                          onValueChange={(value: any) => setAnnouncementForm({ ...announcementForm, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAnnouncement} disabled={!announcementForm.title || !announcementForm.content}>
                        Create Announcement
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Important updates and announcements for the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                  <p className="text-gray-500 mb-4">Create announcements to keep your team informed</p>
                  <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
                    <Bell className="w-4 h-4 mr-2" />
                    Create First Announcement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'outline'}>
                            {announcement.priority}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{announcement.content}</p>
                      <div className="text-sm text-gray-500">
                        By {announcement.creatorName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}