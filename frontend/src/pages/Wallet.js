import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPlus, FiMinus, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice, formatDateTime, MIN_WALLET_TOPUP, MAX_WALLET_TOPUP } from '../utils/constants';
import './Wallet.css';

const Wallet = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await API.get('/wallet');
      setTransactions(data.transactions || []);
      updateUser({ walletBalance: data.balance });
    } catch (error) {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (!amount || amount < MIN_WALLET_TOPUP) {
      toast.error(`Minimum top-up is ${formatPrice(MIN_WALLET_TOPUP)}`);
      return;
    }
    if (amount > MAX_WALLET_TOPUP) {
      toast.error(`Maximum top-up is ${formatPrice(MAX_WALLET_TOPUP)}`);
      return;
    }

    setTopupLoading(true);
    try {
      const { data } = await API.post('/wallet/topup', { amount });
      
      // Open UPI intent
      if (data.upiLink) {
        window.location.href = data.upiLink;
      }

      // For demo: auto-confirm after 2 seconds
      setTimeout(async () => {
        try {
          const confirmRes = await API.post('/wallet/topup/confirm', {
            transactionId: data.transactionId,
            upiTransactionId: `UPI-${Date.now()}`
          });
          updateUser({ walletBalance: confirmRes.data.balance });
          toast.success(`${formatPrice(amount)} added to wallet!`);
          setShowTopup(false);
          setTopupAmount('');
          fetchWallet();
        } catch (err) {
          toast.error('Payment confirmation failed');
        }
        setTopupLoading(false);
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Top-up failed');
      setTopupLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-label">Current Balance</div>
        <div className="wallet-balance-amount">{formatPrice(user?.walletBalance || 0)}</div>
        <button className="btn btn-primary" onClick={() => setShowTopup(true)}>
          <FiPlus /> Add Money
        </button>
      </div>

      {/* Transactions */}
      <h3 className="wallet-txn-title">Transaction History</h3>
      
      {loading ? (
        <div className="spinner"></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💰</div>
          <p>No transactions yet. Top-up your wallet to get started!</p>
        </div>
      ) : (
        <div className="txn-list">
          {transactions.map(txn => (
            <div key={txn._id} className="txn-item">
              <div className="txn-icon">
                {txn.type === 'topup' ? '💰' : txn.type === 'refund' ? '↩️' : '🛒'}
              </div>
              <div className="txn-info">
                <div className="txn-desc">{txn.description}</div>
                <div className="txn-date">{formatDateTime(txn.createdAt)}</div>
              </div>
              <div className={`txn-amount ${txn.type === 'debit' ? 'debit' : 'credit'}`}>
                {txn.type === 'debit' ? '-' : '+'}{formatPrice(txn.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top-up Modal */}
      {showTopup && (
        <div className="overlay" onClick={() => !topupLoading && setShowTopup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiCreditCard /> Add Money</h3>
              <button className="modal-close" onClick={() => !topupLoading && setShowTopup(false)}>✕</button>
            </div>

            <div className="input-group">
              <label>Enter Amount (Min ₹{MIN_WALLET_TOPUP})</label>
              <div className="topup-input-wrap">
                <span className="topup-rupee">₹</span>
                <input
                  type="number"
                  className="input-field topup-input"
                  placeholder="0"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  min={MIN_WALLET_TOPUP}
                  max={MAX_WALLET_TOPUP}
                  autoFocus
                />
              </div>
            </div>

            <div className="quick-amounts">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  className={`quick-amount-btn ${topupAmount === String(amt) ? 'active' : ''}`}
                  onClick={() => setTopupAmount(String(amt))}
                >
                  {formatPrice(amt)}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount || parseInt(topupAmount) < MIN_WALLET_TOPUP}
            >
              {topupLoading ? 'Processing...' : `Pay ${topupAmount ? formatPrice(topupAmount) : ''} via UPI`}
            </button>
          </div>
        </div>
      )}

      <div className="fab-spacer"></div>
    </div>
  );
};

export default Wallet;
