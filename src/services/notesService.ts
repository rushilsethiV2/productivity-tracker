import { NoteCollection, Note } from '../types';

const COLLECTIONS_KEY = 'app_note_collections';
const NOTES_KEY = 'app_notes';

export function saveCollections(collections: NoteCollection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function loadCollections(): NoteCollection[] {
  const data = localStorage.getItem(COLLECTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addCollection(collection: NoteCollection): void {
  const collections = loadCollections();
  collections.push(collection);
  saveCollections(collections);
}

export function updateCollection(updatedCollection: NoteCollection): void {
  const collections = loadCollections();
  const index = collections.findIndex(c => c.id === updatedCollection.id);
  if (index !== -1) {
    collections[index] = updatedCollection;
    saveCollections(collections);
  }
}

export function deleteCollection(id: string): void {
  const collections = loadCollections();
  const filtered = collections.filter(c => c.id !== id);
  saveCollections(filtered);

  const notes = loadNotes();
  const filteredNotes = notes.filter(n => n.collectionId !== id);
  saveNotes(filteredNotes);
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadNotes(): Note[] {
  const data = localStorage.getItem(NOTES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getNotesByCollection(collectionId: string): Note[] {
  const notes = loadNotes();
  return notes.filter(n => n.collectionId === collectionId);
}

export function getNoteById(id: string): Note | undefined {
  const notes = loadNotes();
  return notes.find(n => n.id === id);
}

export function addNote(note: Note): void {
  const notes = loadNotes();
  notes.push(note);
  saveNotes(notes);
}

export function updateNote(updatedNote: Note): void {
  const notes = loadNotes();
  const index = notes.findIndex(n => n.id === updatedNote.id);
  if (index !== -1) {
    notes[index] = updatedNote;
    saveNotes(notes);
  }
}

export function deleteNote(id: string): void {
  const notes = loadNotes();
  const filtered = notes.filter(n => n.id !== id);
  saveNotes(filtered);
}
