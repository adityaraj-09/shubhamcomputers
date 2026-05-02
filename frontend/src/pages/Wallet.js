import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPlus, FiMinus, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice, formatDateTime, MIN_WALLET_TOPUP } from '../utils/constants';
import './Wallet.css';

const Wallet = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  const getRazorpay = () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK failed to load. Refresh and try again.');
      return null;
    }
    return window.Razorpay;
  };

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
    const amount = parseInt(topupAmount, 10);
    if (!amount || amount < MIN_WALLET_TOPUP) {
      toast.error(`Minimum top-up is ${formatPrice(MIN_WALLET_TOPUP)}`);
      return;
    }

    const RazorpayCheckout = getRazorpay();
    if (!RazorpayCheckout) return;

    setTopupLoading(true);
    try {
      const { data } = await API.post('/create-order', {
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: `wallet_${Date.now()}`,
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Shubink',
        description: `Wallet Top-up ${formatPrice(amount)}`,
        order_id: data.order_id,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#1f2937',
        },
        handler: async function (response) {
          try {
            const verifyRes = await API.post('/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            updateUser({ walletBalance: verifyRes.data.balance });
            toast.success(`${formatPrice(amount)} added to wallet!`);
            setShowTopup(false);
            setTopupAmount('');
            fetchWallet();
          } catch (verifyError) {
            toast.error(verifyError.response?.data?.error || 'Payment verification failed');
          } finally {
            setTopupLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setTopupLoading(false);
            toast('Payment cancelled');
          },
        },
      };

      const rzp = new RazorpayCheckout(options);
      rzp.on('payment.failed', function (response) {
        setTopupLoading(false);
        const reason = response?.error?.description || 'Payment failed';
        toast.error(reason);
      });
      rzp.open();
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
              {topupLoading ? 'Processing...' : `Pay ${topupAmount ? formatPrice(topupAmount) : ''}`}
            </button>
          </div>
        </div>
      )}

      <div className="fab-spacer"></div>
    </div>
  );
};

export default Wallet;
