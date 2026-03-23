import { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

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

  return (
    <div style={{ padding: '20px' }}>
      <h2>login</h2>
      <input
        type="text"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <button onClick={handleConnect} style={{ padding: '5px 15px' }}>
        connect
      </button>

      {token && (
        <div style={{ marginTop: '20px' }}>
          <p>token ok</p>
          <p style={{ wordBreak: 'break-all', fontSize: '12px', color: 'gray' }}>
            {token}
          </p>
        </div>
      )}
    </div>
  );
}