import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import type { Room, Card as CardType } from '../types';

// suit symbols
const SUIT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  Hearts: { symbol: '♥', color: '#ef4444' },
  Diamonds: { symbol: '♦', color: '#ef4444' },
  Clubs: { symbol: '♣', color: '#e2e8f0' },
  Spades: { symbol: '♠', color: '#e2e8f0' },
};

export const AdminPage: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isSpectating, setIsSpectating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // handle admin auth
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !adminKey.trim()) return;

    socket.emit('admin_auth', { key: adminKey.trim() }, (res: any) => {
      if (res.success) {
        setIsAuthenticated(true);
        setRooms(res.rooms || []);
        setAuthError(null);
      } else {
        setAuthError(res.error || 'Authentication failed');
      }
    });
  };

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // listen for room updates
    const onRoomsUpdated = (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    };

    // listen for spectator room update
    const onSpectateUpdated = (updatedRoom: Room) => {
      setSelectedRoom((prev) => (prev?.id === updatedRoom.id ? updatedRoom : prev));
    };

    // listen for spectator room closed
    const onRoomClosed = ({ roomId }: { roomId: string }) => {
      setSelectedRoom((prev) => {
        if (prev?.id === roomId) {
          setIsSpectating(false);
          return null;
        }
        return prev;
      });
      setActionMessage(`Room ${roomId} has been ended.`);
      setTimeout(() => setActionMessage(null), 4000);
    };

    socket.on('admin_rooms_updated', onRoomsUpdated);
    socket.on('admin_room_spectate_updated', onSpectateUpdated);
    socket.on('admin_room_closed', onRoomClosed);

    return () => {
      socket.off('admin_rooms_updated', onRoomsUpdated);
      socket.off('admin_room_spectate_updated', onSpectateUpdated);
      socket.off('admin_room_closed', onRoomClosed);
    };
  }, [socket, isAuthenticated]);

  // start spectating
  const handleSpectate = (roomId: string) => {
    if (!socket) return;
    socket.emit('admin_spectate_room', { roomId }, (res: any) => {
      if (res.success) {
        setSelectedRoom(res.room);
        setIsSpectating(true);
      }
    });
  };

  // stop spectating
  const handleStopSpectating = () => {
    if (socket && selectedRoom) {
      socket.emit('admin_leave_spectate', { roomId: selectedRoom.id });
    }
    setIsSpectating(false);
    setSelectedRoom(null);
  };

  // force close room
  const handleCloseRoom = (roomId: string) => {
    if (!socket) return;
    if (window.confirm(`Are you sure you want to end Room ${roomId}? This will disconnect all players.`)) {
      socket.emit('admin_close_room', { roomId }, (res: any) => {
        if (res.success) {
          setActionMessage(`Room ${roomId} terminated.`);
          if (selectedRoom?.id === roomId) {
            setIsSpectating(false);
            setSelectedRoom(null);
          }
          setTimeout(() => setActionMessage(null), 4000);
        }
      });
    }
  };

  // kick individual player
  const handleKickPlayer = (roomId: string, playerId: string, playerName: string) => {
    if (!socket) return;
    if (window.confirm(`Kick ${playerName} from room ${roomId}?`)) {
      socket.emit('admin_kick_player', { roomId, targetPlayerId: playerId });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <div style={styles.badge}>🛡️ ADMIN SYSTEM</div>
          <h1 style={styles.title}>Kazhutha Control Center</h1>
          <p style={styles.subtitle}>Enter key to manage live server rooms</p>

          <form onSubmit={handleAuth} style={styles.form}>
            <input
              type="password"
              placeholder="Admin Passkey"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              style={styles.input}
            />
            {authError && <div style={styles.error}>{authError}</div>}
            <button type="submit" style={styles.primaryButton}>
              Authenticate
            </button>
          </form>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            Connection Status: {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Kazhutha Admin Dashboard</h1>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Real-time Active Rooms & Resource Management
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={styles.statBadge}>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{rooms.length}</span> Active Rooms
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setAdminKey('');
            }}
            style={styles.secondaryButton}
          >
            Logout
          </button>
        </div>
      </header>

      {actionMessage && <div style={styles.alertBanner}>{actionMessage}</div>}

      <main style={styles.mainGrid}>
        {/* Rooms List Section */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Active Server Rooms ({rooms.length})</h2>

          {rooms.length === 0 ? (
            <div style={styles.emptyState}>No active game rooms currently running on the server.</div>
          ) : (
            <div style={styles.roomsList}>
              {rooms.map((rm) => (
                <div key={rm.id} style={styles.roomItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={styles.roomCode}>#{rm.id}</span>
                      <span
                        style={{
                          ...styles.stateBadge,
                          backgroundColor:
                            rm.state === 'PLAYING'
                              ? '#0284c7'
                              : rm.state === 'LOBBY'
                              ? '#d97706'
                              : '#65a30d',
                        }}
                      >
                        {rm.state}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      👥 {rm.players.length} / 7 Players
                    </div>
                  </div>

                  <div style={styles.playersSummary}>
                    {rm.players.map((p) => (
                      <span key={p.id} style={styles.playerTag}>
                        {p.isHost ? '👑 ' : ''}
                        {p.name} {p.isSpectator ? '(Spec)' : ''}
                        {p.ping !== undefined ? ` • ${p.ping}ms` : ''}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleSpectate(rm.id)}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: selectedRoom?.id === rm.id ? '#0369a1' : '#1e293b',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                      }}
                    >
                      👁️ Spectate Anonymously
                    </button>

                    <button
                      onClick={() => handleCloseRoom(rm.id)}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: '#991b1b',
                        color: '#fecaca',
                      }}
                    >
                      🚫 End Room Connection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Spectator Inspection View */}
        {isSpectating && selectedRoom && (
          <section style={styles.spectateCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                  🕵️ ANONYMOUS SPECTATOR MODE
                </span>
                <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '18px' }}>
                  Room #{selectedRoom.id}
                </h3>
              </div>
              <button onClick={handleStopSpectating} style={styles.secondaryButton}>
                Close View
              </button>
            </div>

            <div style={{ margin: '16px 0', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '8px' }}>
                State: <strong>{selectedRoom.state}</strong> | Turn:{' '}
                <strong>
                  {selectedRoom.players.find((p) => p.id === selectedRoom.currentTurnId)?.name || 'N/A'}
                </strong>
              </div>
              {selectedRoom.lastTrickMessage && (
                <div style={{ fontSize: '13px', color: '#fbbf24', fontStyle: 'italic' }}>
                  {selectedRoom.lastTrickMessage}
                </div>
              )}
            </div>

            {/* Table Center Cards */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={styles.subHeader}>Center Cards Played</h4>
              {selectedRoom.centerCards.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748b' }}>No cards played in center</div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedRoom.centerCards.map((pc, idx) => {
                    const p = selectedRoom.players.find((player) => player.id === pc.playerId);
                    const suitInfo = SUIT_SYMBOLS[pc.card.suit] || { symbol: '?', color: '#fff' };
                    return (
                      <div key={idx} style={styles.cardBox}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p?.name}</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: suitInfo.color }}>
                          {pc.card.rank}
                          {suitInfo.symbol}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Player Hands Inspection */}
            <div>
              <h4 style={styles.subHeader}>Players & Hands</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedRoom.players.map((p) => (
                  <div key={p.id} style={styles.playerHandRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: p.id === selectedRoom.currentTurnId ? '#38bdf8' : '#fff', fontWeight: 'bold' }}>
                        {p.name} {p.isHost ? '👑' : ''} ({p.hand.length} cards)
                      </span>
                      <button
                        onClick={() => handleKickPlayer(selectedRoom.id, p.id, p.name)}
                        style={{ ...styles.smallDangerBtn }}
                      >
                        Kick
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {p.hand.map((card: CardType, cIdx: number) => {
                        const suitInfo = SUIT_SYMBOLS[card.suit] || { symbol: '?', color: '#fff' };
                        return (
                          <span key={cIdx} style={{ ...styles.miniCard, color: suitInfo.color }}>
                            {card.rank}
                            {suitInfo.symbol}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// styling
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#090d16',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  },
  loginCard: {
    maxWidth: '400px',
    margin: '100px auto',
    padding: '32px',
    backgroundColor: '#111827',
    borderRadius: '16px',
    border: '1px solid #1f2937',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#0284c7',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    color: '#fff',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
  },
  primaryButton: {
    padding: '12px',
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: '#1f2937',
    color: '#cbd5e1',
    border: '1px solid #374151',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #1e293b',
    marginBottom: '24px',
  },
  statBadge: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
  },
  alertBanner: {
    padding: '12px 20px',
    backgroundColor: '#0284c7',
    color: '#fff',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '20px',
  },
  spectateCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: '12px',
    padding: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#fff',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  roomsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  roomItem: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #334155',
  },
  roomCode: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#f8fafc',
    marginRight: '8px',
  },
  stateBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#fff',
  },
  playersSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  },
  playerTag: {
    backgroundColor: '#0f172a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#cbd5e1',
  },
  actionButton: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  subHeader: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  cardBox: {
    backgroundColor: '#1e293b',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #334155',
    textAlign: 'center',
  },
  playerHandRow: {
    backgroundColor: '#1e293b',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  miniCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  smallDangerBtn: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
