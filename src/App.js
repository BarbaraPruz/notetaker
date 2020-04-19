// Class Component Implementation Example - NOT USED!

import React, { Component } from 'react';
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

class App extends Component {
  state = {
    noteId: '',
    note: '',
    notes: []
  };

  async componentDidMount () {
    console.log('APP did mount');
    this.getNotes();
    this.createListener = API.graphql(
      graphqlOperation(onCreateNote, {
        owner: (await Auth.currentUserInfo()).username
      })
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          note => note.id !== newNote.id
        );
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes, note: '' });
      }
    });
    this.deleteListener = API.graphql(
      graphqlOperation(onDeleteNote, {
        owner: (await Auth.currentUserInfo()).username
      })
    ).subscribe({
      next: noteData => {
        console.log('Subscribe delete', noteData);
        const deletedNoteId = noteData.value.data.onDeleteNote.id;
        const updatedNotes = this.state.notes.filter(
          n => n.id !== deletedNoteId
        );
        this.setState({ notes: updatedNotes });
      }
    });
    this.updateListener = API.graphql(
      graphqlOperation(onUpdateNote, {
        owner: (await Auth.currentUserInfo()).username
      })
    ).subscribe({
      next: noteData => {
        console.log('Subscribe update', noteData);
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = this.state.notes.findIndex(n => n.id === updatedNote.id);
        const updatedNotes = [...this.state.notes];
        updatedNotes[index] = updatedNote; // maybe better to use spread operator and new array?
        this.setState({ notes: updatedNotes });
      }
    });
  }

  componentWillUnmount () {
    this.createListener.unsubscribe();
    this.deleteListener.unsubscribe();
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };

  handleChangeNote = e => this.setState({ note: e.target.value });

  hasExistingNote = () => {
    const { noteId, notes } = this.state;
    if (noteId) {
      return notes.findIndex(n => n.id === noteId) > -1;
    }
    return false;
  };

  handleFormSubmit = event => {
    const { noteId, note } = this.state;
    event.preventDefault();
    if (this.hasExistingNote())
      API.graphql(
        graphqlOperation(updateNote, { input: { id: noteId, note: note } })
      );
    else API.graphql(graphqlOperation(createNote, { input: { note: note } }));
    this.setState({ note: '', noteId: '' });
  };

  handleDeleteNote = noteId => {
    const input = { id: noteId };
    API.graphql(graphqlOperation(deleteNote, { input: input }));
  };

  handleSetNote = item => {
    this.setState({ note: item.note, noteId: item.id });
  };

  render () {
    const { note, noteId, notes } = this.state;
    return (
      <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
        <h1 className='code f2-1'>Amplify Notetaker</h1>
        <form onSubmit={this.handleFormSubmit} className='mb3'>
          <input
            type='text'
            className='pa2 f4'
            placeholder='write your notes'
            onChange={this.handleChangeNote}
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
                onClick={() => this.handleSetNote(item)}
                className='list pa1 f3'
              >
                {item.note}
              </li>
              <button
                onClick={() => this.handleDeleteNote(item.id)}
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
}

export default withAuthenticator(App, { includeGreetings: true });
