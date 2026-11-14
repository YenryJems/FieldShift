export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance !== 'undefined';

export const speakFieldAdvisory = (
  text: string,
  languageCode: 'en' | 'ceb' | 'tl' = 'en',
  onEnd?: () => void,
): boolean => {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === 'en' ? 'en-US' : 'fil-PH';
    utterance.rate = 0.96;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onEnd?.();
    return false;
  }
};

export const stopFieldAdvisorySpeech = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speech cancellation errors on unsupported environments
  }
};
