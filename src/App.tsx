
// App.tsx
import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json';
import { DataRoom } from './components/DataRoom';

// Configure Amplify
Amplify.configure(outputs);

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Authenticator>
        {({ signOut, user }) => (
          <div className="authenticated-app">
            <header className="app-header">
              <div className="header-content">
                <h1>🗂️ Personal Data Room</h1>
                <div className="user-info">
                  <span className="welcome-text">
                    Welcome, {user?.username || 'User'}!
                  </span>
                  <button onClick={signOut} className="sign-out-btn">
                    Sign Out
                  </button>
                </div>
              </div>
            </header>

            <main className="app-main">
              <DataRoom />
            </main>

            <footer className="app-footer">
              <p>
                Your files are stored securely and only accessible by you. 
                Each user has their own private space.
              </p>
            </footer>
          </div>
        )}
      </Authenticator>

      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-spinner {
          color: white;
          font-size: 18px;
          font-weight: 500;
        }

        .authenticated-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 15px 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .app-header h1 {
          margin: 0;
          color: #2d3748;
          font-size: 24px;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .welcome-text {
          color: #4a5568;
          font-weight: 500;
        }

        .sign-out-btn {
          padding: 8px 16px;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .sign-out-btn:hover {
          background: #c53030;
        }

        .app-main {
          flex: 1;
          padding: 30px 20px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .app-footer {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px;
          text-align: center;
          color: white;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .app-footer p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .app-header h1 {
            font-size: 20px;
          }

          .user-info {
            flex-direction: column;
            gap: 10px;
          }

          .app-main {
            padding: 20px 15px;
          }
        }
      `}</style>
      
      <style>{`
        /* Override Amplify Authenticator styles */
        .amplify-authenticator {
          --amplify-colors-brand-primary-60: #667eea;
          --amplify-colors-brand-primary-80: #764ba2;
          --amplify-colors-brand-primary-90: #5a4fcf;
          --amplify-colors-brand-primary-100: #4c51bf;
        }

        .amplify-authenticator__container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .amplify-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}