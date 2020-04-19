import React, { useState, useEffect } from 'react';
import '@aws-amplify/ui/dist/style.css';

import { API, Auth, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from './graphql/subscriptions';

function App() {
    const [noteId, setNoteId] = useState('');
    const [note, setNote] = useState('');
    const [notes, setNotes] = useState([]);

    useEffect ( () => {
        console.log('APP did mount');
        let createListener;
        let deleteListener;
        let updateListener;
        const setup = async () => {
            getNotes();
            createListener = API.graphql( 
                graphqlOperation(onCreateNote,{owner: (await Auth.currentUserInfo()).username})
            ).subscribe({
                next: noteData => {
                    const newNote = noteData.value.data.onCreateNote;
                    setNotes( prevNotes => {
                        const oldNotes = prevNotes.filter( note => note.id !== newNote.id);
                        return [...oldNotes, newNote];
                    })
                    setNote('')
                }
            });
            deleteListener = API.graphql(
                graphqlOperation(onDeleteNote, { owner: (await Auth.currentUserInfo()).username})
            ).subscribe({
                next: noteData => {
                    console.log('Subscribe delete', noteData);
                    const deletedNoteId = noteData.value.data.onDeleteNote.id;
                    setNotes( prevNotes => {
                        const updatedNotes = prevNotes.filter(n => n.id !== deletedNoteId);
                        return updatedNotes;                    
                    })
                }
            });
            updateListener = API.graphql(
                graphqlOperation(onUpdateNote, {owner: (await Auth.currentUserInfo()).username})
            ).subscribe({
                next: noteData => {
                    console.log('Subscribe update', noteData);
                    const updatedNote = noteData.value.data.onUpdateNote;
                    setNotes( prevNotes => {
                        const index = prevNotes.findIndex(n => n.id === updatedNote.id);
                        const updatedNotes = [...prevNotes]
                        updatedNotes[index] = updatedNote; // maybe better to use spread operator and new array?
                        return updatedNotes;
                    })
                    setNote('');
                    setNoteId('');
                }
            });
        };
        setup();

        return () => {
            console.log('use effect done');
            createListener.unsubscribe();
            deleteListener.unsubscribe(); 
            updateListener.unsubscribe();           
        };
    }, []);

    const getNotes = async () => {
        const result = await API.graphql(graphqlOperation(listNotes));
        setNotes(result.data.listNotes.items);
    };

    const handleChangeNote = e => setNote( e.target.value);

    const hasExistingNote = () => {
        if (noteId) {
            return notes.findIndex(n => n.id === noteId) > -1;
        }
        return false;
    };

    const handleFormSubmit = event => {
        event.preventDefault();
        if (hasExistingNote())
            API.graphql(
                graphqlOperation(updateNote, { input: { id: noteId, note: note } })
            );
        else API.graphql(graphqlOperation(createNote, { input: { note: note } }));
    };

    const handleDeleteNote = noteId => {
        const input = { id: noteId };
        API.graphql(graphqlOperation(deleteNote, { input: input }));
    };

    const handleSetNote = item => {
        setNote(item.note);
        setNoteId(item.id);
    };


    return (
        <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
            <h1 className='code f2-1'>Amplify Notetaker</h1>
            <form onSubmit={handleFormSubmit} className='mb3'>
                <input
                    type='text'
                    className='pa2 f4'
                    placeholder='write your notes'
                    onChange={handleChangeNote}
                    value={note}
                />
                <button type='submit' className='pa2 f4'>
                    {noteId === '' ? 'Add Note' : 'Update Note'}
                </button>
            </form>
            <div>
                {notes.map(item => (
                    <div key={item.id} className='flex items-center'>
                    <li
                        onClick={() => handleSetNote(item)}
                        className='list pa1 f3'
                    >
                        {item.note}
                    </li>
                    <button
                        onClick={() => handleDeleteNote(item.id)}
                        className='bg-transparent bn f4'
                    >
                        <span>&times;</span>
                    </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default withAuthenticator(App, { includeGreetings: true });