import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  X, 
  Search,
  UserPlus,
  Crown,
  Shield,
  User,
  Package,
  MessageCircle,
  Settings
} from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useToast } from '@/hooks/use-toast';

interface GroupConversationProps {
  conversationId?: string;
  userRole: 'buyer' | 'supplier' | 'admin';
  userId: string;
  onClose?: () => void;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'supplier' | 'admin';
  isOnline: boolean;
  joinedAt: string;
  permissions: string[];
}

interface GroupConversation {
  id: string;
  name: string;
  description?: string;
  type: 'negotiation' | 'support' | 'project';
  createdBy: string;
  participants: Participant[];
  isActive: boolean;
  createdAt: string;
  lastMessageAt: string;
}

export default function GroupConversation({ 
  conversationId, 
  userRole, 
  userId, 
  onClose 
}: GroupConversationProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(!conversationId);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState<'negotiation' | 'support' | 'project'>('negotiation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group conversation details
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/chat/groups', conversationId],
    queryFn: () => apiRequest('GET', `/api/chat/groups/${conversationId}`),
    enabled: !!conversationId,
  });

  // Fetch available users for adding to group
  const { data: usersData } = useQuery({
    queryKey: ['/api/users/available'],
    queryFn: () => apiRequest('GET', '/api/users/available'),
    enabled: showAddParticipants || showCreateGroup,
  });

  // Create group conversation mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type: string;
      participants: string[];
    }) => apiRequest('POST', '/api/chat/groups', data),
    onSuccess: (newGroup) => {
      setShowCreateGroup(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      toast({
        title: "Group created",
        description: "Group conversation has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create group",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Add participants mutation
  const addParticipantsMutation = useMutation({
    mutationFn: (data: { conversationId: string; userIds: string[] }) =>
      apiRequest('POST', `/api/chat/groups/${data.conversationId}/participants`, { userIds: data.userIds }),
    onSuccess: () => {
      setShowAddParticipants(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', conversationId] });
      toast({
        title: "Participants added",
        description: "New participants have been added to the group",
      });
    }
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: (data: { conversationId: string; userId: string }) =>
      apiRequest('DELETE', `/api/chat/groups/${data.conversationId}/participants/${data.userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', conversationId] });
      toast({
        title: "Participant removed",
        description: "Participant has been removed from the group",
      });
    }
  });

  const group = groupData as GroupConversation;
  const availableUsers = (usersData as any)?.users || [];

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a group name and select participants",
        variant: "destructive"
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      type: groupType,
      participants: selectedUsers
    });
  };

  const handleAddParticipants = () => {
    if (!conversationId || selectedUsers.length === 0) return;

    addParticipantsMutation.mutate({
      conversationId,
      userIds: selectedUsers
    });
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (!conversationId) return;

    removeParticipantMutation.mutate({
      conversationId,
      userId: participantId
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'supplier':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'buyer':
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'supplier':
        return 'bg-green-100 text-green-800';
      case 'buyer':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'support':
        return <Shield className="h-4 w-4" />;
      case 'project':
        return <Settings className="h-4 w-4" />;
      case 'negotiation':
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const filteredUsers = availableUsers.filter((user: any) => 
    !selectedUsers.includes(user.id) &&
    (group ? !group.participants.some(p => p.id === user.id) : true) &&
    (!searchQuery || 
     user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (showCreateGroup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Create Group Conversation
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 overflow-y-auto space-y-4">
            {/* Group Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['negotiation', 'support', 'project'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={groupType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGroupType(type)}
                      className="flex items-center justify-center"
                    >
                      {getTypeIcon(type)}
                      <span className="ml-1 capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Participant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Participants *
              </label>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Selected:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find((u: any) => u.id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="flex items-center space-x-1">
                          <span>{user.name || user.email}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Available Users */}
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedUsers(prev => [...prev, user.id])}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </Badge>
                        {getRoleIcon(user.role)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending || !groupName.trim() || selectedUsers.length === 0}
              >
                {createGroupMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversationId || groupLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Group Info Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              {group?.name || 'Group Chat'}
            </h3>
            <Badge variant="outline" className="capitalize">
              {group?.type}
            </Badge>
          </div>
          {group?.description && (
            <p className="text-sm text-gray-600">{group.description}</p>
          )}
        </div>

        {/* Participants */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Participants ({group?.participants?.length || 0})</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddParticipants(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {group?.participants?.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{participant.name}</div>
                    <div className="text-xs text-gray-500">{participant.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(participant.role)}`}>
                    {participant.role}
                  </Badge>
                  {participant.id === group.createdBy && (
                    <Crown className="h-4 w-4 text-yellow-500" title="Group Creator" />
                  )}
                  {participant.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <ChatWindow
          conversationId={conversationId}
          userRole={userRole}
          userId={userId}
          className="h-full border-0"
        />
      </div>

      {/* Add Participants Modal */}
      {showAddParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Add Participants</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddParticipants(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded"
                      onClick={() => {
                        if (selectedUsers.includes(user.id)) {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        } else {
                          setSelectedUsers(prev => [...prev, user.id]);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <span className="text-sm">{user.name || user.email}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddParticipants(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddParticipants}
                    disabled={selectedUsers.length === 0}
                  >
                    Add ({selectedUsers.length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}