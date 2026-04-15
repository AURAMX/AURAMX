import React, { useState, useEffect } from 'react';
import { Text, TextStyle } from 'react-native';

/**
 * Premium Typing Animation Component
 * Types out the text character by character.
 */
export const TypingAnimation = ({ 
  text, 
  style, 
  speed = 50 
}: { 
  text: string, 
  style?: TextStyle, 
  speed?: number 
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <Text style={style}>{displayedText}</Text>;
};
