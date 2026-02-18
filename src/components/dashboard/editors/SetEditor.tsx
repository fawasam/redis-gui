import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { Trash2, Plus, Save, X } from 'lucide-react';

interface SetEditorProps {
  data: string[];
  keyName: string;
}

export function SetEditor({ data, keyName }: SetEditorProps) {
  const { currentConnection } = useRedisStore();
  const queryClient = useQueryClient();
  const [newMember, setNewMember] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ member, action }: { member: string, action: 'add' | 'delete' }) => {
      const res = await fetch('/api/redis/key', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'x-connection-id': currentConnection!.id 
        },
        body: JSON.stringify({
          key: keyName,
          type: 'set',
          action,
          member
        }),
      });
      if (!res.ok) throw new Error('Failed to update set');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyDetails', currentConnection?.id, keyName] });
      setNewMember('');
      setIsAdding(false);
    }
  });

  const handleAdd = () => {
    if (!newMember) return;
    updateMutation.mutate({ member: newMember, action: 'add' });
  };

  const handleDelete = (member: string) => {
    if (confirm(`Remove member "${member}"?`)) {
        updateMutation.mutate({ member, action: 'delete' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-400">Set Members ({data.length})</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Member
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isAdding && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <input 
              autoFocus
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
              placeholder="New member value"
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="text-blue-400 hover:text-blue-300 p-2 bg-zinc-900 rounded">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-300 p-2 hover:bg-zinc-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {data.length === 0 && !isAdding && (
          <div className="text-center text-zinc-600 text-sm italic py-8">
            Empty Set
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((member, index) => (
            <div key={`${member}-${index}`} className="group flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <span className="font-mono text-xs text-zinc-300 truncate mr-2" title={member}>
                {member}
              </span>
              <button 
                onClick={() => handleDelete(member)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-1"
                title="Remove member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
