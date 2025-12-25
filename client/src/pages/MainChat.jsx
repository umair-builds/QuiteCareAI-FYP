import React from 'react';
import Navbar from '../components/Navbar';

const MainChat = () => {
  return (
    <div>
      <Navbar page="chat" />
      <div style={{ display: 'flex', height: '90vh' }}>
        
        {/* Left Side: Chat History */}
        <div style={{ width: '20%', background: '#f0f0f0', padding: '10px' }}>
          <h3>Chat History</h3>
          <p>[List of previous sessions]</p>
        </div>

        {/* Right Side: Workspace */}
        <div style={{ width: '80%', padding: '10px' }}>
          
          {/* Visual Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '300px', background: '#e0e0e0', marginBottom: '10px' }}>
             <div style={{ width: '48%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                [User Webcam Input Area]
             </div>
             <div style={{ width: '48%', background: 'gray', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                [Avatar Animation Output]
             </div>
          </div>

          {/* Controls */}
          <div style={{ marginBottom: '10px' }}>
             <button>Start Input</button> <button>Pause</button> <button>Enter (Send)</button> <button>Retake</button> <button>Close Session</button>
          </div>

          {/* Text Chat Area */}
          <div style={{ border: '1px solid #ccc', padding: '10px', height: '150px' }}>
             <p>[Chat Text Log will appear here]</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainChat;