import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const Hammer: React.FC = () => {
  const [hitCount, setHitCount] = useState(0);

  const handleHit = async () => {
    try {
      const result = await invoke('hammer_hit', { count: hitCount + 1 });
      setHitCount(result as number);
    } catch (error) {
      console.error('Error invoking hammer_hit:', error);
    }
  };

  return (
    <div>
      <h3>锤子</h3>
      <p>用于敲打钉子或其他物体的工具。</p>
      <button onClick={handleHit}>敲打</button>
      <p>敲打次数：{hitCount}</p>
    </div>
  );
};

export default Hammer;
