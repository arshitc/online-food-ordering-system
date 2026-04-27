import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendOrderChat, resolveOwnerOrderIssue } from "../redux/orderSlice";

const IssueChatModal = ({ orderId, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const order = useSelector((state) => state.orders.list.find((o) => o._id === orderId));
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const isOwner = user?.role === "owner" || user?.role === "admin";
  const messages = useMemo(() => order?.issueReport?.chatMessages || [], [order]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await dispatch(sendOrderChat({ id: order._id, payload: { message } })).unwrap();
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleResolve = () => {
    dispatch(resolveOwnerOrderIssue({ id: order._id, payload: { note: "Issue officially resolved by owner." } }));
    onClose();
  };

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(31, 41, 51, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="form-card" style={{ background: '#fff', position: 'relative', width: 'min(500px, 95%)', display: 'flex', flexDirection: 'column', maxHeight: '80vh', padding: '1.5rem' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#66717f' }}
        >
          ✖
        </button>

        <h3 style={{ marginBottom: "0.2rem" }}>Issue Chat for Order #{order._id.slice(-6)}</h3>
        <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: '#66717f' }}>
          <strong>Initial Complaint:</strong> {order.issueReport.message}
        </p>
        
        {isOwner && (
          <button 
            className="button secondary" 
            style={{ marginBottom: "1rem", alignSelf: "flex-start", borderColor: "#991b1b", color: "#991b1b" }} 
            onClick={handleResolve}
          >
            Mark Issue as Resolved
          </button>
        )}

        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem',
          backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem'
        }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: 'auto' }}>No messages yet. Send a message to start the chat.</p>
          ) : (
            messages.map((msg, idx) => {
              const isMine = (msg.senderRole.toLowerCase() === "customer" && !isOwner) || 
                             (msg.senderRole.toLowerCase() === "restaurant" && isOwner);
              
              return (
                <div key={idx} style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                    {msg.senderRole}
                  </span>
                  <div style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: isMine ? '#e36935' : '#e2e8f0',
                    color: isMine ? '#fff' : '#1f2933',
                    borderBottomRightRadius: isMine ? '0' : '12px',
                    borderBottomLeftRadius: isMine ? '12px' : '0'
                  }}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={handleSendMessage}>
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Type your message..." 
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="button" style={{ margin: 0, padding: '0 1.5rem' }}>Send</button>
        </form>
      </div>
    </div>
  );
};

export default IssueChatModal;
