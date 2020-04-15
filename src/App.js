import React, {useState, useEffect} from 'react';
import '@aws-amplify/ui/dist/style.css';

import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';

function App() {
  const [noteId, setNoteId] = useState("")
  const [note, setNote] = useState("")
  const [notes, setNotes] = useState ([])

  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(graphqlOperation(listNotes));
      setNotes(result.data.listNotes.items)
    }
    fetchData();
  }, []);

  const handleChangeNote = (e)=>setNote(e.target.value);

  const hasExistingNote = () => {
    if (noteId) {
      return notes.findIndex( (n) => n.id===noteId) > -1
    }
    return false
  }

  const handleFormSubmit = async event => {
    event.preventDefault();
    if (hasExistingNote()) {
      const result = await API.graphql(graphqlOperation(updateNote,{input:{id:noteId, Note:note}}))
      const updatedNote = result.data.updateNote;
      const index = notes.findIndex( n => n.id === updatedNote.id)
      notes[index] = updatedNote; // maybe better to use spread operator and new array?
      setNotes(notes)
    }
    else {
      const result = await API.graphql(graphqlOperation(createNote,{input:{Note:note}}))
      const newnote = result.data.createNote;
      setNotes([newnote, ...notes])
    }
    setNote("")
    setNoteId("")      
  }

  const handleDeleteNote = async noteId => {
    const input = { id: noteId }
    const result = await API.graphql(graphqlOperation(deleteNote,{input:input}))
    const deletedNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter( (n) => n.id !== deletedNoteId )
    setNotes(updatedNotes)
  }

  const handleSetNote = item => {
      setNote(item.Note)
      setNoteId(item.id)
  }

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      <form onSubmit={handleFormSubmit} className="mb3">
        <input 
          type="text" 
          className="pa2 f4" 
          placeholder="write your notes" 
          onChange={handleChangeNote}
          value={note}
        />
        <button type="submit" className="pa2 f4">
          {noteId==="" ? "Add Note" : "Update Note"}
        </button>
      </form>
      <div>
        {notes.map( item=> (
          <div key={item.id} className="flex items-center">
            <li onClick={()=>handleSetNote(item)} className="list pa1 f3">
              {item.Note}
            </li>
            <button onClick={() => handleDeleteNote(item.id)} className="bg-transparent bn f4">
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true});
