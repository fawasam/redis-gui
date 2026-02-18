import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { Trash2, Plus, Save, X } from 'lucide-react';

interface ZSetEditorProps {
  data: { score: number, value: string }[];
  keyName: string;
}

export function ZSetEditor({ data, keyName }: ZSetEditorProps) {
  const { currentConnection } = useRedisStore();
  const queryClient = useQueryClient();
  const [newMember, setNewMember] = useState('');
  const [newScore, setNewScore] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ score, member, action }: { score?: number, member: string, action: 'add' | 'delete' }) => {
      const res = await fetch('/api/redis/key', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'x-connection-id': currentConnection!.id 
        },
        body: JSON.stringify({
          key: keyName,
          type: 'zset',
          action,
          member,
          score
        }),
      });
      if (!res.ok) throw new Error('Failed to update zset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyDetails', currentConnection?.id, keyName] });
      setNewMember('');
      setNewScore('');
      setIsAdding(false);
    }
  });

  const handleAdd = () => {
    if (!newMember || !newScore) return;
    updateMutation.mutate({ member: newMember, score: parseFloat(newScore), action: 'add' });
  };

  const handleDelete = (member: string) => {
    if (confirm(`Remove member "${member}"?`)) {
        updateMutation.mutate({ member, action: 'delete' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-400">Sorted Set Members ({data.length})</h3>
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
                >
                <Plus className="w-3.5 h-3.5" />
                Add Member
            </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/50 text-zinc-500 font-medium text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                    <th className="px-4 py-3 border-b border-zinc-800 w-24">Score</th>
                    <th className="px-4 py-3 border-b border-zinc-800">Member</th>
                    <th className="px-4 py-3 border-b border-zinc-800 w-16 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
             {isAdding && (
              <tr className="bg-blue-500/10">
                <td className="px-4 py-3">
                  <input 
                    autoFocus
                    type="number"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                    placeholder="Score"
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                    placeholder="Member value"
                    value={newMember}
                    onChange={e => setNewMember(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={handleAdd} className="text-blue-400 hover:text-blue-300 p-1">
                            <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
              </tr>
            )}

             {data.length === 0 && !isAdding && (
               <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-600 text-xs italic">
                  Empty Sorted Set
                </td>
              </tr>
            )}

            {data.map((item, index) => (
                <tr key={`${item.value}-${index}`} className="group hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">
                        {item.score}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[300px]" title={item.value}>
                        {item.value}
                    </td>
                    <td className="px-4 py-3 text-right">
                        <button 
                            onClick={() => handleDelete(item.value)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
