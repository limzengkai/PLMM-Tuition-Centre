import React from 'react';
import { Howl } from 'howler';

const CardSoundNotification = ({ soundFile }) => {
  const sound = new Howl({
    src: [soundFile],
    preload: true,
  });

  const playSound = () => {
    sound.play();
  };

  return (
    <button onClick={playSound} style={{ display: 'none' }} />
  );
};

export default CardSoundNotification;
