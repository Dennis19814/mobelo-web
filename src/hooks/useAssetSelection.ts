/**
 * Asset Selection Hook
 * Simplified icon/emoji selection logic extracted from complex form hooks
 */

import { useState, useCallback } from 'react';
import { LocalIconData, getIconKey } from '@/lib/local-icon-loader';
import { LocalEmojiData } from '@/lib/local-emoji-loader';

export type AssetType = 'icon' | 'emoji';

export interface AssetSelection {
  type: AssetType;
  icon?: LocalIconData;
  emoji?: LocalEmojiData;
}

export interface UseAssetSelectionOptions {
  initialSelection?: AssetSelection;
  onChange?: (selection: AssetSelection) => void;
}

export interface UseAssetSelectionReturn {
  selection: AssetSelection;
  setIcon: (icon: LocalIconData) => void;
  setEmoji: (emoji: LocalEmojiData) => void;
  clear: () => void;
  getAssetData: () => {
    iconName?: string;
    iconLibrary?: string;
    iconUrl?: string;
    emojiUnicode?: string;
    emojiShortcode?: string;
    emojiSource?: string;
    displayType: AssetType;
  };
}

export function useAssetSelection(options: UseAssetSelectionOptions = {}): UseAssetSelectionReturn {
  const { initialSelection, onChange } = options;

  const [selection, setSelection] = useState<AssetSelection>(
    initialSelection || { type: 'icon' }
  );

  const updateSelection = useCallback((newSelection: AssetSelection) => {
    setSelection(newSelection);
    onChange?.(newSelection);
  }, [onChange]);

  const setIcon = useCallback((icon: LocalIconData) => {
    const newSelection: AssetSelection = {
      type: 'icon',
      icon,
      emoji: undefined,
    };
    updateSelection(newSelection);
  }, [updateSelection]);

  const setEmoji = useCallback((emoji: LocalEmojiData) => {
    const newSelection: AssetSelection = {
      type: 'emoji',
      icon: undefined,
      emoji,
    };
    updateSelection(newSelection);
  }, [updateSelection]);

  const clear = useCallback(() => {
    const newSelection: AssetSelection = { type: 'icon' };
    updateSelection(newSelection);
  }, [updateSelection]);

  const getAssetData = useCallback(() => {
    if (selection.type === 'icon' && selection.icon) {
      return {
        iconName: selection.icon.name,
        iconLibrary: selection.icon.libraryKey,
        iconUrl: getIconKey(selection.icon),
        displayType: 'icon' as AssetType,
      };
    }

    if (selection.type === 'emoji' && selection.emoji) {
      return {
        emojiUnicode: selection.emoji.unicode,
        emojiShortcode: selection.emoji.shortcode,
        emojiSource: selection.emoji.source || selection.emoji.sourceKey || 'default',
        displayType: 'emoji' as AssetType,
      };
    }

    return { displayType: selection.type };
  }, [selection]);

  return {
    selection,
    setIcon,
    setEmoji,
    clear,
    getAssetData,
  };
}