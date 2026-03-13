'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
}

interface CardNotesProps {
  itemId: string
  notes: Note[]
  onNotesUpdate: (itemId: string, notes: Note[]) => void
}

export function CardNotes({ itemId, notes, onNotesUpdate }: CardNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    const newNoteObj: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedNotes = [...notes, newNoteObj]
    onNotesUpdate(itemId, updatedNotes)
    setNewNote('')
  }

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      setEditingNoteId(noteId)
      setEditingContent(note.content)
    }
  }

  const handleSaveEdit = () => {
    if (!editingNoteId || !editingContent.trim()) return

    const updatedNotes = notes.map(note =>
      note.id === editingNoteId
        ? { ...note, content: editingContent.trim(), updated_at: new Date().toISOString() }
        : note
    )

    onNotesUpdate(itemId, updatedNotes)
    setEditingNoteId(null)
    setEditingContent('')
  }

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    onNotesUpdate(itemId, updatedNotes)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 dark:border-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Edit className="h-3 w-3 mr-1" />
          Anotações ({notes.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Edit className="h-6 w-6" />
              Anotações do Card
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Adicionar nova anotação */}
            <div className="space-y-3">
              <Textarea
                placeholder="Digite sua anotação..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px] border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl font-bold"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs h-10 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus className="h-3 w-3 mr-2" />
                Adicionar Anotação
              </Button>
            </div>

            {/* Lista de anotações */}
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic">
                  Nenhuma anotação ainda. Adicione a primeira!
                </div>
              ) : (
                notes.map((note) => (
                  <Card
                    key={note.id}
                    className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl bg-slate-50 dark:bg-slate-800"
                  >
                    <CardContent className="p-4">
                      {editingNoteId === note.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[60px] border-2 border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-8"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              onClick={() => setEditingNoteId(null)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-2 border-slate-900 dark:border-slate-950 text-xs h-8"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {note.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px] font-bold">
                              {new Date(note.updated_at).toLocaleDateString('pt-BR')}
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditNote(note.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteNote(note.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}