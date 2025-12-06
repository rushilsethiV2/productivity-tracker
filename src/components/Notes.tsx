import { useState, useEffect, useRef } from 'react';
import { Menu, BookOpen, Plus, Trash2, Edit2, X, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { NoteCollection, Note } from '../types';
import {
  loadCollections,
  loadNotes,
  addCollection,
  updateCollection,
  deleteCollection,
  addNote,
  updateNote,
  deleteNote,
  getNotesByCollection,
} from '../services/notesService';
import MarkdownEditor from './MarkdownEditor';

export default function Notes() {
  const [collections, setCollections] = useState<NoteCollection[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      const collectionNotes = getNotesByCollection(selectedCollection);
      setNotes(collectionNotes);
    } else {
      setNotes([]);
    }
  }, [selectedCollection]);

  const refreshData = () => {
    const loadedCollections = loadCollections();
    setCollections(loadedCollections);
    if (selectedCollection) {
      const collectionNotes = getNotesByCollection(selectedCollection);
      setNotes(collectionNotes);
    }
  };

  const handleAddCollection = (name: string) => {
    if (!name?.trim()) return;

    const collection: NoteCollection = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    addCollection(collection);
    refreshData();
    setShowAddCollectionModal(false);
    toast.success('Collection created!');
  };

  const handleRenameCollection = (id: string, currentName: string) => {
    setRenameTarget({ id, name: currentName });
    setShowRenameModal(true);
    setShowCollectionMenu(null);
  };

  const handleConfirmRename = (newName: string) => {
    if (!renameTarget || !newName.trim()) return;

    const collection = collections.find(c => c.id === renameTarget.id);
    if (collection) {
      updateCollection({ ...collection, name: newName.trim() });
      refreshData();
      toast.success('Collection renamed!');
    }
    setShowRenameModal(false);
    setRenameTarget(null);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-3">Delete "{name}"?</p>
          <p className="text-sm text-gray-400 mb-4">All notes in this collection will be deleted.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteCollection(id);
                if (selectedCollection === id) {
                  setSelectedCollection(null);
                  setSelectedNote(null);
                }
                refreshData();
                closeToast();
                toast.success('Collection deleted');
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={closeToast}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
    setShowCollectionMenu(null);
  };

  const handleAddNote = () => {
    if (!selectedCollection) {
      toast.error('Please select a collection first');
      return;
    }

    const note: Note = {
      id: Date.now().toString(),
      collectionId: selectedCollection,
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addNote(note);
    refreshData();
    setSelectedNote(note);
    toast.success('Note created!');
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      const updated = {
        ...note,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      updateNote(updated);
      refreshData();
      setSelectedNote(updated);
    }
  };

  const handleDeleteNote = (id: string, title: string) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-3">Delete "{title}"?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteNote(id);
                if (selectedNote?.id === id) {
                  setSelectedNote(null);
                }
                refreshData();
                closeToast();
                toast.success('Note deleted');
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={closeToast}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  const sidebar = (
    <div className="h-full flex flex-col bg-[rgb(var(--card))] border-r border-[rgb(var(--border))]">
      <div className="p-4 border-b border-[rgb(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">Collections</h2>
          </div>
          <button
            onClick={() => setShowAddCollectionModal(true)}
            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {collections.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No collections yet. Create one to get started!
          </div>
        ) : (
          <div className="p-2">
            {collections.map(collection => (
              <div key={collection.id} className="mb-1">
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group ${
                    selectedCollection === collection.id
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'hover:bg-[rgb(var(--background))] border border-transparent'
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedCollection(collection.id);
                      setSelectedNote(null);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex-1"
                  >
                    <h3 className="font-medium text-sm">{collection.name}</h3>
                    <p className="text-xs text-gray-400">
                      {getNotesByCollection(collection.id).length} notes
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCollectionMenu(showCollectionMenu === collection.id ? null : collection.id);
                      }}
                      className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                    {showCollectionMenu === collection.id && (
                      <div className="absolute right-0 top-full mt-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg z-50 min-w-[150px]">
                        <button
                          onClick={() => handleRenameCollection(collection.id, collection.name)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[rgb(var(--background))] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleAddNote()}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[rgb(var(--background))] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          New Note
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection.id, collection.name)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCollection === collection.id && notes.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {notes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => {
                          setSelectedNote(note);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group ${
                          selectedNote?.id === note.id
                            ? 'bg-yellow-500/20 border border-yellow-500'
                            : 'hover:bg-[rgb(var(--background))] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate">{note.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id, note.title);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCollection && (
        <div className="p-4 border-t border-[rgb(var(--border))]">
          <button
            onClick={handleAddNote}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex md:pl-20">
      <div className={`fixed md:relative inset-y-0 left-0 md:left-0 w-64 md:w-1/5 z-30 transform transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {sidebar}
      </div>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col md:w-4/5">
        <div className="p-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center gap-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-[rgb(var(--background))] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Notes
              </h1>
              <p className="text-sm text-gray-400">Organize your thoughts with markdown</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {!selectedNote ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-gray-400">
                  {collections.length === 0
                    ? 'Create a collection to get started'
                    : selectedCollection
                    ? 'Create your first note'
                    : 'Select a collection'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {collections.length === 0
                    ? 'Collections help you organize your notes by topic or project'
                    : selectedCollection
                    ? 'Notes support markdown formatting for rich text editing'
                    : 'Choose a collection from the sidebar to view its notes'}
                </p>
                {collections.length === 0 ? (
                  <button
                    onClick={() => setShowAddCollectionModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl transition-all font-semibold"
                  >
                    Create First Collection
                  </button>
                ) : selectedCollection ? (
                  <button
                    onClick={handleAddNote}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl transition-all font-semibold"
                  >
                    Create First Note
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <MarkdownEditor
              note={selectedNote}
              onUpdate={handleUpdateNote}
            />
          )}
        </div>
      </div>

      {showRenameModal && renameTarget && (
        <RenameModal
          currentName={renameTarget.name}
          onClose={() => {
            setShowRenameModal(false);
            setRenameTarget(null);
          }}
          onConfirm={handleConfirmRename}
        />
      )}

      {showAddCollectionModal && (
        <AddCollectionModal
          onClose={() => setShowAddCollectionModal(false)}
          onConfirm={handleAddCollection}
        />
      )}
    </div>
  );
}

function AddCollectionModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">New Collection</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name..."
              className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-gray-500 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg transition-all font-semibold"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameModal({
  currentName,
  onClose,
  onConfirm,
}: {
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Rename Collection</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-gray-500 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg transition-all font-semibold"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
