'use client';
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LocalEmojiData, emojiLoader } from '@/lib/local-emoji-loader';

interface LocalEmojiProps {
  emojiData: LocalEmojiData;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const LocalEmoji: React.FC<LocalEmojiProps> = ({
  emojiData,
  size = 24,
  className = '',
  style = {},
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  // Direct URL to the SVG file (no loading needed)
  // Ensure the path starts with / and doesn't have double slashes
  const emojiUrl = emojiData.filePath.startsWith('/')
    ? emojiData.filePath
    : `/${emojiData.filePath}`;

  // If image failed, render unicode fallback
  if (imageError && emojiData.unicode) {
    try {
      const unicodeEmoji = String.fromCodePoint(parseInt(emojiData.unicode, 16));
      return (
        <div
          className={`inline-flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
          style={{
            width: size,
            height: size,
            fontSize: `${size * 0.8}px`,
            lineHeight: '1',
            ...style
          }}
          onClick={onClick}
          title={emojiData.name}
        >
          {unicodeEmoji}
        </div>
      );
    } catch (err) {
      // Invalid unicode - render placeholder
      return (
        <div
          className={`inline-flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
          style={{
            width: size,
            height: size,
            fontSize: `${size * 0.8}px`,
            lineHeight: '1',
            ...style
          }}
          onClick={onClick}
          title={emojiData.name}
        >
          😊
        </div>
      );
    }
  }

  // Render image if not errored yet
  return (
    <div
      className={`inline-flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        width: size,
        height: size,
        ...style
      }}
      onClick={onClick}
      title={emojiData.name}
    >
      <Image
        src={emojiUrl}
        alt={emojiData.name}
        width={size}
        height={size}
        style={{ filter: 'none' }}
        unoptimized={true}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

// Simple Emoji component for when you only have unicode or shortcode
interface SimpleLocalEmojiProps {
  unicode?: string;
  shortcode?: string;
  source?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const SimpleLocalEmoji: React.FC<SimpleLocalEmojiProps> = ({
  unicode,
  shortcode,
  source,
  ...props
}) => {
  const [emojiData, setEmojiData] = useState<LocalEmojiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmojiData = async () => {
      try {
        await emojiLoader.loadMetadata();

        let emoji: LocalEmojiData | undefined;

        if (unicode) {
          emoji = emojiLoader.getEmojiByUnicode(unicode, source);
        } else if (shortcode) {
          emoji = emojiLoader.getEmojiByShortcode(shortcode, source);
        }

        setEmojiData(emoji || null);
      } catch (error) {
        logger.error('Failed to load emoji data:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        setEmojiData(null);
      } finally {
        setLoading(false);
      }
    };

    loadEmojiData();
  }, [unicode, shortcode, source]);

  if (loading) {
    return (
      <div
        className={`inline-flex items-center justify-center ${props.className || ''}`}
        style={{ width: props.size || 24, height: props.size || 24, ...props.style }}
      >
        <div className="animate-pulse bg-gray-300 rounded" style={{ width: (props.size || 24) * 0.8, height: (props.size || 24) * 0.8 }} />
      </div>
    );
  }

  if (!emojiData) {
    // Fallback to unicode rendering if available
    if (unicode) {
      try {
        const unicodeEmoji = String.fromCodePoint(parseInt(unicode, 16));
        return (
          <div
            className={`inline-flex items-center justify-center ${props.className || ''} ${props.onClick ? 'cursor-pointer' : ''}`}
            style={{
              width: props.size || 24,
              height: props.size || 24,
              fontSize: (props.size || 24) * 0.8,
              lineHeight: 1,
              ...props.style
            }}
            onClick={props.onClick}
            title={shortcode || `Emoji ${unicode}`}
          >
            {unicodeEmoji}
          </div>
        );
      } catch (error) {
        // Invalid unicode, show placeholder
      }
    }

    return (
      <div
        className={`inline-flex items-center justify-center text-gray-400 ${props.className || ''}`}
        style={{ width: props.size || 24, height: props.size || 24, ...props.style }}
        title={`Emoji not found: ${unicode || shortcode}`}
      >
        😊
      </div>
    );
  }

  return <LocalEmoji emojiData={emojiData} {...props} />;
};

export default LocalEmoji;