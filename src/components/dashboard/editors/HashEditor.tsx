import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { Trash2, Plus, Save, X, Edit2 } from 'lucide-react';

interface HashEditorProps {
  data: Record<string, string>;
  keyName: string;
}

export function HashEditor({ data, keyName }: HashEditorProps) {
  const { currentConnection } = useRedisStore();
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState(Object.entries(data));
  const [newField, setNewField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const updateMutation = useMutation({
    mutationFn: async ({ field, value, action }: { field: string, value?: string, action: 'add' | 'delete' | 'update' }) => {
      const res = await fetch('/api/redis/key', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'x-connection-id': currentConnection!.id 
        },
        body: JSON.stringify({
          key: keyName,
          type: 'hash',
          action,
          field,
          value
        }),
      });
      if (!res.ok) throw new Error('Failed to update hash');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyDetails', currentConnection?.id, keyName] });
      setNewField('');
      setNewValue('');
      setIsAdding(false);
      setEditingField(null);
    }
  });

  const handleAdd = () => {
    if (!newField) return;
    updateMutation.mutate({ field: newField, value: newValue, action: 'add' });
  };

  const handleUpdate = () => {
    if (!editingField) return;
    updateMutation.mutate({ field: editingField, value: editValue, action: 'update' });
  };

  const handleDelete = (field: string) => {
    if (confirm(`Delete field "${field}"?`)) {
        updateMutation.mutate({ field, action: 'delete' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-400">Hash Fields ({entries.length})</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Field
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-zinc-900/50 text-zinc-500 font-medium text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b border-zinc-800 w-1/3">Field</th>
              <th className="px-4 py-3 border-b border-zinc-800">Value</th>
              <th className="px-4 py-3 border-b border-zinc-800 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {isAdding && (
              <tr className="bg-blue-500/10">
                <td className="px-4 py-3">
                  <input 
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                    placeholder="Field name"
                    value={newField}
                    onChange={e => setNewField(e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                    placeholder="Value"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
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
            
            {entries.length === 0 && !isAdding && (
               <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-600 text-xs italic">
                  No fields found
                </td>
              </tr>
            )}

            {entries.map(([field, value]) => (
              <tr key={field} className="hover:bg-zinc-800/30 group">
                <td className="px-4 py-3 font-mono text-xs text-blue-400 font-medium truncate max-w-[200px]" title={field}>
                  {field}
                </td>
                <td className="px-4 py-3 font-mono text-xs truncate max-w-[300px]">
                  {editingField === field ? (
                     <div className="flex gap-2">
                        <input 
                            autoFocus
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                        />
                        <button onClick={handleUpdate} className="text-green-400 hover:text-green-300">
                            <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingField(null)} className="text-zinc-500 hover:text-zinc-300">
                            <X className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  ) : (
                    <span 
                        className="cursor-pointer hover:text-white" 
                        title={value}
                        onClick={() => { setEditingField(field); setEditValue(value); }}
                    >
                        {value}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {!editingField && (
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => { setEditingField(field); setEditValue(value); }}
                                className="text-zinc-400 hover:text-blue-400 p-1"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => handleDelete(field)}
                                className="text-zinc-400 hover:text-red-400 p-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
