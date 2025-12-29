import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { Connect } from './pages/Connect';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { CreateEvent } from './pages/CreateEvent';

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/create-event" element={<CreateEvent />} />
                    <Route path="/connect" element={<Connect />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
