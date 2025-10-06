/**
 * Safely plays an HTMLAudioElement, handling potential interruptions and providing debug events.
 * The play() method on an <audio> element returns a Promise which can be
 * rejected if the playback is interrupted by another play() call.
 * By catching this rejection, we prevent the browser from logging an error
 * to the console, making the audio playback more robust for rapid-fire events.
 * We also reset the audio's currentTime to ensure it plays from the start.
 */
export const playAudio = (audioElement: HTMLAudioElement | null, name: string) => {
  const dispatchStatus = (status: 'SUCCESS' | 'FAILED' | 'IGNORED') => {
    window.dispatchEvent(new CustomEvent('audio-play', { detail: { name, status } }));
  };

  if (!audioElement) {
    dispatchStatus('IGNORED');
    console.warn(`Audio element for "${name}" not found.`);
    return;
  }

  // Reset audio to the beginning to allow for rapid re-triggering
  audioElement.currentTime = 0;
  const playPromise = audioElement.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        dispatchStatus('SUCCESS');
      })
      .catch(error => {
        // This catch is crucial to prevent unhandled promise rejection warnings
        console.warn(`Audio playback for "${name}" failed or was interrupted:`, error);
        dispatchStatus('FAILED');
      });
  }
};
