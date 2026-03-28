import { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const CONTRACT_ADDRESS = "0xCA406a4678d0BEc8b7C4bcF18bAA9A9859d947C8";

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        console.log("no provider");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log("wallet connected");

      const resNonce = await fetch(`http://127.0.0.1:8000/auth/nonce/${address}`);
      if (!resNonce.ok) {
        console.log("get error");
        return;
      }

      const nonceData = await resNonce.json();
      const nonce = nonceData.nonce;
      console.log("nonce ok");

      const message = `Welcome to Beer Shop\n\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);
      console.log("sign ok");

      const resVerify = await fetch(`http://127.0.0.1:8000/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, signature })
      });

      if (!resVerify.ok) {
        console.log("verify error");
        return;
      }

      const verifyData = await resVerify.json();
      const jwt = verifyData.access_token;
      setToken(jwt);
      console.log("auth ok");

      if (username) {
        const resProfile = await fetch(`http://127.0.0.1:8000/profile/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ username })
        });

        if (resProfile.ok) {
          console.log("profile updated");
        } else {
          console.log("patch error");
        }
      }

      // auto redirect
      // navigate('/catalog');

    } catch (error) {
      console.log("process error");
    }
  };

  const handleTestPayment = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const abi = ["function payForOrder(string memory orderId) public payable"];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const amountInWei = ethers.parseEther("0.1");
      const dummyOrderId = "test_order_123";

      console.log("sending tx");
      const tx = await contract.payForOrder(dummyOrderId, { value: amountInWei });

      console.log("waiting for mine, hash:", tx.hash);
      await tx.wait();

      console.log("tx success");
      alert(`Успешно! Хэш: ${tx.hash}`);

    } catch (error) {
      console.log("payment error", error);
    }
  };

  return (
  <div style={{ padding: '20px' }}>
    <h2>login</h2>

    {!token && (
      <button
        onClick={handleConnect}
        style={{ padding: '10px', background: 'lightblue' }}
      >
        Connect Wallet
      </button>
    )}

    {token && (
      <div style={{ marginTop: '20px' }}>
        <p>token ok</p>
        <p style={{ wordBreak: 'break-all', fontSize: '12px', color: 'gray' }}>
          {token}
        </p>

        <button
          onClick={handleTestPayment}
          style={{ marginTop: '20px', padding: '10px', background: 'orange' }}
        >
          Тест оплаты (0.1 ETH)
        </button>
      </div>
    )}
  </div>
);
}